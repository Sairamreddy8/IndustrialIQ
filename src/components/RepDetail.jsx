import LeadTable from './LeadTable.jsx'
import StateMessage from './StateMessage.jsx'
import { formatINR, formatNumber, formatPercent } from '../lib/format.js'

/**
 * Rep-level detail, rendered inline inside the expanded leaderboard row.
 *
 * Deliberately a stat strip plus the rep's own leads rather than another set
 * of charts: the branch funnel one panel up already shows where deals are
 * lost, and per-rep funnels on a dozen leads are noise, not signal. What a
 * manager actually wants here is which records this person is sitting on.
 */
export default function RepDetail({ rep, leads }) {
  if (!rep.leadCount) {
    return (
      <StateMessage
        title={`${rep.name} holds no leads directly`}
        body={
          rep.role === 'branch_manager'
            ? 'Branch managers in this dataset do not carry their own book — their branch numbers are on the panel above.'
            : 'No leads have been assigned to this rep in the selected period.'
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Leads" value={formatNumber(rep.leadCount)} />
        <Stat label="Delivered" value={formatNumber(rep.deliveredCount)} />
        <Stat label="Conversion" value={formatPercent(rep.conversionRate)} />
        <Stat label="Revenue" value={formatINR(rep.revenue)} />
        <Stat label="Open pipeline" value={formatINR(rep.openValue)} />
        <Stat label="Never contacted" value={formatNumber(rep.neverContacted)} />
      </dl>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">
          Leads
        </h4>
        <LeadTable leads={leads} limit={10} />
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="tnum mt-0.5 text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}
