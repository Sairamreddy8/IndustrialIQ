import { useMemo, useState } from 'react'
import Card from '../components/Card.jsx'
import KpiCard from '../components/KpiCard.jsx'
import BranchTable from '../components/BranchTable.jsx'
import Modal from '../components/Modal.jsx'
import BranchDetail from '../components/BranchDetail.jsx'
import ModelEnquiryCounter from '../components/ModelEnquiryCounter.jsx'
import InsightCard from '../components/InsightCard.jsx'
import StateMessage from '../components/StateMessage.jsx'
import { KpiSkeleton, PanelSkeleton } from '../components/Skeleton.jsx'
import RevenueTargetChart from '../components/charts/RevenueTargetChart.jsx'
import FunnelChart from '../components/charts/FunnelChart.jsx'
import SourceChart from '../components/charts/SourceChart.jsx'
import DeliveryDots from '../components/charts/DeliveryDots.jsx'
import LostReasonBubbles from '../components/charts/LostReasonBubbles.jsx'
import { useDataset } from '../context/useDataset.js'
import {
  computeBranchRollup,
  computeFunnel,
  computeKpis,
  computeLostReasons,
  computeDeliveryStats,
  computeMonthlySeries,
  computeModelEnquiries,
  computeSourceBreakdown,
  selectDeliveries,
  selectLeads,
} from '../lib/analytics.js'
import { openPipelineInsights } from '../lib/insights.js'
import {
  formatDays,
  formatINR,
  formatNumber,
  formatPercent,
} from '../lib/format.js'

export default function Overview({ range, rangeLabel }) {
  const { status, dataset, error, retry } = useDataset()

  if (status === 'loading') return <OverviewSkeleton />
  if (status === 'error') {
    return (
      <Card>
        <StateMessage
          tone="error"
          title="Couldn't load dealership data"
          body={error?.message ?? 'The dataset could not be fetched. Check your connection and try again.'}
          action={
            <button
              type="button"
              onClick={retry}
              className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-plane"
            >
              Try again
            </button>
          }
        />
      </Card>
    )
  }

  return <OverviewContent dataset={dataset} range={range} rangeLabel={rangeLabel} />
}

