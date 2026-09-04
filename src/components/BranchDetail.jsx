import { useMemo, useState } from 'react'
import Card from './Card.jsx'
import KpiCard from './KpiCard.jsx'
import RepTable from './RepTable.jsx'
import BranchManagerCard from './BranchManagerCard.jsx'
import InsightCard from './InsightCard.jsx'
import StateMessage from './StateMessage.jsx'
import FunnelChart from './charts/FunnelChart.jsx'
import DeliveryDots from './charts/DeliveryDots.jsx'
import RevenueTargetChart from './charts/RevenueTargetChart.jsx'
import LostReasonBubbles from './charts/LostReasonBubbles.jsx'
import {
  computeDeliveryStats,
  computeFunnel,
  computeKpis,
  computeLostReasons,
  computeMonthlySeries,
  computeRepRollup,
  selectDeliveries,
  selectLeads,
} from '../lib/analytics.js'
import { branchInsight } from '../lib/insights.js'
import { formatDays, formatINR, formatNumber, formatPercent } from '../lib/format.js'

/** Branch-level view inside the drill-down modal. */
export default function BranchDetail({
  dataset,
  filters,
  branchId,
  networkFunnel,
  rangeLabel,
}) {
  const [expandedRepId, setExpandedRepId] = useState(null)

  const view = useMemo(() => {
    const scoped = { ...filters, branchId, repId: null }
    const leads = selectLeads(dataset, scoped)
    return {
      kpis: computeKpis(dataset, scoped),
      funnel: computeFunnel(leads),
      // The branch manager heads the panel and carries no leads, so the
      // leaderboard lists selling reps only.
      reps: computeRepRollup(dataset, scoped).filter(
        (r) => r.role !== 'branch_manager',
      ),
      delivery: computeDeliveryStats(selectDeliveries(dataset, scoped)),
      lostReasons: computeLostReasons(leads),
      monthly: computeMonthlySeries(dataset, scoped),
      insight: branchInsight(dataset, filters, branchId),
      manager:
        dataset.reps.find(
          (r) => r.branch_id === branchId && r.role === 'branch_manager',
        ) ?? null,
      // Grouped once here so the expanded rep row does not re-scan every lead.
      leadsByRep: leads.reduce((map, lead) => {
        const bucket = map.get(lead.assigned_to)
        if (bucket) bucket.push(lead)
        else map.set(lead.assigned_to, [lead])
        return map
      }, new Map()),
    }
  }, [dataset, filters, branchId])

  const { kpis, funnel, reps, delivery, lostReasons, monthly, leadsByRep, manager, insight } =
    view

  return (
    <div className="space-y-4">
      <BranchManagerCard manager={manager} asOf={dataset.asOf} />

      {insight && (
        <InsightCard
          insight={insight}
          link={{ targetId: 'branch-reps', label: 'See sales reps' }}
        />
      )}

      {/* Five tiles into a two- or three-wide grid always leaves one cell
          over, so the last one spans it. */}
      <section
        aria-label="Branch metrics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <KpiCard
          label="Revenue"
          accent="volume"
          value={formatINR(kpis.revenue)}
          detail={`${formatPercent(kpis.revenueAttainment)} of ${formatINR(kpis.targetRevenue)} target`}
        />
        <KpiCard
          label="Units"
          accent="volume"
          value={formatNumber(kpis.units)}
          detail={`${formatPercent(kpis.unitAttainment)} of ${formatNumber(kpis.targetUnits)}`}
        />
        <KpiCard
          label="Lead to delivery"
          accent="good"
          value={formatPercent(kpis.conversionRate)}
          detail={`${formatNumber(kpis.deliveredCount)} of ${formatNumber(kpis.leadCount)} leads`}
        />
        <KpiCard
          label="Open pipeline"
          accent="demand"
          value={formatINR(kpis.openValue)}
          detail={`${formatNumber(kpis.openCount)} leads still live`}
        />
        <KpiCard
          label="Avg time to deliver"
          accent="warning"
          value={formatDays(kpis.avgDaysToDeliver, 1)}
          detail={`${formatPercent(kpis.delayedRate)} ran late`}
          tone={kpis.delayedRate > 40 ? 'warning' : 'neutral'}
          className="col-span-2 sm:col-span-2 lg:col-span-1"
        />
      </section>

      {/* Two flush rows. The branch's own month-by-month trend leads, because
          "are we behind, and since when" is the first thing asked of a branch;
          the funnel and the two quality panels answer why. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Revenue against target"
          subtitle={`Recognised on delivery date · ${rangeLabel}`}
        >
          {monthly.length ? (
            <RevenueTargetChart data={monthly} />
          ) : (
            <StateMessage title="No months in this period" />
          )}
        </Card>

        <Card title="Why leads were lost" subtitle={`${formatNumber(kpis.lostCount)} lost leads`}>
          {lostReasons.length ? (
            <LostReasonBubbles rows={lostReasons} />
          ) : (
            <StateMessage title="No lost leads for this branch" />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Conversion funnel" subtitle="Each step compared with the network">
          {kpis.leadCount ? (
            <FunnelChart stages={funnel} benchmark={networkFunnel} benchmarkLabel="network" />
          ) : (
            <StateMessage title="No leads for this branch" />
          )}
        </Card>

        <Card
          title="Delivery reliability"
          subtitle={`${formatNumber(delivery.count)} deliveries · ${formatDays(delivery.avgDays, 1)} average`}
        >
          {delivery.count ? (
            <DeliveryDots stats={delivery} />
          ) : (
            <StateMessage title="No deliveries in this period" />
          )}
        </Card>
      </div>

      <Card
        id="branch-reps"
        title="Sales reps"
        subtitle={`${reps.length} selling reps · select one to see their leads`}
        className="overflow-hidden"
      >
        {reps.length ? (
          <RepTable
            rows={reps}
            leadsByRep={leadsByRep}
            expandedId={expandedRepId}
            onToggle={setExpandedRepId}
          />
        ) : (
          <StateMessage title="No reps at this branch" />
        )}
      </Card>
    </div>
  )
}
