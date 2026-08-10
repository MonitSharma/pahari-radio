import { useEffect, useRef } from 'react'
import { formatTime, upNext, type Resolution } from '../lib/scheduler'
import type { Station } from '../lib/types'
import { assetUrl } from '../lib/assets'
import { IconClose, IconExternal } from './icons'
import { PattuBand } from './PattuBand'

function Chip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-[10px] tracking-[0.14em] text-white/40 uppercase">{label}</div>
      <div className="mt-0.5 text-sm" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}

/**
 * "About this song" — the thing the reference site doesn't have.
 *
 * Deliberately not lyrics: a lot of this repertoire is in dialects a listener
 * from outside the valley can't follow, and what actually helps is knowing what
 * form it is, where it's from, what occasion it belongs to, and what the
 * recurring words mean.
 */
export function SongSheet({
  res,
  station,
  accent,
  onClose,
}: {
  res: Resolution
  station: Station
  accent: string
  onClose: () => void
}) {
  const { track } = res
  const next = upNext(res, station, 3)
  const hasEditorial = track.dialect || track.region || track.occasion || track.note
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )

      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previousFocusRef.current?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`About ${track.title}`}
        className="rise relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/12 bg-[#120d0b]/95 sm:rounded-3xl"
      >
        <PattuBand color={accent} height={12} opacity={0.5} />

        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <img
              src={assetUrl(`covers/${track.id}.jpg`)}
              alt=""
              className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl leading-tight text-white sm:text-3xl">
                {track.title}
              </h2>
              <p className="mt-1 text-white/60">{track.artist}</p>
              <p className="mt-1 text-sm text-white/35">
                {station.name} · {formatTime(track.duration)}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <IconClose />
            </button>
          </div>

          {(track.dialect || track.region || track.occasion) && (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {track.dialect && <Chip label="बोली · dialect" value={track.dialect} accent={accent} />}
              {track.region && <Chip label="इलाका · region" value={track.region} accent={accent} />}
              {track.occasion && <Chip label="मौका · occasion" value={track.occasion} accent={accent} />}
            </div>
          )}

          {track.note && (
            <p className="mt-5 text-[15px] leading-relaxed text-white/75">{track.note}</p>
          )}

          {track.glossary && track.glossary.length > 0 && (
            <section className="mt-6">
              <h3 className="text-[11px] tracking-[0.18em] text-white/40 uppercase">
                शब्दकोश · words in this song
              </h3>
              <dl className="mt-3 space-y-2.5">
                {track.glossary.map((entry) => (
                  <div key={entry.roman} className="flex flex-wrap items-baseline gap-x-2.5">
                    <dt className="font-display text-lg" style={{ color: accent }}>
                      {entry.word}
                    </dt>
                    <span className="text-sm text-white/35 italic">{entry.roman}</span>
                    <dd className="w-full text-sm text-white/65 sm:w-auto sm:flex-1">
                      {entry.meaning}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {!hasEditorial && (
            <p className="mt-5 text-[15px] leading-relaxed text-white/45">
              No notes on this one yet. The station plays plenty of songs that haven't been
              written up — the recording is the record.
            </p>
          )}

          <section className="mt-7">
            <h3 className="text-[11px] tracking-[0.18em] text-white/40 uppercase">
              आगे · up next
            </h3>
            <ol className="mt-3 space-y-2">
              {next.map((t, i) => (
                <li key={`${t.id}-${i}`} className="flex items-center gap-3">
                  <span className="w-4 text-xs tabular-nums text-white/25">{i + 1}</span>
                  <img
                    src={assetUrl(`covers/${t.id}.jpg`)}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 rounded-lg object-cover opacity-70"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white/80">{t.title}</p>
                    <p className="truncate text-xs text-white/40">{t.artist}</p>
                  </div>
                  <span className="text-xs tabular-nums text-white/30">
                    {formatTime(t.duration)}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <a
            href={`https://www.youtube.com/watch?v=${track.id}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-7 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
          >
            Open on YouTube <IconExternal />
          </a>
        </div>
      </div>
    </div>
  )
}
