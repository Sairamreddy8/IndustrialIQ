import { useEffect, useState } from 'react'
import { formatNumber, formatPercent } from '../lib/format.js'

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Enquiry demand per model as circular progress counters.
 *
 * Each ring is scaled against the most-enquired model rather than against the
 * total, so the leader closes a full circle and the rest read as a share of it
 * — the same convention as the meters in the branch table. The exact share of
 * all leads is printed under each ring, so nothing depends on reading an arc
 * precisely.
 */
export default function ModelEnquiryCounter({ rows }) {
  const [filled, setFilled] = useState(prefersReducedMotion)

  useEffect(() => {
    if (filled) return
    const id = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(id)
  }, [filled])

  if (!rows.length) return null

  const max = Math.max(...rows.map((r) => r.count), 1)
  const total = rows.reduce((sum, r) => sum + r.count, 0)

  return (
    <div>
      {/* Two rows of four: seven models fill all but the last cell. */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
        {rows.map((row, i) => {
          const portion = filled ? row.count / max : 0
          return (
            <li key={row.model} className="flex flex-col items-center text-center">
              <div
                className="relative"
                role="img"
                aria-label={`${row.model}: ${row.count} enquiries, ${formatPercent(row.share)} of all leads`}
              >
                <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r={RADIUS}
                    fill="none"
                    stroke="var(--color-hairline)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={RADIUS}
                    fill="none"
                    stroke="var(--color-series)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - portion)}
                    className="transition-[stroke-dashoffset] duration-700 ease-out"
                    // Rings close in order, strongest first.
                    style={{ transitionDelay: `${i * 70}ms` }}
                  />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-lg font-semibold tracking-tight text-ink">
                  {formatNumber(row.count)}
                </span>
              </div>

              <p
                className="mt-2 w-full truncate text-xs font-medium text-ink"
                title={row.model}
              >
                {row.model}
              </p>
              <p className="text-[11px] text-ink-3">{formatPercent(row.share)} of leads</p>
            </li>
          )
        })}
      </ul>

      <p className="mt-5 border-t border-hairline pt-3 text-xs text-ink-3">
        {formatNumber(total)} enquiries across {rows.length} models · rings are relative
        to {rows[0].model}, the most enquired
      </p>
    </div>
  )
}
