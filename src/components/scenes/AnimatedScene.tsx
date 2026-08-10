import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { Palette } from '../../lib/stations'

const CONIFER =
  'polygon(50% 0%, 78% 34%, 62% 34%, 88% 66%, 66% 66%, 100% 100%, 0% 100%, 34% 66%, 12% 66%, 38% 34%, 22% 34%)'
const PINE = 'polygon(50% 0%, 72% 46%, 60% 46%, 84% 100%, 16% 100%, 40% 46%, 28% 46%)'
const BROAD =
  'polygon(50% 4%, 74% 22%, 82% 54%, 62% 74%, 58% 100%, 42% 100%, 38% 74%, 18% 54%, 26% 22%)'

interface SceneDef {
  h: [string, string, string]
  cp: [string, string, string]
  tree: string
  trees: number
  house: boolean
  flags: boolean
  temple: boolean
  orchard: boolean
  snow: boolean
  terrace: boolean
}

/** Each station has its own landscape language and regional details. */
const SCENES: Record<string, SceneDef> = {
  nati: {
    h: ['62%', '50%', '34%'],
    cp: [
      'polygon(0% 62%, 6% 44%, 12% 52%, 19% 28%, 26% 41%, 33% 22%, 41% 38%, 48% 26%, 56% 44%, 64% 30%, 72% 47%, 80% 33%, 88% 49%, 95% 38%, 100% 52%, 100% 100%, 0% 100%)',
      'polygon(0% 54%, 8% 38%, 16% 50%, 24% 30%, 34% 46%, 44% 32%, 54% 48%, 63% 34%, 73% 50%, 82% 36%, 91% 52%, 100% 42%, 100% 100%, 0% 100%)',
      'polygon(0% 46%, 10% 26%, 22% 42%, 33% 22%, 46% 40%, 58% 24%, 70% 40%, 82% 26%, 92% 42%, 100% 32%, 100% 100%, 0% 100%)',
    ],
    tree: CONIFER, trees: 22, house: true, flags: true, temple: false, orchard: false, snow: false, terrace: false,
  },
  kullvi: {
    h: ['66%', '46%', '26%'],
    cp: [
      'polygon(0% 18%, 14% 34%, 30% 56%, 44% 68%, 50% 70%, 58% 66%, 72% 52%, 86% 32%, 100% 14%, 100% 100%, 0% 100%)',
      'polygon(0% 30%, 16% 46%, 34% 62%, 50% 70%, 66% 60%, 84% 44%, 100% 28%, 100% 100%, 0% 100%)',
      'polygon(0% 58%, 20% 50%, 40% 56%, 60% 48%, 80% 56%, 100% 50%, 100% 100%, 0% 100%)',
    ],
    tree: PINE, trees: 14, house: true, flags: false, temple: false, orchard: true, snow: false, terrace: false,
  },
  kangri: {
    h: ['54%', '40%', '30%'],
    cp: [
      'polygon(0% 56%, 10% 40%, 20% 50%, 32% 34%, 44% 46%, 56% 30%, 68% 44%, 80% 32%, 90% 46%, 100% 38%, 100% 100%, 0% 100%)',
      'polygon(0% 62%, 14% 52%, 28% 60%, 44% 48%, 60% 58%, 76% 46%, 90% 58%, 100% 50%, 100% 100%, 0% 100%)',
      'polygon(0% 44%, 18% 38%, 36% 44%, 54% 36%, 72% 44%, 88% 38%, 100% 44%, 100% 100%, 0% 100%)',
    ],
    tree: BROAD, trees: 18, house: true, flags: false, temple: false, orchard: false, snow: false, terrace: true,
  },
  chamba: {
    h: ['74%', '52%', '28%'],
    cp: [
      'polygon(0% 60%, 8% 40%, 15% 48%, 24% 16%, 33% 40%, 40% 30%, 50% 6%, 60% 34%, 68% 22%, 78% 44%, 86% 26%, 94% 46%, 100% 36%, 100% 100%, 0% 100%)',
      'polygon(0% 52%, 12% 34%, 22% 46%, 34% 22%, 46% 44%, 58% 26%, 70% 46%, 82% 30%, 92% 48%, 100% 38%, 100% 100%, 0% 100%)',
      'polygon(0% 50%, 16% 40%, 32% 50%, 50% 38%, 68% 50%, 84% 40%, 100% 50%, 100% 100%, 0% 100%)',
    ],
    tree: PINE, trees: 6, house: false, flags: true, temple: false, orchard: false, snow: true, terrace: false,
  },
  devbhoomi: {
    h: ['58%', '44%', '32%'],
    cp: [
      'polygon(0% 58%, 12% 42%, 22% 50%, 34% 26%, 46% 44%, 58% 28%, 70% 46%, 82% 30%, 92% 48%, 100% 40%, 100% 100%, 0% 100%)',
      'polygon(0% 50%, 14% 36%, 26% 48%, 40% 30%, 54% 46%, 68% 32%, 82% 48%, 94% 36%, 100% 46%, 100% 100%, 0% 100%)',
      'polygon(0% 40%, 12% 30%, 26% 24%, 40% 30%, 56% 42%, 72% 34%, 86% 42%, 100% 34%, 100% 100%, 0% 100%)',
    ],
    tree: CONIFER, trees: 16, house: false, flags: true, temple: true, orchard: false, snow: false, terrace: false,
  },
}

