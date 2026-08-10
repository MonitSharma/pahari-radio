import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { now } from './clock'
import { resolve, type Resolution } from './scheduler'
import type { Station } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

/** How far out of step we tolerate before seeking. Below about a second you
 *  fight YouTube's own buffering and seek constantly for no audible gain. */
const DRIFT_TOLERANCE_SEC = 2.5
/** After a load or seek, give the player time to settle before judging drift. */
const SETTLE_MS = 4000
const TICK_MS = 500

let apiPromise: Promise<any> | null = null

function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((res) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      res(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiPromise
}

export interface Radio {
  /** What the schedule says should be playing right now. */
  res: Resolution | null
  /** True once the listener has tapped through the autoplay gate. */
  tunedIn: boolean
  tuneIn: () => void
  /** The player is loaded and actually producing sound. */
  playing: boolean
  /** Local listening pause; resuming jumps back to the current live moment. */
  paused: boolean
  togglePaused: () => void
  /** Set when the current track won't play — pulled, or newly embed-blocked. */
  unavailable: boolean
  /** Seconds the player is ahead (+) or behind (-) the schedule. Diagnostics. */
  drift: number
  volume: number
  setVolume: (v: number) => void
  muted: boolean
  toggleMuted: () => void
  /** Container the hidden iframe mounts into. */
  mountRef: React.RefObject<HTMLDivElement | null>
}

export function useRadio(station: Station): Radio {
  const [tick, setTick] = useState(() => now())
  const [tunedIn, setTunedIn] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [drift, setDrift] = useState(0)
  const [volume, setVolumeState] = useState(80)
  const [muted, setMuted] = useState(false)

  const mountRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const loadedIdRef = useRef<string | null>(null)
  const settleUntilRef = useRef(0)
  const pausedRef = useRef(false)
  pausedRef.current = paused

  // The clock. Everything visual reads off this.
  useEffect(() => {
    const id = setInterval(() => setTick(now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const res = useMemo(() => resolve(tick, station), [tick, station])

  // Keep the schedule readable inside interval callbacks without re-creating
  // the player every tick.
  const resRef = useRef(res)
  resRef.current = res

  const tuneIn = useCallback(() => setTunedIn(true), [])

  // --- Build the player, once the listener has opted in. -------------------
  useEffect(() => {
    if (!tunedIn || !mountRef.current || playerRef.current) return
    let cancelled = false

    loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return
      const current = resRef.current
      playerRef.current = new YT.Player(mountRef.current, {
        height: '1',
        width: '1',
        videoId: current?.track.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          start: Math.floor(current?.offsetSec ?? 0),
          origin: location.origin,
        },
        events: {
          onReady: (e: any) => {
            loadedIdRef.current = current?.track.id ?? null
            settleUntilRef.current = Date.now() + SETTLE_MS
            e.target.setVolume(volume)
            if (!pausedRef.current) e.target.playVideo()
          },
          onStateChange: (e: any) => {
            if (pausedRef.current) {
              setPlaying(false)
              return
            }
            // 1 PLAYING, 3 BUFFERING — both mean the track is viable.
            if (e.data === 1) {
              setPlaying(true)
              setUnavailable(false)
            } else if (e.data !== 3) {
              setPlaying(false)
            }
          },
          onError: () => {
            // Build-time verification should prevent this, but videos get
            // pulled. Say so rather than sitting in silence.
            setUnavailable(true)
            setPlaying(false)
          },
        },
      })
    })

    return () => {
      cancelled = true
    }
    // volume is read once at construction; changes are handled by its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tunedIn])

  // --- Keep the player pinned to the schedule. ----------------------------
  useEffect(() => {
    if (!tunedIn || !res || paused) return
    const player = playerRef.current
    if (!player?.loadVideoById) return

    // Track changed — either the schedule rolled over, or the listener
    // switched station. Same handling either way.
    if (loadedIdRef.current !== res.track.id) {
      loadedIdRef.current = res.track.id
      settleUntilRef.current = Date.now() + SETTLE_MS
      setUnavailable(false)
      setDrift(0)
      player.loadVideoById({
        videoId: res.track.id,
        startSeconds: Math.max(0, res.offsetSec),
      })
      return
    }

    if (Date.now() < settleUntilRef.current) return
    if (typeof player.getCurrentTime !== 'function') return

    const actual = player.getCurrentTime()
    if (typeof actual !== 'number' || Number.isNaN(actual)) return

    const delta = actual - res.offsetSec
    setDrift(delta)

    if (Math.abs(delta) > DRIFT_TOLERANCE_SEC) {
      settleUntilRef.current = Date.now() + SETTLE_MS
      player.seekTo(res.offsetSec, true)
    }
  }, [tick, tunedIn, paused, res])

  // Switching station should cut over immediately rather than waiting for the
  // next tick, so the tap feels instant.
  useEffect(() => {
    loadedIdRef.current = null
  }, [station.slug])

  useEffect(() => {
    playerRef.current?.setVolume?.(volume)
  }, [volume])

  useEffect(() => {
    if (!playerRef.current) return
    if (muted) playerRef.current.mute?.()
    else playerRef.current.unMute?.()
  }, [muted])

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(100, v)))
  }, [])

  const toggleMuted = useCallback(() => setMuted((m) => !m), [])

  const togglePaused = useCallback(() => setPaused((current) => !current), [])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    if (paused) {
      player.pauseVideo?.()
      setPlaying(false)
      return
    }

    // Force the scheduler to load the current live position on the next tick.
    loadedIdRef.current = null
    setUnavailable(false)
  }, [paused])

  return {
    res,
    tunedIn,
    tuneIn,
    playing,
    paused,
    togglePaused,
    unavailable,
    drift,
    volume,
    setVolume,
    muted,
    toggleMuted,
    mountRef,
  }
}