function OverviewContent({ dataset, range, rangeLabel }) {
  const [openBranchId, setOpenBranchId] = useState(null)

  // The one scope object every selector reads; the branch modal reuses it.
  const filters = useMemo(() => ({ range, branchId: null, repId: null }), [range])

  const { kpis, monthly, funnel, branches, sources, models, delivery, lostReasons, actions } =
    useMemo(() => {
    const leads = selectLeads(dataset, filters)
    return {
      kpis: computeKpis(dataset, filters),
      monthly: computeMonthlySeries(dataset, filters),
      funnel: computeFunnel(leads),
      branches: computeBranchRollup(dataset, filters),
      sources: computeSourceBreakdown(leads),
      models: computeModelEnquiries(leads),
      delivery: computeDeliveryStats(selectDeliveries(dataset, filters)),
      lostReasons: computeLostReasons(leads),
      // Live-pipeline actions: deliberately not narrowed by the date range.
      actions: openPipelineInsights(dataset, {}),
    }
  }, [dataset, filters])

  // computeBranchRollup already sorts by revenue delivered.
  const topBranch = branches.find((b) => b.revenue > 0) ?? null
  const openBranch = branches.find((b) => b.id === openBranchId) ?? null


  return (
    <div className="space-y-4">
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Revenue delivered"
          accent="volume"
          value={formatINR(kpis.revenue)}
          detail={`${formatPercent(kpis.revenueAttainment)} of ${formatINR(kpis.targetRevenue)} target`}
        />
        <KpiCard
          label="Units delivered"
          accent="volume"
          value={formatNumber(kpis.units)}
          detail={`${formatPercent(kpis.unitAttainment)} of ${formatNumber(kpis.targetUnits)} target`}
        />
        <KpiCard
          label="Lead to delivery"
          accent="good"
          value={formatPercent(kpis.conversionRate)}
          detail={`${formatNumber(kpis.deliveredCount)} delivered from ${formatNumber(kpis.leadCount)} leads`}
        />
        <KpiCard
          label="Open pipeline"
          accent="demand"
          value={formatINR(kpis.openValue)}
          detail={`${formatNumber(kpis.openCount)} leads live now`}
        />
        <KpiCard
          label="Top branch"
          accent="good"
          value={topBranch ? topBranch.name.replace(' Toyota', '') : '—'}
          detail={
            topBranch
              ? `${formatINR(topBranch.revenue)} · ${formatPercent(topBranch.conversionRate)} conversion`
              : 'No branch data'
          }
          tone="good"
        />
        <KpiCard
          label="Avg time to deliver"
          accent="warning"
          value={formatDays(kpis.avgDaysToDeliver, 1)}
          detail={`${formatPercent(kpis.delayedRate)} of deliveries ran late`}
          tone={kpis.delayedRate > 40 ? 'warning' : 'neutral'}
        />
      </section>

      <Card
        icon={<DangerIcon />}
        title="Requires attention!"
        titleClassName="text-critical-ink"
        badge={actions.length || null}
        collapsible
        defaultOpen={false}
        subtitle={`${formatNumber(kpis.openCount)} live leads worth ${formatINR(kpis.openValue)} · current state, not filtered by date`}
      >
        {actions.length ? (
          <div className="space-y-3">
            {actions.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                link={{ targetId: 'branch-performance', label: 'See branch performance' }}
              />
            ))}
          </div>
        ) : (
          <StateMessage
            title="Nothing needs chasing"
            body="No stalled orders, slipped deals or leads left sitting in the open pipeline."
          />
        )}
      </Card>

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

      {/* Where leads fall out, and why — the two halves of one question, so
          they sit on one row. Grid items stretch, so the shorter card fills
          the row rather than trailing blank surface under it. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Conversion funnel"
          subtitle={`Every stage each of ${formatNumber(kpis.leadCount)} leads reached`}
        >
          {kpis.leadCount ? (
            <FunnelChart stages={funnel} />
          ) : (
            <StateMessage title="No leads in this period" />
          )}
        </Card>

        <Card
          title="Why leads were lost"
          subtitle={`${formatNumber(kpis.lostCount)} lost leads across the network`}
        >
          {lostReasons.length ? (
            <LostReasonBubbles rows={lostReasons} />
          ) : (
            <StateMessage title="No lost leads in this period" />
          )}
        </Card>
      </div>

      {/* Three panels of near-identical natural height — where leads come
          from, how well we hand cars over, what buyers ask for — so they tile
          into one band instead of two ragged pairs. Three-up needs real width:
          below xl the rings card spans the pair below it rather than squeezing
          a third column that cannot hold eight 80px rings. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card
          title="Lead source performance"
          subtitle="Share of each source's leads that reached delivery"
        >
          {sources.length ? (
            <SourceChart data={sources} />
          ) : (
            <StateMessage title="No leads in this period" />
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

        <Card
          title="Enquiries by model"
          subtitle="Which cars buyers are asking about"
          className="md:col-span-2 xl:col-span-1"
        >
          {models.length ? (
            <ModelEnquiryCounter rows={models} />
          ) : (
            <StateMessage title="No enquiries in this period" />
          )}
        </Card>
      </div>

      <Card
        id="branch-performance"
        title="Branch performance"
        subtitle="Converted counts leads created in the period; units count deliveries made in it"
        className="overflow-hidden"
      >
        {branches.length ? (
          <BranchTable rows={branches} onOpenBranch={setOpenBranchId} />
        ) : (
          <StateMessage title="No branches to compare" />
        )}
      </Card>

      <Modal
        open={openBranch !== null}
        onClose={() => setOpenBranchId(null)}
        title={openBranch?.name ?? ''}
        subtitle={
          openBranch
            ? `${openBranch.city} · ${openBranch.repCount} sales reps`
            : undefined
        }
      >
        {openBranch && (
          <BranchDetail
            dataset={dataset}
            filters={filters}
            branchId={openBranch.id}
            networkFunnel={funnel}
            rangeLabel={rangeLabel}
          />
        )}
      </Modal>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <PanelSkeleton rows={5} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelSkeleton rows={7} />
        <PanelSkeleton rows={7} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={5} />
      </div>
      <PanelSkeleton rows={5} />
    </div>
  )
}

/** Warning triangle. Decorative — the heading beside it carries the meaning. */
function DangerIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path
        d="M10 3.5 2.8 16h14.4L10 3.5Z"
        strokeLinejoin="round"
      />
      <path d="M10 8.5v3.2" strokeLinecap="round" />
      <path d="M10 14.1h.01" strokeLinecap="round" />
    </svg>
  )
}
