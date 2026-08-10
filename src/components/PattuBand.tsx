import { useId } from 'react'

/**
 * A woven band, after the geometry on a Kullu pattu border — stacked triangles
 * and diamonds between rules. Used as a divider and as the loading state.
 *
 * No viewBox: the SVG stays in pixel space so the <pattern> genuinely tiles
 * across whatever width it's given instead of one motif being stretched to fit.
 * `patternTransform` scales the 48×24 motif to the requested band height.
 */
export function PattuBand({
  color,
  height = 14,
  className = '',
  opacity = 0.9,
}: {
  color: string
  height?: number
  className?: string
  opacity?: number
}) {
  const id = useId()
  const scale = height / 24

  return (
    <svg
      className={className}
      style={{ height, width: '100%', display: 'block', opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width="48"
          height="24"
          patternUnits="userSpaceOnUse"
          patternTransform={`scale(${scale})`}
        >
          <g fill={color}>
            <rect x="0" y="0" width="48" height="2.5" />
            <rect x="0" y="21.5" width="48" height="2.5" />
            {/* Up- and down-pointing triangles, the core of the border motif. */}
            <path d="M 0 20 L 6 6 L 12 20 Z" />
            <path d="M 12 6 L 18 20 L 24 6 Z" />
            <path d="M 24 20 L 30 6 L 36 20 Z" />
            <path d="M 36 6 L 42 20 L 48 6 Z" />
            {/* Diamonds in the gaps. */}
            <path d="M 12 13 L 15 10 L 18 13 L 15 16 Z" opacity="0.55" />
            <path d="M 36 13 L 39 10 L 42 13 L 39 16 Z" opacity="0.55" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
