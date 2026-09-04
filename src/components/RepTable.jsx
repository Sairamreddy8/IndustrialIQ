import { Fragment } from 'react'
import RepDetail from './RepDetail.jsx'
import { formatINR, formatNumber, formatPercent } from '../lib/format.js'

/**
 * Branch rep leaderboard. Each row expands in place to reveal that rep's
 * detail — the third level of the drill-down, without leaving the panel.
 *
 * While a row is expanded its own figures are hidden: the dropdown below
 * restates all of them, and showing both invites the reader to compare two
 * copies of the same numbers.
 *
 * Managers are not listed here — they carry no leads and already head the
 * panel. Any rep with no leads still renders "—" via pct() returning null,
 * rather than a misleading 0%.
 */
export default function RepTable({ rows, leadsByRep, expandedId, onToggle }) {
  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            <Th>Sales rep</Th>
            <Th align="right">Leads</Th>
            <Th align="right">Delivered</Th>
            <Th align="right">Conversion</Th>
            <Th align="right">Contacted</Th>
            <Th align="right">Revenue</Th>
            <th scope="col" className="w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((rep) => {
            const isOpen = expandedId === rep.id
            return (
              <Fragment key={rep.id}>
                <tr
                  className={`border-b border-hairline ${isOpen ? 'bg-plane' : 'hover:bg-plane'}`}
                >
                  <td className="py-2.5 pr-3">
                    <button
                      type="button"
                      onClick={() => onToggle(isOpen ? null : rep.id)}
                      aria-expanded={isOpen}
                      aria-controls={`rep-detail-${rep.id}`}
                      className="text-left font-medium text-ink hover:text-series hover:underline"
                    >
                      {rep.name}
                    </button>
                  </td>
                  {isOpen ? (
                    <td
                      colSpan={5}
                      className="py-2.5 pr-3 text-right text-xs text-ink-3"
                    >
                      Details below
                    </td>
                  ) : (
                    <>
                      <Td>{formatNumber(rep.leadCount)}</Td>
                      <Td>{formatNumber(rep.deliveredCount)}</Td>
                      <Td>{formatPercent(rep.conversionRate)}</Td>
                      <Td>{formatPercent(rep.contactRate)}</Td>
                      <Td>{formatINR(rep.revenue)}</Td>
                    </>
                  )}
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onToggle(isOpen ? null : rep.id)}
                      aria-expanded={isOpen}
                      aria-controls={`rep-detail-${rep.id}`}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} details for ${rep.name}`}
                      className="rounded p-1 text-ink-3 hover:bg-hairline hover:text-ink"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr id={`rep-detail-${rep.id}`} className="border-b border-hairline">
                    <td colSpan={7} className="bg-plane px-3 py-4">
                      <RepDetail rep={rep} leads={leadsByRep.get(rep.id) ?? []} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
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

function Td({ children }) {
  return <td className="tnum py-2.5 pr-3 text-right text-ink">{children}</td>
}
