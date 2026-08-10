import { useEffect, useId, useMemo, useState } from 'react'
import type { Palette } from '../../lib/stations'

/**
 * The background. One parametric mountain scene, re-shaped per station.
 *
 * Drawn rather than photographed so it scales to any viewport, weighs nothing,
 * and doesn't drag a stock-photo look into a site about a specific place. The
 * ridgelines come from a seeded PRNG, so they're irregular the way real ones
 * are, but stable across renders and identical for every listener.
 */

const W = 1000
const H = 600

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Profile = 'jagged' | 'rolling' | 'terraced'
type Pt = [number, number]

/**
 * Generate a ridgeline as points.
 *
 * The thing that makes a silhouette read as mountains rather than dunes is
 * irregularity in *both* axes — peaks at uneven heights and uneven spacing.
 * Evenly spaced samples of a random height always come out looking like a
 * sawtooth or a row of blobs, so the x positions get jittered too.
 */
function ridgePoints(seed: number, baseY: number, amp: number, count: number, profile: Profile): Pt[] {
  const rand = mulberry32(seed)
  const pts: Pt[] = []

  // Walk across the frame in uneven strides, alternating crest and col.
  let x = -60
  let peak = rand() > 0.5
  while (x < W + 60) {
    let y: number
    if (peak) {
      // Crests vary a lot: an occasional dominant summit reads as scale.
      const dominance = rand() < 0.25 ? 1 : 0.45 + rand() * 0.4
      y = baseY - amp * dominance
    } else {
      y = baseY - amp * rand() * 0.22
    }
    if (profile === 'terraced') y = baseY - Math.round((baseY - y) / 16) * 16

    pts.push([x, y])
    const stride = (W / count) * (peak ? 0.55 + rand() * 0.95 : 0.4 + rand() * 0.7)
    x += stride
    peak = !peak
  }
  return pts
}

/**
 * Straight slopes with rounded summits and cols.
 *
 * Fully smoothing the points (Catmull-Rom) turns a ridgeline into a sine wave —
 * it reads as sand dunes, not mountains. Himachal's mid-hills are steep-sided
 * and only rounded at the very top, so keep the slopes linear and cut a small
 * quadratic corner at each vertex instead.
 */
function roundedPath(pts: Pt[], radius: number): string {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]

    const dIn = Math.hypot(x - px, y - py)
    const dOut = Math.hypot(nx - x, ny - y)
    const rIn = Math.min(radius, dIn / 2)
    const rOut = Math.min(radius, dOut / 2)

    const ax = x - ((x - px) / (dIn || 1)) * rIn
    const ay = y - ((y - py) / (dIn || 1)) * rIn
    const bx = x + ((nx - x) / (dOut || 1)) * rOut
    const by = y + ((ny - y) / (dOut || 1)) * rOut

    d += ` L ${ax} ${ay} Q ${x} ${y} ${bx} ${by}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last[0]} ${last[1]}`
  return d
}

function linePath(pts: Pt[]): string {
  return `M ${pts[0][0]} ${pts[0][1]}` + pts.slice(1).map((p) => ` L ${p[0]} ${p[1]}`).join('')
}

/** Height of the ridge at a given x, so things can be stood on top of it. */
function yAt(pts: Pt[], x: number): number {
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][0] >= x) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      const t = (x - x0) / (x1 - x0 || 1)
      return y0 + (y1 - y0) * t
    }
  }
  return pts[pts.length - 1][1]
}

/** Snow on the high summits — only for the stations above the treeline. */
function snowCaps(pts: Pt[], baseY: number, amp: number) {
  const caps: { d: string }[] = []
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]
    // A crest, and a high one.
    if (y >= pts[i - 1][1] || y >= pts[i + 1][1]) continue
    if (baseY - y < amp * 0.62) continue
    const dropL = Math.min(26, (pts[i][0] - pts[i - 1][0]) * 0.42)
    const dropR = Math.min(26, (pts[i + 1][0] - pts[i][0]) * 0.42)
    const h = 22
    // A ragged snowline rather than a clean triangle.
    caps.push({
      d: `M ${x} ${y} L ${x + dropR} ${y + h} L ${x + dropR * 0.45} ${y + h * 0.72} L ${x + dropR * 0.2} ${y + h * 0.95} L ${x - dropL * 0.3} ${y + h * 0.66} L ${x - dropL * 0.6} ${y + h * 0.92} L ${x - dropL} ${y + h} Z`,
    })
  }
  return caps
}

