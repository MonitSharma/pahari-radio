import { describe, expect, it } from 'vitest'
import { cycleLength, orderForCycle, resolve, upNext } from './scheduler'
import type { Station, Track } from './types'

const track = (id: string, duration: number): Track => ({
  id,
  title: id,
  artist: 'test',
  duration,
})

const EPOCH = 1_700_000_000_000

const station = (durations: number[]): Station => ({
  slug: 'test',
  name: 'test',
  roman: 'test',
  tagline: '',
  epoch: EPOCH,
  tracks: durations.map((d, i) => track(`t${i}`, d)),
})

/** Three tracks, 100s each — cycle length 300s. */
const s3 = station([100, 100, 100])

describe('orderForCycle', () => {
  it('leaves the curated order intact on the first lap', () => {
    expect(orderForCycle(5, 0)).toEqual([0, 1, 2, 3, 4])
  })

  it('is a permutation, never a lossy shuffle', () => {
    for (const cycle of [1, 2, 7, 99, 12345]) {
      const order = orderForCycle(8, cycle)
      expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    }
  })

  it('is deterministic — the property the whole sync rests on', () => {
    expect(orderForCycle(20, 42)).toEqual(orderForCycle(20, 42))
  })

  it('actually reorders on later laps', () => {
    expect(orderForCycle(20, 1)).not.toEqual(orderForCycle(20, 0))
  })

  it('handles degenerate lengths', () => {
    expect(orderForCycle(0, 3)).toEqual([])
    expect(orderForCycle(1, 3)).toEqual([0])
  })
})

describe('resolve', () => {
  it('starts at the top of the first track at the epoch', () => {
    const r = resolve(EPOCH, s3)!
    expect(r.trackIndex).toBe(0)
    expect(r.offsetSec).toBe(0)
    expect(r.cycle).toBe(0)
    expect(r.slot).toBe(0)
  })

  it('reports the offset into the current track', () => {
    const r = resolve(EPOCH + 45_000, s3)!
    expect(r.trackIndex).toBe(0)
    expect(r.offsetSec).toBeCloseTo(45)
    expect(r.remainingSec).toBeCloseTo(55)
  })

  it('advances at an exact track boundary rather than sticking', () => {
    const r = resolve(EPOCH + 100_000, s3)!
    expect(r.slot).toBe(1)
    expect(r.offsetSec).toBe(0)
  })

  it('wraps to the next cycle at the end of the lap', () => {
    const r = resolve(EPOCH + 300_000, s3)!
    expect(r.cycle).toBe(1)
    expect(r.slot).toBe(0)
    expect(r.offsetSec).toBe(0)
  })

  it('keeps counting laps far into the future', () => {
    const r = resolve(EPOCH + 300_000 * 1000 + 150_000, s3)!
    expect(r.cycle).toBe(1000)
    expect(r.slot).toBe(1)
    expect(r.offsetSec).toBeCloseTo(50)
  })

  it('stays well-defined before the epoch (a listener with a slow clock)', () => {
    const r = resolve(EPOCH - 50_000, s3)!
    expect(r.cycle).toBe(-1)
    expect(r.slot).toBe(2)
    expect(r.offsetSec).toBeCloseTo(50)
    expect(r.offsetSec).toBeGreaterThanOrEqual(0)
  })

  it('never returns an offset outside the track it names', () => {
    // Sweep the whole cycle, plus a couple of laps either side.
    const s = station([37, 211, 5, 400, 128])
    const total = cycleLength(s)
    for (let t = -total * 2; t < total * 3; t += 3.7) {
      const r = resolve(EPOCH + t * 1000, s)!
      expect(r.offsetSec).toBeGreaterThanOrEqual(0)
      expect(r.offsetSec).toBeLessThan(r.track.duration)
      expect(r.remainingSec).toBeGreaterThan(0)
    }
  })

  it('two clients one second apart agree on the track', () => {
    const s = station([180, 240, 200, 300])
    for (let t = 0; t < cycleLength(s) * 3; t += 11) {
      const a = resolve(EPOCH + t * 1000, s)!
      const b = resolve(EPOCH + t * 1000 + 900, s)!
      // Either the same track, or a boundary crossed within that 0.9s.
      if (a.trackIndex === b.trackIndex) {
        expect(b.offsetSec - a.offsetSec).toBeCloseTo(0.9)
      } else {
        expect(a.remainingSec).toBeLessThanOrEqual(0.9)
      }
    }
  })

  it('handles a single-track station by looping it', () => {
    const s1 = station([60])
    expect(resolve(EPOCH + 30_000, s1)!.offsetSec).toBeCloseTo(30)
    const r = resolve(EPOCH + 90_000, s1)!
    expect(r.trackIndex).toBe(0)
    expect(r.offsetSec).toBeCloseTo(30)
    expect(r.cycle).toBe(1)
  })

  it('returns null rather than crashing on an empty station', () => {
    expect(resolve(EPOCH, station([]))).toBeNull()
  })

  it('returns null when every track has zero duration', () => {
    expect(resolve(EPOCH, station([0, 0]))).toBeNull()
  })
})

describe('upNext', () => {
  it('lists the following tracks in this lap', () => {
    const r = resolve(EPOCH, s3)!
    expect(upNext(r, s3, 2).map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('rolls over into the next lap at the end of the current one', () => {
    const r = resolve(EPOCH + 250_000, s3)! // last track of cycle 0
    const next = upNext(r, s3, 2)
    expect(next).toHaveLength(2)
    const nextOrder = orderForCycle(3, 1)
    expect(next[0].id).toBe(`t${nextOrder[0]}`)
    expect(next[1].id).toBe(`t${nextOrder[1]}`)
  })
})
