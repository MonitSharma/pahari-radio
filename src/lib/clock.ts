/**
 * A shared clock, without a server that knows anything.
 *
 * Playback position is derived from wall-clock time, so a listener whose device
 * clock is wrong hears the wrong thing — and unlike ordinary streaming there's
 * no feedback that would let them notice. Most machines are within a second via
 * NTP, but phones that have been asleep, and desktops with a bad timezone
 * database, are reliably off by more.
 *
 * The fix costs one request: any HTTP response carries a `Date` header, so the
 * static host we're already served from doubles as a time source. Resolution is
 * one second, which is well inside the tolerance the player corrects for.
 */

let skewMs = 0
let synced = false

/** Server time minus local time, in ms. Zero until `syncClock` resolves. */
export function clockSkew(): number {
  return skewMs
}

export function isClockSynced(): boolean {
  return synced
}

/** Current time, corrected. Use this everywhere instead of Date.now(). */
export function now(): number {
  return Date.now() + skewMs
}

export async function syncClock(): Promise<void> {
  try {
    const t0 = Date.now()
    // Cache-bust: a cached response carries a stale Date and would be worse
    // than not syncing at all.
    const res = await fetch(`${location.pathname}?_t=${t0}`, {
      method: 'HEAD',
      cache: 'no-store',
    })
    const t1 = Date.now()
    const header = res.headers.get('date')
    if (!header) return

    const serverMs = new Date(header).getTime()
    if (!Number.isFinite(serverMs)) return

    // The header was written somewhere in the middle of the round trip, and is
    // truncated to the second — so add half the RTT and half a second back.
    const estimatedLocalAtServerStamp = t0 + (t1 - t0) / 2
    skewMs = serverMs + 500 - estimatedLocalAtServerStamp
    synced = true
  } catch {
    // Offline, or a host that strips the header. Fall back to the local clock:
    // most listeners are close enough that it still works.
  }
}
