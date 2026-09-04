import { STAGES } from './constants.js'
import { pct } from './format.js'

/*
 * Metric definitions, fixed once so every view agrees:
 *
 *   Revenue / units   recognised on delivery_date — that is what the monthly
 *                     targets are written against.
 *   Leads / funnel    bucketed on lead.created_at.
 *   Targets           prorated by the share of each month the range covers, so
 *                     a partial month is never judged against a full target.
 *   Idle / aging      measured from dataset.asOf (31 Dec 2025).
 *
 * Every selector takes { range, branchId, repId }. Scope keys are optional and
 * null-safe, so the overview can pass the full period with no scope while the
 * drill-down views reuse the identical functions.
 */

const DAY_MS = 86400000

export function inRange(date, range) {
  if (!date) return false
  const t = date.getTime()
  return t >= range.from.getTime() && t <= range.to.getTime()
}

function daysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

/** How much of `monthKey` falls inside `range`, and the month's full length. */
function monthOverlap(key, range) {
  const [year, month] = key.split('-').map(Number)
  const total = daysInMonth(year, month - 1)
  const monthStart = Date.UTC(year, month - 1, 1)
  const monthEnd = Date.UTC(year, month - 1, total, 23, 59, 59, 999)
  const start = Math.max(monthStart, range.from.getTime())
  const end = Math.min(monthEnd, range.to.getTime())
  if (end < start) return { covered: 0, total }
  return { covered: (end - start) / DAY_MS, total }
}

function matchesScope(record, { branchId, repId }) {
  if (branchId && record.branch_id !== branchId) return false
  if (repId && record.assigned_to !== repId) return false
  return true
}

/** Leads created inside the range, within the branch/rep scope. */
export function selectLeads(dataset, filters) {
  return dataset.leads.filter(
    (l) => matchesScope(l, filters) && inRange(l.createdAt, filters.range),
  )
}

/** Deliveries that happened inside the range, within the branch/rep scope. */
export function selectDeliveries(dataset, filters) {
  return dataset.deliveries.filter(
    (d) => matchesScope(d, filters) && inRange(d.deliveredAt, filters.range),
  )
}

/**
 * Every lead currently in an open stage for this scope, regardless of when it
 * was created — an open lead from June that is still open is precisely the
 * thing worth surfacing, so the live pipeline ignores the date range.
 */
export function selectOpenLeads(dataset, filters) {
  return dataset.leads.filter((l) => l.isOpen && matchesScope(l, filters))
}

/**
 * Monthly targets prorated to the range. Rep-scoped views get no target —
 * targets are set at branch level and splitting one across reps would be
 * inventing a number.
 */
export function selectTargets(dataset, { range, branchId, repId }) {
  if (repId) return { units: null, revenue: null }
  let units = 0
  let revenue = 0
  for (const t of dataset.targets) {
    if (branchId && t.branch_id !== branchId) continue
    const { covered, total } = monthOverlap(t.month, range)
    if (covered <= 0) continue
    const share = Math.min(covered / total, 1)
    units += t.target_units * share
    revenue += t.target_revenue * share
  }
  return { units, revenue }
}

/** The headline vital signs. */
export function computeKpis(dataset, filters) {
  const leads = selectLeads(dataset, filters)
  const deliveries = selectDeliveries(dataset, filters)
  const target = selectTargets(dataset, filters)
  const openLeads = selectOpenLeads(dataset, filters)

  const revenue = deliveries.reduce((sum, d) => sum + d.deal_value, 0)
  const units = deliveries.length
  const delivered = leads.filter((l) => l.isDelivered).length
  const delayed = deliveries.filter((d) => d.isDelayed).length
  const deliveryDays = deliveries.reduce((sum, d) => sum + d.days_to_deliver, 0)

  return {
    revenue,
    units,
    targetUnits: target.units,
    targetRevenue: target.revenue,
    unitAttainment: pct(units, target.units),
    revenueAttainment: pct(revenue, target.revenue),
    leadCount: leads.length,
    deliveredCount: delivered,
    lostCount: leads.filter((l) => l.isLost).length,
    conversionRate: pct(delivered, leads.length),
    openCount: openLeads.length,
    openValue: openLeads.reduce((sum, l) => sum + l.deal_value, 0),
    avgDealValue: units ? revenue / units : null,
    avgDaysToDeliver: units ? deliveryDays / units : null,
    delayedRate: pct(delayed, units),
  }
}

/**
 * Funnel by "ever reached this stage", read from status_history rather than
 * current status — otherwise a delivered lead would not count as contacted.
 */
export function computeFunnel(leads) {
  const counts = STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.reached.has(stage)).length,
  }))
  return counts.map((row, i) => {
    const previous = i === 0 ? null : counts[i - 1].count
    return {
      ...row,
      stepConversion: i === 0 ? null : pct(row.count, previous),
      dropOff: i === 0 ? 0 : previous - row.count,
      shareOfTop: pct(row.count, counts[0].count),
    }
  })
}