const FLAG_COLORS = ['#e0483a', '#f0f0ea', '#f2c14a', '#4d8f5e', '#3f6fb0']
const rnd = (i: number, n: number) => (((Math.sin(i * 12.9898 + n) * 43758.5453) % 1) + 1) % 1

function mix(a: string, b: string, t: number) {
  const parse = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const v = (x: number, y: number) => Math.round(x + (y - x) * Math.min(1, Math.max(0, t))).toString(16).padStart(2, '0')
  return '#' + v(r1, r2) + v(g1, g2) + v(b1, b2)
}

const stars = Array.from({ length: 46 }, (_, i) => ({
  left: `${(rnd(i, 1) * 100).toFixed(2)}%`, top: `${(rnd(i, 2) * 68).toFixed(2)}%`,
  size: `${(1 + rnd(i, 3) * 1.8).toFixed(1)}px`, dur: `${(3 + rnd(i, 4) * 5).toFixed(1)}s`, delay: `${(rnd(i, 5) * 6).toFixed(1)}s`,
}))
const treeScatter = Array.from({ length: 22 }, (_, i) => ({
  w: `${(22 + rnd(i, 6) * 20).toFixed(0)}px`, h: `${(52 + rnd(i, 7) * 62).toFixed(0)}px`, drop: `${(-4 - rnd(i, 8) * 10).toFixed(0)}px`,
  dur: `${(5 + rnd(i, 9) * 4).toFixed(1)}s`, delay: `${(rnd(i, 10) * 4).toFixed(1)}s`,
}))
const orchard = Array.from({ length: 11 }, (_, i) => ({ w: 26 + (i % 3) * 8, dur: `${(5.5 + (i % 4) * 0.7).toFixed(1)}s`, delay: `${(i * 0.33).toFixed(2)}s` }))
const flags = [...FLAG_COLORS, ...FLAG_COLORS, ...FLAG_COLORS.slice(0, 2)].map((color, i) => ({ color, h: 16 + (i % 3) * 4, dur: `${(2.4 + (i % 4) * 0.45).toFixed(2)}s`, delay: `${(i * 0.17).toFixed(2)}s` }))

