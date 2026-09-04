import { formatINR, formatNumber, formatPercent } from '../lib/format.js'

/**
 * Branch comparison. Numeric columns are tabular so the figures line up down
 * the column, and the attainment cell carries a proportional bar so the spread
 * between branches is readable without reading every number.
 *
 * Two different "delivered" numbers live in this table on purpose:
 * "Converted" counts leads *created* in the period that went on to deliver —
 * the cohort the conversion rate is computed from — while "Units vs target"
 * counts deliveries *recognised* in the period, which is what the monthly
 * targets are written against. They agree over the full period and diverge
 * under a narrower one, which is correct rather than a bug.
 *
 * The trailing icon button is the way into the drill-down. It carries the
 * branch name in its accessible label rather than being a bare glyph, and the
 * row lifts on hover so the affordance is visible instead of guessed at.
 *
 * The table scrolls inside its own container on narrow screens rather than
 * reflowing into cards — a comparison table stops comparing once the rows stop
 * sharing an axis.
 */
export default function BranchTable({ rows, onOpenBranch }) {
  const bestRevenue = Math.max(...rows.map((r) => r.revenue), 0)

  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            <Th className="pl-4 sm:pl-5">Branch</Th>
            <Th align="right">Leads</Th>
            <Th align="right">Converted</Th>
            <Th align="right">Conversion</Th>
            <Th align="right">Contacted</Th>
            <Th align="right">Revenue</Th>
            <Th align="right" className="pr-4 sm:pr-5">
              Units vs target
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="group border-b border-hairline last:border-0 hover:bg-plane"
            >
              <td className="py-3 pl-4 pr-3 sm:pl-5">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-ink">{row.name}</span>
                  <button
                    type="button"
                    onClick={() => onOpenBranch(row.id)}
                    aria-label={`Open ${row.name} details`}
                    title={`Open ${row.name} details`}
                    className="shrink-0 rounded p-0.5 text-ink-3 opacity-70 transition hover:bg-series-soft hover:text-series-deep hover:opacity-100 group-hover:opacity-100"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <path
                        d="M11 4h5v5M16 4l-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 12v3.5A1.5 1.5 0 0 1 13.5 17h-9A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5H8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </span>
                <div className="text-xs text-ink-3">
                  {row.city} · {row.repCount} reps
                </div>
              </td>
              <Td>{formatNumber(row.leadCount)}</Td>
              <Td>{formatNumber(row.deliveredCount)}</Td>
              <Td>{formatPercent(row.conversionRate)}</Td>
              <Td>{formatPercent(row.contactRate)}</Td>
              <Td>
                <div>{formatINR(row.revenue)}</div>
                <Meter value={row.revenue} max={bestRevenue} />
              </Td>
              <td className="py-3 pl-3 pr-4 align-top sm:pr-5">
                <div className="tnum text-right text-ink">
                  {formatNumber(row.units)}
                  <span className="text-ink-3"> / {formatNumber(row.targetUnits)}</span>
                </div>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <Meter value={row.units} max={row.targetUnits} className="w-20" />
                  <span className="tnum w-9 text-right text-xs text-ink-2">
                    {formatPercent(row.unitAttainment)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align = 'left', className = '' }) {
  return (
    <th
      scope="col"
      className={`py-2.5 pr-3 text-xs font-medium uppercase tracking-wide text-ink-3 ${
        align === 'right' ? 'text-right' : ''
      } ${className}`}
    >
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="tnum py-3 pr-3 text-right align-top text-ink">{children}</td>
}

function Meter({ value, max, className = 'ml-auto w-16' }) {
  const width = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className={`mt-1 h-1 overflow-hidden rounded-full bg-hairline ${className}`}>
      <div className="h-full rounded-full bg-series" style={{ width: `${width}%` }} />
    </div>
  )
}
