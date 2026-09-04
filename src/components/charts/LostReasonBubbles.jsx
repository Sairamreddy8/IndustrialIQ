import { useEffect, useState } from 'react'
import { BAR_SHADES } from './shades.js'
import { formatNumber, formatPercent } from '../../lib/format.js'

const MAX_DIAMETER = 78
const MIN_DIAMETER = 32

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Lost reasons as proportional bubbles.
 *
 * Diameter is scaled by the square root of the count, so it is the circle's
 * *area* that tracks the number — sizing by diameter directly would overstate
 * the big reasons by squaring them. Every bubble carries its own count, so
 * nothing rests on judging one circle against another.
 *
 * Fills alternate between the two blues as rhythm, matching the bar charts;
 * area is the encoding.
 */
export default function LostReasonBubbles({ rows }) {
  const [grown, setGrown] = useState(prefersReducedMotion)

  useEffect(() => {
    if (grown) return
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [grown])

  if (!rows.length) return null

  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <ul className="flex flex-wrap items-end justify-center gap-x-4 gap-y-4 pt-1">
      {rows.map((row, i) => {
        const diameter = Math.max(
          MIN_DIAMETER,
          MAX_DIAMETER * Math.sqrt(row.count / max),
        )
        return (
          <li key={row.reason} className="flex w-[8.5rem] flex-col items-center">
            <span
              className="grid shrink-0 place-items-center rounded-full text-sm font-semibold text-white transition-transform duration-500 ease-out"
              style={{
                width: `${diameter}px`,
                height: `${diameter}px`,
                background: BAR_SHADES[i % BAR_SHADES.length],
                transform: grown ? 'scale(1)' : 'scale(0.2)',
                transitionDelay: `${i * 60}ms`,
              }}
              role="img"
              aria-label={`${row.reason}: ${row.count} leads, ${formatPercent(row.share)} of losses`}
            >
              {formatNumber(row.count)}
            </span>
            <p className="mt-1.5 text-center text-[11px] leading-tight text-ink-2">
              {row.reason}
            </p>
            <p className="text-[11px] text-ink-3">{formatPercent(row.share)}</p>
          </li>
        )
      })}
    </ul>
  )
}
