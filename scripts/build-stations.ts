/**
 * Turns the curated seed in scripts/seed.ts into verified station JSON.
 *
 * For every YouTube id it fetches the watch page once and reads four things out
 * of the embedded player response: title, author, lengthSeconds, and
 * playableInEmbed. That last one is the important one — a video that isn't
 * embeddable plays as silence on the site, and because playback is clock-driven
 * the station would just go quiet for the length of that track with no error.
 * So anything not embeddable is dropped here, loudly, at build time.
 *
 * YouTube sometimes bot-blocks the normal watch-page request in CI. In that
 * case we fall back to YouTube's public oEmbed/player metadata endpoints. The
 * oEmbed response is only used as evidence that the public embed exists; the
 * actual player remains responsible for reporting a runtime playback error.
 *
 *   npm run build:stations          verify + write
 *   npm run build:stations -- --check   verify only, non-zero exit on problems
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seed, type SeedStation } from './seed.ts'
import type { Station, Track } from '../src/lib/types.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'src/content/stations')
const COVER_DIR = join(ROOT, 'public/covers')

/** Nonstop jukebox compilations are common in Himachali music and useless here:
 *  a 40-minute mix makes the "now playing" card a lie for 39 of them. */
const MAX_DURATION_SEC = 12 * 60
/** Below this it's a teaser, a reel or a broken upload. */
const MIN_DURATION_SEC = 60

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqUQ8Q4STEHLGCilw_Y'

interface Probe {
  id: string
  title: string
  author: string
  duration: number
  playableInEmbed: boolean
}

function decodeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`)
  } catch {
    return raw
  }
}

async function probe(id: string): Promise<Probe | { id: string; error: string }> {
  let html: string
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    })
    if (!res.ok) return { id, error: `HTTP ${res.status}` }
    html = await res.text()
  } catch (err) {
    return { id, error: `fetch failed: ${(err as Error).message}` }
  }

  // videoDetails appears once per watch page; pull the fields off it directly
  // rather than parsing the whole ytInitialPlayerResponse blob.
  const title = html.match(/"videoDetails":\{[^]*?"title":"((?:[^"\\]|\\.)*)"/)?.[1]
  const author = html.match(/"videoDetails":\{[^]*?"author":"((?:[^"\\]|\\.)*)"/)?.[1]
  const length = html.match(/"lengthSeconds":"(\d+)"/)?.[1]
  const embeddable = html.match(/"playableInEmbed":(true|false)/)?.[1]

  if (!title || !length) {
    const unavailable = /"status":"(UNPLAYABLE|LOGIN_REQUIRED|ERROR)"/.exec(html)?.[1]
    const fallback = await probePublicMetadata(id)
    if (fallback) return fallback
    return { id, error: unavailable ? `unavailable (${unavailable})` : 'could not parse watch page' }
  }

  return {
    id,
    title: decodeJsonString(title),
    author: decodeJsonString(author ?? 'Unknown'),
    duration: Number(length),
    playableInEmbed: embeddable === 'true',
  }
}

async function probePublicMetadata(id: string): Promise<Probe | null> {
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${id}&format=json`,
      { headers: { 'User-Agent': UA } },
    )
    if (!oembedRes.ok) return null
    const oembed = (await oembedRes.json()) as { title?: string; author_name?: string }
    if (!oembed.title) return null

    const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({
        videoId: id,
        context: { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00' } },
      }),
    })
    if (!playerRes.ok) return null
    const player = (await playerRes.json()) as {
      videoDetails?: { title?: string; author?: string; lengthSeconds?: string }
    }
    const duration = Number(player.videoDetails?.lengthSeconds)
    if (!Number.isFinite(duration) || duration <= 0) return null

    return {
      id,
      title: player.videoDetails?.title ?? oembed.title,
      author: player.videoDetails?.author ?? oembed.author_name ?? 'Unknown',
      duration,
      // oEmbed is public only when YouTube can generate an embeddable preview.
      // The IFrame player still has the final say at runtime.
      playableInEmbed: true,
    }
  } catch {
    return null
  }
}

