const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconSpeaker = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)

export const IconMuted = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="m16 9 5 6M21 9l-5 6" />
  </svg>
)

export const IconPause = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20}>
    <path d="M8 5v14M16 5v14" />
  </svg>
)

export const IconPlay = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20}>
    <path d="m8 5 11 7-11 7V5Z" />
  </svg>
)

export const IconInfo = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.4" />
  </svg>
)

export const IconClose = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 20} height={p.size ?? 20}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const IconExternal = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 16} height={p.size ?? 16}>
    <path d="M14 5h5v5M19 5l-8 8" />
    <path d="M18 13.5V19H5V6h5.5" />
  </svg>
)

/** Animated level meter, shown only while sound is actually coming out. */
export const Equaliser = ({ color }: { color: string }) => (
  <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <rect
        key={i}
        className="eq-bar"
        x={i * 4.6}
        y="2"
        width="2.6"
        height="14"
        rx="1.3"
        fill={color}
        style={{ animationDelay: `${i * 140}ms` }}
      />
    ))}
  </svg>
)