export function AnimatedScene({ slug, palette }: { slug: string; palette: Palette }) {
  const root = useRef<HTMLDivElement>(null)
  const disc = useRef<HTMLDivElement>(null)
  const scene = SCENES[slug] ?? SCENES.nati
  const trees = useMemo(() => treeScatter.slice(0, scene.trees), [scene.trees])

  useEffect(() => {
    const tick = () => {
      const el = root.current
      const d = disc.current
      if (!el || !d) return
      const now = new Date()
      const hour = now.getHours() + now.getMinutes() / 60
      const day = hour >= 6 && hour <= 18.5
      const f = day ? (hour - 6) / 12.5 : (hour < 6 ? hour + 6 : hour - 18.5) / 11.5
      const clamped = Math.min(1, Math.max(0, f))
      const night = day ? Math.max(0, 1 - Math.sin(Math.PI * clamped) * 1.5) : 1
      d.style.left = `${8 + clamped * 84}%`
      d.style.top = `${66 - Math.sin(Math.PI * clamped) * 48}%`
      d.style.transform = day ? 'scale(1)' : 'scale(0.58)'
      el.style.setProperty('--night', night.toFixed(2))
      el.style.setProperty('--disc', day ? palette.disc : mix(palette.disc, '#cfe0f2', 0.75))
      const nightSky = ['#05070c', '#080a12', '#0d1018']
      palette.sky.forEach((c, i) => el.style.setProperty(`--sky${i}`, mix(c, nightSky[i], night * 0.88)))
      palette.ridges.forEach((c, i) => el.style.setProperty(`--r${i}`, mix(c, '#070609', night * 0.6)))
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [palette])

  const vars = {
    '--h0': scene.h[0], '--h1': scene.h[1], '--h2': scene.h[2], '--cp0': scene.cp[0], '--cp1': scene.cp[1], '--cp2': scene.cp[2],
    '--tree': scene.tree, '--night': '0.25', '--disc': palette.disc, '--sky0': palette.sky[0], '--sky1': palette.sky[1], '--sky2': palette.sky[2],
    '--r0': palette.ridges[0], '--r1': palette.ridges[1], '--r2': palette.ridges[2], '--r3': palette.ridges[3],
  } as CSSProperties

  return (
    <div ref={root} className="scene-anim absolute inset-0 overflow-hidden" style={vars} aria-hidden="true">
      <div className="absolute inset-0 transition-colors duration-1000" style={{ background: 'linear-gradient(to bottom, var(--sky0) 0%, var(--sky1) 46%, var(--sky2) 88%)' }} />
      <div className="absolute inset-x-0 top-0 bottom-[40%] transition-opacity duration-1000" style={{ opacity: 'var(--night)' as unknown as number }}>
        {stars.map((s, i) => <div key={i} className="absolute rounded-full bg-white" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animation: `twinkle ${s.dur} ease-in-out infinite`, animationDelay: s.delay }} />)}
      </div>
      <div ref={disc} className="absolute h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-95" style={{ background: 'radial-gradient(circle, var(--disc) 0%, var(--disc) 52%, rgba(255,255,255,0) 72%)' }}>
        <div className="absolute -inset-[30%] rounded-full opacity-35" style={{ background: 'radial-gradient(circle, var(--disc) 0%, rgba(0,0,0,0) 62%)', animation: 'breathe 9s ease-in-out infinite' }} />
      </div>
      <div className="absolute top-[34%] -left-[10%] -right-[10%] h-[120px] blur-2xl" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.16) 30%, rgba(255,255,255,0.05) 60%, transparent)', animation: 'drift 78s ease-in-out infinite alternate' }} />
      <div className="absolute -left-[6%] -right-[6%] bottom-0 opacity-90" style={{ height: 'var(--h0)', background: 'var(--r0)', clipPath: 'var(--cp0)', animation: 'drift 150s ease-in-out infinite alternate' }} />
      {scene.snow && <div className="absolute -left-[6%] -right-[6%] bottom-0" style={{ height: 'var(--h0)', clipPath: 'var(--cp0)', opacity: 0.9, background: 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 9%, rgba(255,255,255,0) 20%)' }} />}
      <div className="absolute -left-[8%] -right-[8%] bottom-0" style={{ height: 'var(--h1)', background: 'var(--r1)', clipPath: 'var(--cp1)', animation: 'driftBack 110s ease-in-out infinite alternate' }} />
      <div className="absolute -left-[4%] -right-[4%] bottom-0" style={{ height: 'var(--h2)', background: 'var(--r2)', clipPath: 'var(--cp2)' }} />
      {scene.terrace && <div className="absolute -left-[4%] -right-[4%] bottom-0" style={{ height: 'var(--h2)', clipPath: 'var(--cp2)', opacity: 0.75, background: 'repeating-linear-gradient(-3deg, rgba(255,255,255,0.13) 0 2px, rgba(0,0,0,0.16) 2px 4px, rgba(0,0,0,0) 4px 15px)' }} />}
      <div className="absolute -left-[14%] -right-[14%] bottom-[16%] h-[90px] opacity-50 blur-[22px]" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.28) 24%, rgba(255,255,255,0.08) 52%, rgba(255,255,255,0.22) 78%, transparent)', animation: 'driftBack 52s ease-in-out infinite alternate' }} />
      <div className="absolute inset-x-0 bottom-0 h-[20%]" style={{ background: 'var(--r3)', clipPath: 'polygon(0% 42%, 14% 30%, 30% 44%, 48% 28%, 66% 44%, 84% 30%, 100% 44%, 100% 100%, 0% 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 flex h-[22%] items-end gap-[2.6%] px-[3%]">
        {trees.map((t, i) => <div key={i} className="shrink-0 origin-bottom" style={{ width: t.w, height: t.h, marginBottom: t.drop, animation: `sway ${t.dur} ease-in-out infinite`, animationDelay: t.delay }}><div className="h-full w-full bg-[#0d0708]" style={{ clipPath: 'var(--tree)' }} /></div>)}
      </div>
      {scene.temple && <div className="absolute bottom-[12%] left-[14%] h-[150px] w-[120px]">
        <div className="absolute bottom-0 left-[14px] h-[56px] w-[92px] bg-[#100a08]" />
        <div className="absolute bottom-[52px] left-0 h-[26px] w-[120px] bg-[#0b0605]" style={{ clipPath: 'polygon(9% 100%, 24% 0%, 76% 0%, 91% 100%)' }} />
        <div className="absolute bottom-[74px] left-[16px] h-[24px] w-[88px] bg-[#0b0605]" style={{ clipPath: 'polygon(11% 100%, 27% 0%, 73% 0%, 89% 100%)' }} />
        <div className="absolute bottom-[94px] left-[32px] h-[22px] w-[56px] bg-[#0b0605]" style={{ clipPath: 'polygon(13% 100%, 30% 0%, 70% 0%, 87% 100%)' }} />
        <div className="absolute bottom-[114px] left-[57px] h-[26px] w-[5px] opacity-80" style={{ background: 'var(--disc)' }} />
        <div className="absolute bottom-[138px] left-[52px] h-[15px] w-[15px] rounded-full" style={{ background: 'var(--disc)', boxShadow: '0 0 26px 8px var(--disc)', animation: 'lamp 3.6s ease-in-out infinite' }} />
        <div className="absolute bottom-[14px] left-[40px] h-[34px] w-[40px] opacity-70" style={{ background: 'var(--disc)', boxShadow: '0 0 40px 16px var(--disc)', animation: 'lamp 5s ease-in-out infinite' }} />
      </div>}
      {scene.orchard && <div className="absolute inset-x-0 bottom-[15%] flex h-[70px] items-end justify-around px-[6%]">{orchard.map((o, i) => <div key={i} className="relative origin-bottom" style={{ width: o.w, height: o.w, animation: `sway ${o.dur} ease-in-out infinite`, animationDelay: o.delay }}><div className="absolute bottom-0 left-1/2 -ml-[1.5px] h-[42%] w-[3px] bg-[#0d0708]" /><div className="absolute top-0 left-0 h-[70%] w-full rounded-full bg-[#0d0708]" /></div>)}</div>}
      {scene.house && <div className="absolute bottom-[9%] left-[7%] h-[96px] w-[132px]">
        <div className="absolute bottom-0 left-0 h-[64px] w-full border-t-[3px] border-[#1c1110] bg-[#120a09]" />
        <div className="absolute bottom-[60px] -left-[8px] h-[22px] w-[148px] bg-[#0c0607]" style={{ clipPath: 'polygon(6% 100%, 18% 0%, 82% 0%, 94% 100%)' }} />
        <div className="absolute bottom-[78px] left-[96px] h-[22px] w-[14px] bg-[#0c0607]" />
        {[0, 2.3, 4.6].map((d) => <div key={d} className="absolute bottom-[100px] left-[98px] h-[10px] w-[10px] rounded-full bg-[#cfc4bb] opacity-0" style={{ animation: 'smoke 7s linear infinite', animationDelay: `${d}s` }} />)}
        <div className="absolute bottom-[18px] left-[22px] h-[30px] w-[26px]" style={{ background: 'var(--disc)', boxShadow: '0 0 34px 12px var(--disc)', animation: 'lamp 4.2s ease-in-out infinite' }} />
        <div className="absolute bottom-[20px] left-[74px] h-[24px] w-[20px] opacity-45" style={{ background: 'var(--disc)', animation: 'lamp 6.1s ease-in-out infinite' }} />
      </div>}
      {scene.flags && <div className="absolute right-[6%] bottom-[20%] h-[80px] w-[34%]"><div className="absolute inset-x-0 top-[16px] h-[2px] rounded bg-white/20" /><div className="absolute inset-x-0 top-[18px] flex justify-between">{flags.map((f, i) => <div key={i} className="w-[15px] origin-top opacity-85" style={{ height: f.h, background: f.color, animation: `flagWave ${f.dur} ease-in-out infinite`, animationDelay: f.delay }} />)}</div></div>}
    </div>
  )
}
