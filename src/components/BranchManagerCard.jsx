import { daysBetween } from '../lib/data.js'
import { formatDate } from '../lib/format.js'

/**
 * The person accountable for this branch, at the top of the drill-down.
 *
 * The dataset carries no phone or email for sales reps — `sales_reps` records
 * hold only id, name, branch_id, role and joined — so this shows the identifying
 * detail that genuinely exists rather than inventing contact details. Wiring in
 * a real directory means adding those fields to the source data.
 */
export default function BranchManagerCard({ manager, asOf }) {
  if (!manager) return null

  const joined = new Date(manager.joined)
  const years = daysBetween(asOf, joined) / 365.25
  const initials = manager.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-hairline bg-surface p-4 sm:px-5">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-series-soft text-sm font-semibold text-series-deep"
      >
        {initials}
      </span>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-ink-3">Branch manager</p>
        <p className="text-base font-semibold tracking-tight text-ink">{manager.name}</p>
      </div>

      <dl className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <Field label="Employee ID" value={manager.id} />
        <Field label="With the group" value={`${years.toFixed(1)} yrs`} />
        <Field label="Joined" value={formatDate(joined)} />
      </dl>
    </section>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="tnum mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  )
}
