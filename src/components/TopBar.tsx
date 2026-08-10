import { useEffect, useState } from 'react'
import type { Station } from '../lib/types'
import { stations } from '../lib/stations'

function clockString(tz?: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  })
    .format(new Date())
    .toLowerCase()
}

/**
 * Shimla time is shown alongside the listener's own whenever they differ —
 * a station rooted in one place should say what time it is there.
 */
function Clock() {
  const [t, setT] = useState(() => ({ local: clockString(), shimla: clockString('Asia/Kolkata') }))

  useEffect(() => {
    const id = setInterval(
      () => setT({ local: clockString(), shimla: clockString('Asia/Kolkata') }),
      10_000,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-baseline gap-2 text-sm tabular-nums">
      <span className="text-white/85">{t.local}</span>
      {t.shimla !== t.local && (
        <span className="text-white/40">शिमला {t.shimla}</span>
      )}
    </div>
  )
}

export function TopBar({
  station,
  onSelect,
  accent,
}: {
  station: Station
  onSelect: (slug: string) => void
  accent: string
}) {
  return (
    <header className="flex flex-col gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="flex items-center justify-between gap-4">
        <Clock />
        <div className="flex items-center gap-2 text-xs tracking-[0.2em] text-white/45 uppercase">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: accent }}
          />
          on air
        </div>
      </div>

      {/* Horizontally scrollable on phones, where five stations won't fit. */}
      <nav
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none' }}
        aria-label="Stations"
      >
        {stations.map((s) => {
          const active = s.slug === station.slug
          return (
            <button
              key={s.slug}
              onClick={() => onSelect(s.slug)}
              aria-current={active ? 'true' : undefined}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap backdrop-blur-sm transition ${
                active
                  ? 'border-transparent text-black'
                  : 'border-white/15 text-white/70 hover:border-white/35 hover:text-white'
              }`}
              style={active ? { background: accent } : undefined}
            >
              {s.name}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
