import StageBadge from './StageBadge.jsx'
import { SOURCE_LABELS } from '../lib/constants.js'
import { formatINR, formatNumber } from '../lib/format.js'

/**
 * The individual records behind every number above — the bottom of the
 * drill-down. Sorted by most recent activity so what the rep touched last is
 * at the top.
 */
export default function LeadTable({ leads, limit = 25 }) {
  const sorted = [...leads].sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  const shown = sorted.slice(0, limit)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left">
              <Th>Customer</Th>
              <Th>Model</Th>
              <Th>Source</Th>
              <Th>Stage</Th>
              <Th align="right">Value</Th>
              <Th align="right">Idle</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((lead) => (
              <tr key={lead.id} className="border-b border-hairline last:border-0">
                <td className="py-2.5 pr-3">
                  <div className="font-medium text-ink">{lead.customer_name}</div>
                  <div className="text-xs text-ink-3">{lead.id}</div>
                </td>
                <td className="py-2.5 pr-3 text-ink-2">{lead.model_interested}</td>
                <td className="py-2.5 pr-3 text-ink-2">
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </td>
                <td className="py-2.5 pr-3">
                  <StageBadge stage={lead.status} />
                </td>
                <td className="tnum py-2.5 pr-3 text-right text-ink">
                  {formatINR(lead.deal_value)}
                </td>
                <td className="tnum py-2.5 text-right text-ink-2">
                  {/* Idle days are measured from the dataset's own as-of date. */}
                  {formatNumber(lead.idleDays)}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > shown.length && (
        <p className="mt-2.5 text-xs text-ink-3">
          Showing the {shown.length} most recent of {sorted.length} leads.
        </p>
      )}
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th
      scope="col"
      className={`py-2 pr-3 text-xs font-medium uppercase tracking-wide text-ink-3 ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {children}
    </th>
  )
}
