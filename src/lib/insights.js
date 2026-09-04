import { COLD_LEAD_DAYS, STALLED_ORDER_DAYS } from './constants.js'
import { computeDeliveryStats, selectDeliveries, selectLeads, selectOpenLeads } from './analytics.js'
import { formatDate, formatINR, formatNumber, formatPercent, pct } from './format.js'

/*
 * Rule-based insights. Every one is deterministic, carries the numbers that
 * produced it, and names the action — so a manager goes from "what's wrong" to
 * "what do I do" without leaving the panel.
 *
 * Insights about open leads describe the live pipeline and deliberately ignore
 * the selected date range: an order placed in July that still has not been
 * delivered is exactly what needs chasing, and hiding it because the user is
 * looking at December would defeat the point.
 */

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

function medianDeliveryDays(dataset) {
  const days = dataset.deliveries.map((d) => d.days_to_deliver).sort((a, b) => a - b)
  if (!days.length) return 0
  const mid = Math.floor(days.length / 2)
  return days.length % 2 ? days[mid] : (days[mid - 1] + days[mid]) / 2
}

const sumValue = (leads) => leads.reduce((sum, l) => sum + l.deal_value, 0)

/** Orders taken and paid for, then never delivered. */
function stalledOrders(dataset, scope) {
  return selectOpenLeads(dataset, scope)
    .filter((l) => l.status === 'order_placed' && l.daysSinceOrder > STALLED_ORDER_DAYS)
    .sort((a, b) => b.daysSinceOrder - a.daysSinceOrder)
}

/** Live leads nobody has touched in over a week. */
function coldLeads(dataset, scope) {
  return selectOpenLeads(dataset, scope)
    .filter((l) => l.status !== 'order_placed' && l.idleDays > COLD_LEAD_DAYS)
    .sort((a, b) => b.idleDays - a.idleDays)
}

/** Live leads already past the close date they were forecast to land on. */
function overdueLeads(dataset, scope) {
  const today = dataset.asOf.toISOString().slice(0, 10)
  return selectOpenLeads(dataset, scope)
    .filter((l) => l.expected_close_date < today)
    .sort((a, b) => a.expected_close_date.localeCompare(b.expected_close_date))
}

/**
 * What needs doing in the live pipeline, worst first. Scope-aware, so the same
 * rules serve the network view and a single branch.
 */
export function openPipelineInsights(dataset, scope = {}) {
  const insights = []

  const stalled = stalledOrders(dataset, scope)
  if (stalled.length) {
    const veryOld = stalled.filter((l) => l.daysSinceOrder > 90)
    const worst = stalled[0]
    insights.push({
      id: 'stalled-orders',
      severity: 'critical',
      title: `${plural(stalled.length, 'paid order is', 'paid orders are')} stuck awaiting delivery`,
      body:
        `${plural(stalled.length, 'customer has', 'customers have')} paid but not received their car after ` +
        `${STALLED_ORDER_DAYS}+ days${veryOld.length ? `, and ${veryOld.length} have been waiting over 90` : ''}. ` +
        `The longest is ${worst.customer_name} at ${Math.round(worst.daysSinceOrder)} days, against a ` +
        `${Math.round(medianDeliveryDays(dataset))}-day median.`,
      action: 'Confirm an allocation and a delivery date for each of these customers this week.',
      metric: formatINR(sumValue(stalled)),
      metricLabel: 'paid, not delivered',
      value: sumValue(stalled),
    })
  }

  const overdue = overdueLeads(dataset, scope)
  if (overdue.length) {
    insights.push({
      id: 'overdue-leads',
      severity: 'warning',
      title: `${plural(overdue.length, 'live deal is', 'live deals are')} past the expected close date`,
      body:
        `${plural(overdue.length, 'open lead', 'open leads')} were forecast to close by now and have not. ` +
        `The oldest was due ${formatDate(overdue[0].expected_close_date)}. Forecasts built on these dates are overstating the month.`,
      action: 'Re-forecast or close them out so the pipeline reflects reality.',
      metric: formatINR(sumValue(overdue)),
      metricLabel: 'in slipped deals',
      value: sumValue(overdue),
    })
  }

  const cold = coldLeads(dataset, scope)
  if (cold.length) {
    const worst = cold[0]
    insights.push({
      id: 'cold-leads',
      severity: cold.length >= 5 ? 'warning' : 'info',
      title: `${plural(cold.length, 'live lead has', 'live leads have')} gone quiet`,
      body:
        `${plural(cold.length, 'open lead', 'open leads')} have had no activity for over ${COLD_LEAD_DAYS} days. ` +
        `The coldest is ${worst.customer_name} at ${Math.round(worst.idleDays)} days silent.`,
      action: 'Book a follow-up call on each before they lapse.',
      metric: formatNumber(cold.length),
      metricLabel: `idle ${COLD_LEAD_DAYS}+ days`,
      value: sumValue(cold),
    })
  }

  return insights.sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    return bySeverity !== 0 ? bySeverity : b.value - a.value
  })
}

