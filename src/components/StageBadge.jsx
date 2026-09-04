import { STAGE_LABELS } from '../lib/constants.js'

/*
 * Stage is state, so it earns the reserved status colours — but each badge
 * carries its label, so the colour is never the only thing saying what it is.
 */
const STAGE_CLASS = {
  new: 'bg-hairline text-ink-2',
  contacted: 'bg-series-soft text-series-deep',
  test_drive: 'bg-series-soft text-series-deep',
  negotiation: 'bg-series-soft text-series-deep',
  order_placed: 'bg-series-soft text-series-deep',
  delivered: 'bg-good/12 text-good-ink',
  lost: 'bg-critical/12 text-critical-ink',
}

export default function StageBadge({ stage }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${
        STAGE_CLASS[stage] ?? 'bg-hairline text-ink-2'
      }`}
    >
      {STAGE_LABELS[stage] ?? stage}
    </span>
  )
}
