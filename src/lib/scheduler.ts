import type { Station, Track } from './types'

/**
 * The sync engine.
 *
 * There is no server deciding what plays. Instead, every listener runs the same
 * pure function over the same wall clock, so they all independently arrive at
 * the same track and the same offset into it. That's the whole trick: agreement
 * without coordination.
 *
 * A station's tracks form a cycle of length `L = sum(durations)`. Time since the
 * station's epoch, modulo L, is the position within the current lap. Each lap
 * ("cycle") is shuffled by a PRNG seeded on the lap number — so the running
 * order varies but stays identical for everyone.
 */

export interface Resolution {
  /** Index into `station.tracks`. */
  trackIndex: number
  track: Track
  /** Seconds into that track right now. */
  offsetSec: number
  /** Which lap of the full playlist we're on. */
  cycle: number
  /** Position within this lap, 0-based — for the "track 7/48" readout. */
  slot: number
  /** Seconds until this track ends and the next begins. */
  remainingSec: number
  /** Playback order for the current lap, as indices into `station.tracks`. */
  order: number[]
}

/** mulberry32 — small, fast, and identical across every JS engine. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A deterministic permutation of [0, n). Seeded on the cycle number, so two
 * listeners on the same lap always compute the same running order.
 *
 * Cycle 0 is left unshuffled, so the curated order is what a station plays on
 * its first lap — worth having when you've deliberately sequenced the openers.
 */
export function orderForCycle(n: number, cycle: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i)
  if (cycle === 0 || n < 2) return order

  // Fisher-Yates. `cycle` can be negative for pre-epoch times; fold it into a
  // positive seed so the shuffle stays well-defined either side of the epoch.
  const rand = mulberry32(Math.abs(cycle) * 2654435761 + 1)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/** Total length of one full lap, in seconds. */
export function cycleLength(station: Station): number {
  return station.tracks.reduce((sum, t) => sum + t.duration, 0)
}

/**
 * What is playing on `station` at `nowMs`, and how far into it are we?
 *
 * Returns null only for a station with no playable tracks.
 */
export function resolve(nowMs: number, station: Station): Resolution | null {
  const n = station.tracks.length
  if (n === 0) return null

  const total = cycleLength(station)
  if (total <= 0) return null

  const deltaSec = (nowMs - station.epoch) / 1000
  const cycle = Math.floor(deltaSec / total)
  // Floored modulo: always lands in [0, total), including before the epoch.
  const elapsed = deltaSec - cycle * total

  const order = orderForCycle(n, cycle)

  let acc = 0
  for (let slot = 0; slot < n; slot++) {
    const trackIndex = order[slot]
    const track = station.tracks[trackIndex]
    if (elapsed < acc + track.duration) {
      const offsetSec = elapsed - acc
      return {
        trackIndex,
        track,
        offsetSec,
        cycle,
        slot,
        remainingSec: track.duration - offsetSec,
        order,
      }
    }
    acc += track.duration
  }

  // Unreachable: elapsed < total, so some track always contains it. Floating
  // point could in principle land us exactly on `total` — fall back to the last
  // slot rather than returning null and silencing the station.
  const slot = n - 1
  const trackIndex = order[slot]
  const track = station.tracks[trackIndex]
  return {
    trackIndex,
    track,
    offsetSec: track.duration,
    cycle,
    slot,
    remainingSec: 0,
    order,
  }
}

/** The next few tracks after the current one, for an "up next" readout. */
export function upNext(res: Resolution, station: Station, count = 3): Track[] {
  const out: Track[] = []
  const n = station.tracks.length
  for (let i = 1; i <= count && i < n + 1; i++) {
    const slot = res.slot + i
    if (slot < n) {
      out.push(station.tracks[res.order[slot]])
    } else {
      // Peek into the next lap, which is just as deterministic as this one.
      const nextOrder = orderForCycle(n, res.cycle + 1)
      out.push(station.tracks[nextOrder[slot - n]])
    }
  }
  return out
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
