/**
 * A stat tile. The hero number is the chart — no sparkline, no decoration.
 * `tone` colours only the supporting line, and always beside words, so the
 * colour is never the only thing carrying the meaning.
 */
const TONE_CLASS = {
  neutral: 'text-ink-2',
  good: 'text-good-ink',
  warning: 'text-serious',
  critical: 'text-critical',
}

export default function KpiCard({ label, value, detail, tone = 'neutral' }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {value}
      </p>
      {detail && <p className={`mt-1.5 text-xs ${TONE_CLASS[tone]}`}>{detail}</p>}
    </div>
  )
}