function Deodar({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  const w = h * 0.26
  const tiers = 5
  return (
    <g fill={fill}>
      <rect x={x - h * 0.012} y={y - h * 0.12} width={h * 0.024} height={h * 0.12} />
      {Array.from({ length: tiers }, (_, i) => {
        const t = i / (tiers - 1)
        const ty = y - h * 0.1 - t * h * 0.8
        const tw = (w / 2) * (1 - t * 0.72)
        const th = h * 0.24
        return <path key={i} d={`M ${x} ${ty - th} L ${x + tw} ${ty} L ${x - tw} ${ty} Z`} />
      })}
    </g>
  )
}

/** A Himachali hill temple: stacked slate roofs, wide eaves, on a plinth. */
function Temple({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  const roofs = [0, 1, 2, 3]
  return (
    <g fill={fill}>
      <rect x={x - 26 * s} y={y - 30 * s} width={52 * s} height={30 * s} />
      {roofs.map((i) => {
        const ry = y - 30 * s - i * 22 * s
        const rw = (40 - i * 6) * s + 10 * s
        return (
          <path
            key={i}
            d={`M ${x - rw} ${ry} L ${x - rw * 0.5} ${ry - 17 * s} L ${x + rw * 0.5} ${ry - 17 * s} L ${x + rw} ${ry} Z`}
          />
        )
      })}
      <rect x={x - 1.6 * s} y={y - 30 * s - 3 * 22 * s - 33 * s} width={3.2 * s} height={18 * s} />
      <path d={`M ${x} ${y - 30 * s - 3 * 22 * s - 36 * s} l ${5 * s} ${12 * s} l ${-10 * s} 0 Z`} />
    </g>
  )
}

/** Kath-kuni houses: stone-and-timber blocks under wide slate roofs. */
function Houses({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  const spec: [number, number, number][] = [
    [0, 0, 1],
    [50, 5, 0.8],
    [-46, 8, 0.7],
    [94, 1, 0.58],
    [-88, 12, 0.5],
  ]
  return (
    <g fill={fill}>
      {spec.map(([dx, dy, k], i) => {
        const hx = x + dx * s
        const hy = y + dy * s
        const w = 40 * s * k
        const h = 30 * s * k
        return (
          <g key={i}>
            <rect x={hx - w / 2} y={hy - h} width={w} height={h} />
            <path d={`M ${hx - w * 0.75} ${hy - h} L ${hx} ${hy - h - 14 * s * k} L ${hx + w * 0.75} ${hy - h} Z`} />
          </g>
        )
      })}
    </g>
  )
}

/** Prayer flags, strung between two poles. */
function Flags({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  const span = 130 * s
  const sag = 20 * s
  return (
    <g fill={fill}>
      <rect x={x - 1.5 * s} y={y - 64 * s} width={3 * s} height={64 * s} />
      <rect x={x + span - 1.5 * s} y={y - 46 * s} width={3 * s} height={46 * s} />
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i + 1) / 9
        const fx = x + span * t
        const fy = y - 64 * s + t * 18 * s + Math.sin(t * Math.PI) * sag
        return <rect key={i} x={fx} y={fy} width={6.5 * s} height={10 * s} opacity={0.85} />
      })}
    </g>
  )
}

const PROFILE: Record<string, Profile> = {
  nati: 'rolling',
  kullvi: 'rolling',
  kangri: 'terraced',
  chamba: 'jagged',
  devbhoomi: 'rolling',
}

/**
 * `slice` scales the artwork to cover the viewport, so a portrait screen shows
 * only a narrow column of it — around the middle 28% of the width on a phone.
 * Two things follow, and both are computed from how much of the 1000-unit
 * width actually survives the crop:
 *
 *  - anything placed off-centre for desktop falls outside the crop, so each
 *    station needs a second, recentred set of x positions;
 *  - a silhouette that reads as a distant temple on a wide screen fills half a
 *    phone, because it occupies a far larger share of the visible width — so
 *    the foreground scales down as the visible column narrows.
 */