/**
 * The single thing most worth fixing at one branch, measured against the rest
 * of the network. Returns null when nothing stands out — a branch with no
 * problem should say so rather than manufacture one.
 */
export function branchInsight(dataset, filters, branchId) {
  const scope = { ...filters, branchId, repId: null }
  const leads = selectLeads(dataset, scope)
  const candidates = []

  // 1. Leads that never got a first call, against the network's own rate.
  if (leads.length >= 10) {
    const missed = leads.filter((l) => l.neverContacted)
    const rate = pct(missed.length, leads.length)
    const network = selectLeads(dataset, { ...filters, branchId: null, repId: null })
    const networkRate = pct(network.filter((l) => l.neverContacted).length, network.length)
    if (missed.length && rate > networkRate * 1.4) {
      const lost = missed.filter((l) => l.isLost).length
      candidates.push({
        id: 'never-contacted',
        severity: 'critical',
        title: `${formatPercent(rate)} of leads never got a first call`,
        body:
          `${missed.length} of ${leads.length} leads never moved past "New", against ` +
          `${formatPercent(networkRate)} across the network. ` +
          `${lost === missed.length ? 'Every one' : `${lost} of them`} was written off as lost — ` +
          `${formatINR(sumValue(missed))} of enquiry value nobody worked.`,
        action: 'Audit how leads are assigned here and enforce a first-contact SLA.',
        metric: formatPercent(rate),
        metricLabel: `vs ${formatPercent(networkRate)} network`,
        value: sumValue(missed),
      })
    }
  }

  // 2. Paid orders sitting undelivered.
  const stalled = stalledOrders(dataset, { branchId })
  if (stalled.length) {
    candidates.push({
      id: 'stalled-orders',
      severity: 'critical',
      title: `${plural(stalled.length, 'paid order is', 'paid orders are')} stuck awaiting delivery`,
      body:
        `${formatINR(sumValue(stalled))} is booked but undelivered past ${STALLED_ORDER_DAYS} days. ` +
        `The longest is ${stalled[0].customer_name} at ${Math.round(stalled[0].daysSinceOrder)} days.`,
      action: 'Chase allocation on these orders before the customers walk.',
      metric: formatINR(sumValue(stalled)),
      metricLabel: 'paid, not delivered',
      value: sumValue(stalled),
    })
  }

  // 3. Delivery reliability, but only when worse than the network.
  const deliveries = selectDeliveries(dataset, scope)
  if (deliveries.length >= 10) {
    const stats = computeDeliveryStats(deliveries)
    const network = computeDeliveryStats(
      selectDeliveries(dataset, { ...filters, branchId: null, repId: null }),
    )
    if (stats.delayedRate > network.delayedRate + 5) {
      candidates.push({
        id: 'delivery-delays',
        severity: 'warning',
        title: `${formatPercent(stats.delayedRate)} of deliveries miss their promised date`,
        body:
          `${stats.delayedCount} of ${stats.count} handovers were logged late, against ` +
          `${formatPercent(network.delayedRate)} network-wide. ` +
          (stats.reasons[0]
            ? `"${stats.reasons[0].reason}" is the most common cause (${stats.reasons[0].count} cases).`
            : ''),
        action: 'Take the top delay cause to the operations team.',
        metric: formatPercent(stats.delayedRate),
        metricLabel: `vs ${formatPercent(network.delayedRate)} network`,
        value: 0,
      })
    }
  }

  // 4. Live leads going cold.
  const cold = coldLeads(dataset, { branchId })
  if (cold.length) {
    candidates.push({
      id: 'cold-leads',
      severity: 'info',
      title: `${plural(cold.length, 'live lead has', 'live leads have')} gone quiet`,
      body: `No activity for over ${COLD_LEAD_DAYS} days; the coldest is ${Math.round(cold[0].idleDays)} days silent.`,
      action: 'Assign a follow-up call to the owning rep.',
      metric: formatNumber(cold.length),
      metricLabel: `idle ${COLD_LEAD_DAYS}+ days`,
      value: sumValue(cold),
    })
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    return bySeverity !== 0 ? bySeverity : b.value - a.value
  })
  return candidates[0]
}
