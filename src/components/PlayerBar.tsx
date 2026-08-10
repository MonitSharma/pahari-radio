import { formatTime, type Resolution } from '../lib/scheduler'
import type { Station } from '../lib/types'
import { assetUrl } from '../lib/assets'
import { Equaliser, IconInfo, IconMuted, IconPause, IconPlay, IconSpeaker } from './icons'

export function PlayerBar({
  res,
  station,
  accent,
  tunedIn,
  playing,
  paused,
  togglePaused,
  unavailable,
  muted,
  toggleMuted,
  volume,
  setVolume,
  onOpenInfo,
  infoOpen,
}: {
  res: Resolution
  station: Station
  accent: string
  tunedIn: boolean
  playing: boolean
  paused: boolean
  togglePaused: () => void
  unavailable: boolean
  muted: boolean
  toggleMuted: () => void
  volume: number
  setVolume: (v: number) => void
  onOpenInfo: () => void
  infoOpen: boolean
}) {
  const { track, offsetSec, slot } = res
  const pct = Math.min(100, (offsetSec / track.duration) * 100)
  const changeVolume = (next: number) => {
    if (muted && next > 0) toggleMuted()
    setVolume(next)
  }

  return (
    <div className="rise mx-auto w-full max-w-3xl rounded-2xl border border-white/12 bg-black/45 p-2.5 shadow-2xl backdrop-blur-xl sm:p-3">
      <div className="flex items-center gap-3">
        <img
          src={assetUrl(`covers/${track.id}.jpg`)}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {playing && !unavailable && <Equaliser color={accent} />}
            <p className="truncate font-medium text-white/95">{track.title}</p>
          </div>
          <p className="truncate text-sm text-white/55">{track.artist}</p>

          <div className="mt-2 flex items-center gap-2.5">
            <span className="w-9 shrink-0 text-[11px] tabular-nums text-white/45">
              {formatTime(offsetSec)}
            </span>
            <div
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.round(track.duration)}
              aria-valuenow={Math.round(offsetSec)}
              aria-label="Position in the current track"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${pct}%`, background: accent }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/45">
              {formatTime(track.duration)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {tunedIn && (
            <button
              onClick={togglePaused}
              aria-label={paused ? 'Resume live' : 'Pause'}
              title={paused ? 'Resume live' : 'Pause'}
              className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {paused ? <IconPlay /> : <IconPause />}
            </button>
          )}
          <div className="group relative flex items-center">
            <button
              onClick={toggleMuted}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {muted ? <IconMuted /> : <IconSpeaker />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => {
                changeVolume(Number(e.target.value))
              }}
              aria-label="Volume"
              className="hidden w-20 accent-white/80 sm:block"
              style={{ accentColor: accent }}
            />
          </div>

          <button
            onClick={onOpenInfo}
            aria-expanded={infoOpen}
            aria-label="About this song"
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <IconInfo />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1 pt-1.5 sm:hidden">
        <IconSpeaker size={16} />
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          aria-label="Volume"
          className="h-4 min-w-0 flex-1 accent-white/80"
          style={{ accentColor: accent }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-white/35">
        <span>
          {station.name} · ट्रैक {slot + 1}/{station.tracks.length}
        </span>
        {paused ? (
          <span role="status" aria-live="polite" className="text-white/65">
            रुका हुआ · Paused · resume live to listen now
          </span>
        ) : unavailable ? (
          <span role="status" aria-live="polite" className="text-amber-300/90">
            यह वीडियो उपलब्ध नहीं · Video unavailable · next in {formatTime(res.remainingSec)}
          </span>
        ) : (
          <span>−{formatTime(res.remainingSec)}</span>
        )}
      </div>
    </div>
  )
}