/** Per-month delivered revenue/units against the prorated target. */
export function computeMonthlySeries(dataset, filters) {
  const leads = selectLeads(dataset, filters)
  const deliveries = selectDeliveries(dataset, filters)

  return dataset.months
    .filter((month) => monthOverlap(month, filters.range).covered > 0)
    .map((month) => {
      const monthDeliveries = deliveries.filter((d) => d.month === month)
      const { covered, total } = monthOverlap(month, filters.range)
      const share = Math.min(covered / total, 1)

      let targetUnits = 0
      let targetRevenue = 0
      if (!filters.repId) {
        for (const t of dataset.targets) {
          if (t.month !== month) continue
          if (filters.branchId && t.branch_id !== filters.branchId) continue
          targetUnits += t.target_units * share
          targetRevenue += t.target_revenue * share
        }
      }

      return {
        month,
        units: monthDeliveries.length,
        revenue: monthDeliveries.reduce((sum, d) => sum + d.deal_value, 0),
        targetUnits,
        targetRevenue,
        leads: leads.filter((l) => l.createdMonth === month).length,
      }
    })
}

/** One row per branch — the network comparison table. */
export function computeBranchRollup(dataset, filters) {
  return dataset.branches
    .map((branch) => {
      const scoped = { ...filters, branchId: branch.id, repId: null }
      const leads = selectLeads(dataset, scoped)
      const contacted = leads.filter((l) => l.reached.has('contacted')).length
      return {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        repCount: dataset.reps.filter((r) => r.branch_id === branch.id).length,
        ...computeKpis(dataset, scoped),
        contactRate: pct(contacted, leads.length),
        neverContacted: leads.filter((l) => l.neverContacted).length,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

export function computeSourceBreakdown(leads) {
  const bySource = new Map()
  for (const lead of leads) {
    if (!bySource.has(lead.source)) {
      bySource.set(lead.source, { source: lead.source, leads: 0, delivered: 0, revenue: 0 })
    }
    const row = bySource.get(lead.source)
    row.leads += 1
    if (lead.isDelivered) {
      row.delivered += 1
      row.revenue += lead.deal_value
    }
  }
  return [...bySource.values()]
    .map((row) => ({ ...row, conversionRate: pct(row.delivered, row.leads) }))
    .sort((a, b) => (b.conversionRate ?? 0) - (a.conversionRate ?? 0))
}

/** One row per sales rep, optionally narrowed to a branch. */
export function computeRepRollup(dataset, filters) {
  const reps = filters.branchId
    ? dataset.reps.filter((r) => r.branch_id === filters.branchId)
    : dataset.reps

  return reps
    .map((rep) => {
      const scoped = { ...filters, branchId: rep.branch_id, repId: rep.id }
      const leads = selectLeads(dataset, scoped)
      const deliveries = selectDeliveries(dataset, scoped)
      const open = selectOpenLeads(dataset, scoped)
      const delivered = leads.filter((l) => l.isDelivered).length
      const contacted = leads.filter((l) => l.reached.has('contacted')).length
      return {
        id: rep.id,
        name: rep.name,
        role: rep.role,
        branchId: rep.branch_id,
        branchName: rep.branchName,
        joined: rep.joined,
        leadCount: leads.length,
        deliveredCount: delivered,
        conversionRate: pct(delivered, leads.length),
        contactRate: pct(contacted, leads.length),
        revenue: deliveries.reduce((sum, d) => sum + d.deal_value, 0),
        units: deliveries.length,
        openCount: open.length,
        openValue: open.reduce((sum, l) => sum + l.deal_value, 0),
        neverContacted: leads.filter((l) => l.neverContacted).length,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

/** Delivery reliability for a set of deliveries. */
export function computeDeliveryStats(deliveries) {
  if (!deliveries.length) {
    return { count: 0, avgDays: null, delayedCount: 0, delayedRate: null, reasons: [] }
  }
  const reasons = new Map()
  for (const d of deliveries) {
    if (!d.delay_reason) continue
    reasons.set(d.delay_reason, (reasons.get(d.delay_reason) ?? 0) + 1)
  }
  const delayedCount = deliveries.filter((d) => d.isDelayed).length
  return {
    count: deliveries.length,
    avgDays: deliveries.reduce((sum, d) => sum + d.days_to_deliver, 0) / deliveries.length,
    delayedCount,
    delayedRate: pct(delayedCount, deliveries.length),
    reasons: [...reasons.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  }
}

/** Why leads were lost, most common first. */
export function computeLostReasons(leads) {
  const lost = leads.filter((l) => l.isLost)
  const counts = new Map()
  for (const lead of lost) {
    // 14 leads are marked lost with no reason recorded; label them rather than drop them.
    const reason = lead.lost_reason ?? 'Not recorded'
    counts.set(reason, (counts.get(reason) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count, share: pct(count, lost.length) }))
    .sort((a, b) => b.count - a.count)
}

/** Enquiry volume per model — how many leads asked about each car. */
export function computeModelEnquiries(leads) {
  const counts = new Map()
  for (const lead of leads) {
    counts.set(lead.model_interested, (counts.get(lead.model_interested) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([model, count]) => ({ model, count, share: pct(count, leads.length) }))
    .sort((a, b) => b.count - a.count)
}
