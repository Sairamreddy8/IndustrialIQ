/**
 * A stat tile. The hero number is the chart — no sparkline, no decoration.
 *
 * `tone` colours only the supporting line, and always beside words, so colour
 * is never the only thing carrying the meaning. It uses the readable ink step
 * of each hue: the mark steps are built for fills, not for 12px type.
 *
 * `accent` is the rule along the top. It is wayfinding rather than encoding —
 * it says which of the five stories a tile belongs to, so the violet on "Open
 * pipeline" points at the violet rings further down the page, and the aqua on
 * "Lead to delivery" at the aqua source bars.
 */
const TONE_CLASS = {
  neutral: 'text-ink-2',
  good: 'text-good-ink',
  warning: 'text-warning-ink',
  critical: 'text-critical-ink',
}

const ACCENT_CLASS = {
  volume: 'bg-series',
  good: 'bg-good',
  warning: 'bg-warning',
  critical: 'bg-critical',
  demand: 'bg-demand',
}

export default function KpiCard({
  label,
  value,
  detail,
  tone = 'neutral',
  accent = 'volume',
  className = '',
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-hairline bg-surface p-4 sm:p-5 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${ACCENT_CLASS[accent] ?? ACCENT_CLASS.volume}`}
      />
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {value}
      </p>
      {detail && <p className={`mt-1.5 text-xs ${TONE_CLASS[tone]}`}>{detail}</p>}
    </div>
  )
}