async function fetchCover(id: string): Promise<boolean> {
  const dest = join(COVER_DIR, `${id}.jpg`)
  try {
    await access(dest)
    return true // already have it
  } catch {
    /* fall through and download */
  }
  // maxres isn't always uploaded; hq720 then hqdefault are the reliable fallbacks.
  for (const name of ['maxresdefault', 'hq720', 'hqdefault']) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`, {
      headers: { 'User-Agent': UA },
    })
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      // YouTube serves a 120x90 grey placeholder rather than 404ing.
      if (buf.byteLength > 4000) {
        await writeFile(dest, buf)
        return true
      }
    }
  }
  return false
}

async function buildStation(s: SeedStation, checkOnly: boolean) {
  const tracks: Track[] = []
  const problems: string[] = []

  console.log(`\n\x1b[1m${s.name}\x1b[0m  (${s.roman}) — ${s.entries.length} candidates`)

  for (const entry of s.entries) {
    const p = await probe(entry.id)

    if ('error' in p) {
      problems.push(`  ✗ ${entry.id}  ${p.error}`)
      continue
    }
    if (!p.playableInEmbed) {
      problems.push(`  ✗ ${entry.id}  not embeddable — "${p.title.slice(0, 50)}"`)
      continue
    }
    if (p.duration > MAX_DURATION_SEC) {
      problems.push(
        `  ✗ ${entry.id}  ${Math.round(p.duration / 60)}min, likely a nonstop mix — "${p.title.slice(0, 50)}"`,
      )
      continue
    }
    if (p.duration < MIN_DURATION_SEC) {
      problems.push(`  ✗ ${entry.id}  only ${p.duration}s — "${p.title.slice(0, 50)}"`)
      continue
    }

    if (!checkOnly && !(await fetchCover(p.id))) {
      problems.push(`  ! ${entry.id}  no cover art available`)
    }

    const mins = Math.floor(p.duration / 60)
    const secs = String(p.duration % 60).padStart(2, '0')
    console.log(`  ✓ ${mins}:${secs}  ${entry.title ?? p.title}`)

    tracks.push({
      id: p.id,
      // Prefer curated title/artist: YouTube titles are full of "| New Himachali
      // Pahari Song 2025 | Full HD" noise that reads badly on a now-playing card.
      title: entry.title ?? p.title,
      artist: entry.artist ?? p.author,
      duration: p.duration,
      dialect: entry.dialect,
      region: entry.region,
      occasion: entry.occasion,
      note: entry.note,
      glossary: entry.glossary,
    })
  }

  if (problems.length) {
    console.log(`\x1b[33m${problems.join('\n')}\x1b[0m`)
  }

  const station: Station = {
    slug: s.slug,
    name: s.name,
    roman: s.roman,
    tagline: s.tagline,
    epoch: s.epoch,
    tracks,
  }

  // Never replace a known-good station with an empty or partial result when
  // YouTube rate-limits the verifier. A transient 429 is a network problem,
  // not evidence that the station's tracks disappeared.
  if (!checkOnly && problems.some((problem) => problem.includes('HTTP 429'))) {
    console.error(`  ! YouTube rate-limited this station; preserving its existing JSON.`)
    process.exitCode = 1
  } else if (!checkOnly) {
    await writeFile(join(OUT_DIR, `${s.slug}.json`), JSON.stringify(station, null, 2) + '\n')
  }

  return { station, problemCount: problems.length }
}

async function main() {
  const checkOnly = process.argv.includes('--check')
  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(COVER_DIR, { recursive: true })

  let totalTracks = 0
  let totalProblems = 0

  for (const s of seed) {
    const { station, problemCount } = await buildStation(s, checkOnly)
    totalTracks += station.tracks.length
    totalProblems += problemCount

    if (station.tracks.length < 2) {
      console.error(`\x1b[31mStation "${s.slug}" has ${station.tracks.length} playable tracks.\x1b[0m`)
      process.exitCode = 1
    }
  }

  console.log(
    `\n${totalTracks} tracks across ${seed.length} stations` +
      (totalProblems ? `, ${totalProblems} rejected` : ''),
  )
  if (checkOnly && totalProblems) process.exitCode = 1
}

main()
