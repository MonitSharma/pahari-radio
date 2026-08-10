import { useCallback, useEffect, useState } from 'react'
import { AnimatedScene } from './components/scenes/AnimatedScene'
import { TopBar } from './components/TopBar'
import { PlayerBar } from './components/PlayerBar'
import { SongSheet } from './components/SongSheet'
import { PattuBand } from './components/PattuBand'
import { paletteFor, stationBySlug } from './lib/stations'
import { useRadio } from './lib/useRadio'
import { syncClock } from './lib/clock'

/**
 * Hash routing, so /#/kullvi is a shareable link on any static host without
 * needing rewrite rules. Nothing here justifies a router dependency.
 */
function useHashRoute(): [string, (slug: string) => void] {
  const read = () => location.hash.replace(/^#\/?/, '') || 'nati'
  const [slug, setSlug] = useState(read)

  useEffect(() => {
    const onHash = () => setSlug(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((next: string) => {
    location.hash = `/${next}`
    setSlug(next)
  }, [])

  return [slug, go]
}

export default function App() {
  const [slug, go] = useHashRoute()
  const station = stationBySlug(slug)
  const palette = paletteFor(station.slug)
  const radio = useRadio(station)
  const [infoOpen, setInfoOpen] = useState(false)
  const closeInfo = useCallback(() => setInfoOpen(false), [])

  // One request, at startup: corrects a wrong device clock, which is the only
  // thing that can put a listener out of step with everyone else.
  useEffect(() => {
    void syncClock()
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', palette.accent)
  }, [palette.accent])

  useEffect(() => {
    document.title = radio.res
      ? `${radio.res.track.title} · ${station.name}`
      : 'पहाड़ी रेडियो · Pahari Radio'
  }, [radio.res, station.name])

  const { res } = radio

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <AnimatedScene slug={station.slug} palette={palette} />
        {/* Darken top and bottom so text stays readable over any part of the art. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/80" />
      </div>

      <TopBar station={station} onSelect={go} accent={palette.accent} />

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
        <h1
          key={station.slug}
          className="rise font-display text-[clamp(3.2rem,15vw,8.5rem)] leading-[0.92] text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]"
        >
          {station.name}
        </h1>

        <div className="mt-4 w-40 max-w-full">
          <PattuBand color={palette.accent} height={11} opacity={0.75} />
        </div>

        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
          {station.tagline}
        </p>

        {!radio.tunedIn && (
          <button
            onClick={radio.tuneIn}
            className="rise mt-8 rounded-full px-8 py-3.5 text-lg font-medium text-black shadow-xl transition hover:brightness-110 active:scale-[0.98]"
            style={{ background: palette.accent }}
          >
            सुनें · Tune in
          </button>
        )}

        {radio.tunedIn && (
          <p className="mt-6 max-w-sm text-xs leading-relaxed text-white/35">
            Everyone listening right now is hearing this same moment of this same song.
          </p>
        )}
      </main>

      <footer className="safe-area-footer px-3 sm:px-5">
        {res ? (
          <PlayerBar
            res={res}
            station={station}
            accent={palette.accent}
            tunedIn={radio.tunedIn}
            playing={radio.playing}
            paused={radio.paused}
            togglePaused={radio.togglePaused}
            unavailable={radio.unavailable}
            muted={radio.muted}
            toggleMuted={radio.toggleMuted}
            volume={radio.volume}
            setVolume={radio.setVolume}
            onOpenInfo={() => setInfoOpen(true)}
            infoOpen={infoOpen}
          />
        ) : (
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/40 p-4 text-center text-sm text-white/50">
            This station has no tracks yet.
          </div>
        )}
      </footer>

      {infoOpen && res && (
        <SongSheet
          res={res}
          station={station}
          accent={palette.accent}
          onClose={closeInfo}
        />
      )}

      {/* Audio source. Must stay mounted and non-display:none to keep playing. */}
      <div className="yt-sink">
        <div ref={radio.mountRef} />
      </div>
    </div>
  )
}