function useViewport(): { narrow: boolean; fs: number } {
  const measure = () => {
    if (typeof window === 'undefined') return { narrow: false, fs: 1 }
    const { innerWidth: w, innerHeight: h } = window
    const scale = Math.max(w / W, h / H)
    const visible = w / scale // how many of the 1000 units are on screen
    return {
      narrow: visible < 700,
      fs: Math.min(1, Math.max(0.45, 0.45 + 0.55 * (visible / W))),
    }
  }

  const [vp, setVp] = useState(measure)
  useEffect(() => {
    const onResize = () => setVp(measure())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return vp
}

export function Scene({ slug, palette }: { slug: string; palette: Palette }) {
  const uid = useId().replace(/:/g, '')
  const profile = PROFILE[slug] ?? 'rolling'
  const { narrow, fs } = useViewport()

  // Seeded off the slug so each station keeps its own landscape between visits.
  const seed = useMemo(() => [...slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), [slug])

  const layers = useMemo(() => {
    const spec = [
      { baseY: 315, amp: 165, count: 7 },
      { baseY: 395, amp: 140, count: 6 },
      { baseY: 470, amp: 118, count: 5 },
      { baseY: 555, amp: 96, count: 4 },
    ]
    return spec.map((s, i) => {
      // The nearest layer is always soft — foothills sit in front of whatever
      // the high country is doing.
      const p: Profile = i === 3 ? 'rolling' : profile
      // Kangra is broad, low country — the same generator with sharp peaks
      // would make it look like the high Chamba passes.
      const ampScale = p === 'terraced' ? 0.68 : 1
      const countScale = p === 'terraced' ? 0.75 : 1
      const pts = ridgePoints(seed + i * 977, s.baseY, s.amp * ampScale, s.count * countScale, p)
      // Nearer ridges get a larger rounding radius: the far skyline stays crisp,
      // foothills soften.
      const crest =
        p === 'jagged' ? linePath(pts) : roundedPath(pts, p === 'terraced' ? 16 : 22 + i * 8)
      return {
        pts,
        crest,
        fill: `${crest} L ${W + 60} ${H + 40} L -60 ${H + 40} Z`,
        color: palette.ridges[i],
        snow: p === 'jagged' && i < 2 ? snowCaps(pts, s.baseY, s.amp) : [],
      }
    })
  }, [seed, profile, palette])

  // Foreground silhouettes stand on the third ridge, so the nearest one
  // partly occludes their bases — which is what sells the depth.
  const shelf = layers[2].pts
  const near = palette.ridges[3]
  const on = (x: number) => yAt(shelf, x) + 2

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="55%" stopColor={palette.sky[1]} />
          <stop offset="100%" stopColor={palette.sky[2]} />
        </linearGradient>
        <radialGradient id={`glow${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.disc} stopOpacity="0.5" />
          <stop offset="100%" stopColor={palette.disc} stopOpacity="0" />
        </radialGradient>
        <filter id={`grain${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#sky${uid})`} />

      <circle cx={715} cy={252} r={230} fill={`url(#glow${uid})`} />
      <circle cx={715} cy={252} r={44} fill={palette.disc} opacity={0.9} />

      {layers.map((l, i) => (
        <g key={i}>
          <path d={l.fill} fill={l.color} />
          {/* Rim light along the crest, catching the low sun. */}
          <path
            d={l.crest}
            fill="none"
            stroke={palette.disc}
            strokeWidth={1.4}
            opacity={0.16 + i * 0.03}
          />
          {l.snow.map((c, j) => (
            <path key={j} d={c.d} fill="#eef3ff" opacity={0.82} />
          ))}

          {/* Foreground sits between the third and fourth ridges, so the
              nearest one clips its base — which is what sells the depth.
              Wide layouts keep it clear of the middle third, where the
              wordmark and the tune-in button are; portrait recentres it. */}
          {i === 2 && (
            <>
              {slug === 'kullvi' &&
                (narrow ? [392, 412, 432, 578, 598] : [132, 176, 208, 842, 884]).map((x, k) => (
                  <Deodar key={k} x={x} y={on(x)} h={[128, 96, 112, 116, 88][k] * fs} fill={near} />
                ))}
              {slug === 'devbhoomi' && (
                <>
                  <Temple x={narrow ? 402 : 232} y={on(narrow ? 402 : 232)} s={1.05 * fs} fill={near} />
                  <Flags x={narrow ? 452 : 318} y={on(narrow ? 452 : 318)} s={0.8 * fs} fill={near} />
                </>
              )}
              {slug === 'nati' && (
                <Houses x={narrow ? 470 : 250} y={on(narrow ? 470 : 250)} s={0.95 * fs} fill={near} />
              )}
              {slug === 'kangri' && (
                <>
                  <Houses x={narrow ? 540 : 760} y={on(narrow ? 540 : 760)} s={0.75 * fs} fill={near} />
                  <Deodar x={narrow ? 410 : 168} y={on(narrow ? 410 : 168)} h={92 * fs} fill={near} />
                </>
              )}
              {slug === 'chamba' && (
                <>
                  <Flags x={narrow ? 400 : 150} y={on(narrow ? 400 : 150)} s={0.85 * fs} fill={near} />
                  <Deodar x={narrow ? 588 : 790} y={on(narrow ? 588 : 790)} h={78 * fs} fill={near} />
                  <Deodar x={narrow ? 608 : 824} y={on(narrow ? 608 : 824)} h={62 * fs} fill={near} />
                </>
              )}
            </>
          )}
        </g>
      ))}

      {/* Film grain — stops the flat fills from looking like clip art. */}
      <rect
        width={W}
        height={H}
        filter={`url(#grain${uid})`}
        opacity={0.13}
        style={{ mixBlendMode: 'overlay' }}
      />
    </svg>
  )
}
