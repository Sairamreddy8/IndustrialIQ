import { OPEN_STAGES } from './constants.js'

const DAY_MS = 86400000
const BASE_URL = import.meta.env?.BASE_URL ?? '/'

export const DATA_URL = `${BASE_URL}dealership_data.json`

export function daysBetween(later, earlier) {
  return (later.getTime() - earlier.getTime()) / DAY_MS
}

/** Date | ISO string -> "2025-12" */
export function monthKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Normalises the raw JSON into an indexed, pre-derived shape so no component
 * ever has to re-walk status_history.
 *
 * Two decisions the data forces on us:
 *
 * 1. `asOf` is the newest activity in the dataset, not `Date.now()`. The data
 *    ends 31 Dec 2025, so anchoring anything time-relative to the real clock
 *    would report every lead as hundreds of days stale.
 *
 * 2. Current stage comes from `lead.status`, never the tail of
 *    `status_history`. 14 leads are marked `lost` with no matching `lost`
 *    event, so the two disagree and `status` is the authoritative one.
 */
export function normalise(raw) {
  const branches = raw.branches.map((b) => ({ ...b }))
  const branchById = new Map(branches.map((b) => [b.id, b]))

  const reps = raw.sales_reps.map((r) => ({
    ...r,
    branchName: branchById.get(r.branch_id)?.name ?? 'Unknown',
  }))
  const repById = new Map(reps.map((r) => [r.id, r]))

  const deliveryByLeadId = new Map(raw.deliveries.map((d) => [d.lead_id, d]))

  const leads = raw.leads.map((lead) => {
    const createdAt = new Date(lead.created_at)
    const lastActivityAt = new Date(lead.last_activity_at)
    const history = lead.status_history.map((h) => ({ ...h, at: new Date(h.timestamp) }))
    const reached = new Set(history.map((h) => h.status))
    const orderEvent = history.find((h) => h.status === 'order_placed')
    const delivery = deliveryByLeadId.get(lead.id) ?? null

    return {
      ...lead,
      createdAt,
      lastActivityAt,
      createdMonth: monthKey(createdAt),
      history,
      reached,
      repName: repById.get(lead.assigned_to)?.name ?? 'Unassigned',
      branchName: branchById.get(lead.branch_id)?.name ?? 'Unknown',
      delivery,
      deliveredAt: delivery ? new Date(delivery.delivery_date) : null,
      orderPlacedAt: orderEvent ? orderEvent.at : null,
      isDelivered: lead.status === 'delivered',
      isLost: lead.status === 'lost',
      isOpen: OPEN_STAGES.includes(lead.status),
      // Never got a first call. In this dataset these are almost always dead.
      neverContacted: !reached.has('contacted'),
    }
  })

  // asOf has to be known before idle days can be derived, hence a second pass.
  const asOf = new Date(Math.max(...leads.map((l) => l.lastActivityAt.getTime())))
  for (const lead of leads) {
    lead.idleDays = daysBetween(asOf, lead.lastActivityAt)
    lead.ageDays = daysBetween(asOf, lead.createdAt)
    lead.daysSinceOrder = lead.orderPlacedAt ? daysBetween(asOf, lead.orderPlacedAt) : null
  }

  const leadById = new Map(leads.map((l) => [l.id, l]))
  const deliveries = raw.deliveries.map((d) => {
    const lead = leadById.get(d.lead_id)
    return {
      ...d,
      deliveredAt: new Date(d.delivery_date),
      month: d.delivery_date.slice(0, 7),
      isDelayed: Boolean(d.delay_reason),
      branch_id: lead?.branch_id ?? null,
      assigned_to: lead?.assigned_to ?? null,
      deal_value: lead?.deal_value ?? 0,
    }
  })

  const targets = raw.targets.map((t) => ({ ...t }))
  const months = [...new Set(targets.map((t) => t.month))].sort()

  return {
    branches,
    branchById,
    reps,
    repById,
    leads,
    leadById,
    deliveries,
    targets,
    months,
    asOf,
    metadata: raw.metadata,
  }
}

/** The whole dataset period — used until the range filter ships. */
export function fullPeriod(dataset) {
  const [firstYear, firstMonth] = dataset.months[0].split('-').map(Number)
  const [lastYear, lastMonth] = dataset.months[dataset.months.length - 1]
    .split('-')
    .map(Number)
  return {
    from: new Date(Date.UTC(firstYear, firstMonth - 1, 1)),
    to: new Date(Date.UTC(lastYear, lastMonth, 0, 23, 59, 59, 999)),
  }
}

export async function loadDataset(signal) {
  const res = await fetch(DATA_URL, { signal })
  if (!res.ok) throw new Error(`Could not load dealership data (${res.status})`)
  return normalise(await res.json())
}
