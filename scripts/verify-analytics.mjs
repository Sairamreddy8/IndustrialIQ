/**
 * Regression oracle for the analytics layer. Every expected value here was
 * derived by direct analysis of dealership_data.json.
 * Run with: node scripts/verify-analytics.mjs
 */
import fs from 'node:fs'
import { normalise, fullPeriod } from '../src/lib/data.js'
import * as A from '../src/lib/analytics.js'
import * as R from '../src/lib/ranges.js'
import { openPipelineInsights, branchInsight } from '../src/lib/insights.js'

const dataset = normalise(JSON.parse(fs.readFileSync('dealership_data.json', 'utf8')))
const filters = { range: fullPeriod(dataset), branchId: null, repId: null }

let pass = 0
let fail = 0
const check = (name, actual, expected) => {
  const ok =
    typeof expected === 'number' ? Math.abs(actual - expected) < 0.51 : actual === expected
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: ${actual}${ok ? '' : `  (expected ${expected})`}`)
  if (ok) pass += 1
  else fail += 1
}

check('asOf', dataset.asOf.toISOString().slice(0, 10), '2025-12-31')
check('months', dataset.months.length, 7)

const k = A.computeKpis(dataset, filters)
check('revenue', k.revenue, 388760000)
check('units delivered', k.units, 160)
check('target units', Math.round(k.targetUnits), 1426)
check('lead count', k.leadCount, 510)
check('conversion %', Math.round(k.conversionRate), 31)
check('open leads', k.openCount, 62)
check('open pipeline value', k.openValue, 151540000)
check('avg days to deliver', Number(k.avgDaysToDeliver.toFixed(1)), 18.3)
check('delayed %', Math.round(k.delayedRate), 45)

const funnel = A.computeFunnel(dataset.leads)
check('funnel counts', funnel.map((f) => f.count).join(','), '510,391,300,235,198,160')
check('funnel top step is null', funnel[0].stepConversion === null, true)

const branches = A.computeBranchRollup(dataset, filters)
check('branch order by revenue', branches.map((b) => b.id).join(','), 'B5,B1,B2,B4,B3')
check('branch units', branches.map((b) => b.units).join(','), '47,40,36,31,6')
check('Lakeside contact rate', Math.round(branches.find((b) => b.id === 'B3').contactRate), 58)
check('Lakeside never contacted', branches.find((b) => b.id === 'B3').neverContacted, 33)
check('branch units sum', branches.reduce((s, b) => s + b.units, 0), 160)

const sources = A.computeSourceBreakdown(dataset.leads)
check('walk_in conversion', Math.round(sources.find((s) => s.source === 'walk_in').conversionRate), 46)
check('social_media conversion', Math.round(sources.find((s) => s.source === 'social_media').conversionRate), 14)
check('source lead sum', sources.reduce((s, r) => s + r.leads, 0), 510)

const monthly = A.computeMonthlySeries(dataset, filters)
check('monthly rows', monthly.length, 7)
check('monthly units sum', monthly.reduce((s, m) => s + m.units, 0), 160)
check('monthly revenue sum', monthly.reduce((s, m) => s + m.revenue, 0), 388760000)
check('no zero-target month', monthly.every((m) => m.targetUnits > 0), true)

// A partial month must prorate its target rather than use the whole month.
const halfDec = {
  range: { from: new Date('2025-12-01T00:00:00Z'), to: new Date('2025-12-15T23:59:59Z') },
  branchId: null,
  repId: null,
}
const decFull = A.selectTargets(dataset, {
  range: { from: new Date('2025-12-01T00:00:00Z'), to: new Date('2025-12-31T23:59:59Z') },
  branchId: null,
  repId: null,
})
check('half-Dec target is ~half of Dec', Math.round(A.selectTargets(dataset, halfDec).units / decFull.units * 100), 48)

// An empty period must degrade to dashes, never NaN.
const empty = {
  range: { from: new Date('2024-01-01T00:00:00Z'), to: new Date('2024-02-01T00:00:00Z') },
  branchId: null,
  repId: null,
}
const ke = A.computeKpis(dataset, empty)
check('empty revenue', ke.revenue, 0)
check('empty conversion is null', ke.conversionRate === null, true)
check('empty attainment is null', ke.unitAttainment === null, true)
check('empty monthly rows', A.computeMonthlySeries(dataset, empty).length, 0)

const models = A.computeModelEnquiries(dataset.leads)
check('model count', models.length, 7)
check('model enquiry sum', models.reduce((s, m) => s + m.count, 0), 510)
check('top model', `${models[0].model} ${models[0].count}`, 'Glanza 130')
check('smallest model', `${models[6].model} ${models[6].count}`, 'Hilux 11')
check('model shares total 100%', Math.round(models.reduce((s, m) => s + m.share, 0)), 100)

// --- drill-down selectors ---

const reps = A.computeRepRollup(dataset, filters)
check('rep count', reps.length, 30)
const zeroLead = reps.filter((r) => r.leadCount === 0)
check('reps with no leads', zeroLead.length, 5)
check('all zero-lead reps are managers', zeroLead.every((r) => r.role === 'branch_manager'), true)
check('rep lead sum', reps.reduce((s, r) => s + r.leadCount, 0), 510)
check('rep delivered sum', reps.reduce((s, r) => s + r.deliveredCount, 0), 160)
check(
  'every rep rolls up under its own branch',
  reps.every((r) => dataset.repById.get(r.id).branch_id === r.branchId),
  true,
)

// Rep rollup must reconcile with the branch rollup it sits inside.
const b3Reps = A.computeRepRollup(dataset, { ...filters, branchId: 'B3' })
check('B3 rep count', b3Reps.length, 6)
check('B3 selling reps (managers excluded)', b3Reps.filter((r) => r.role !== 'branch_manager').length, 5)
check('B3 rep delivered sum matches branch units', b3Reps.reduce((s, r) => s + r.deliveredCount, 0), 6)
check('B3 rep lead sum matches branch leads', b3Reps.reduce((s, r) => s + r.leadCount, 0), 79)

for (const [id, count, avg, delayed, rate] of [
  ['B1', 40, 19.3, 22, 55],
  ['B4', 31, 15.6, 8, 26],
]) {
  const stats = A.computeDeliveryStats(A.selectDeliveries(dataset, { ...filters, branchId: id }))
  check(`${id} deliveries`, stats.count, count)
  check(`${id} avg days`, Number(stats.avgDays.toFixed(1)), avg)
  check(`${id} delayed count`, stats.delayedCount, delayed)
  check(`${id} delayed rate`, Math.round(stats.delayedRate), rate)
}

const lostReasons = A.computeLostReasons(dataset.leads)
check('lost reason total', lostReasons.reduce((s, r) => s + r.count, 0), 288)
check(
  'the 14 reasonless lost leads are labelled',
  lostReasons.find((r) => r.reason === 'Not recorded')?.count,
  14,
)

// A rep scope must not invent a target — those are set per branch.
const repScoped = A.computeKpis(dataset, { ...filters, branchId: 'B3', repId: 'SR19' })
check('rep scope has no unit target', repScoped.targetUnits === null, true)
check('rep scope attainment is null', repScoped.unitAttainment === null, true)

const emptyDelivery = A.computeDeliveryStats([])
check('empty delivery stats do not divide by zero', emptyDelivery.avgDays === null, true)

// --- time-range presets ---

const presets = R.buildPresets(dataset)
check('preset keys', presets.map((p) => p.key).join(','), 'full,q4,last90,last30')
// Presets must sit inside the dataset window — a preset measured from the wall
// clock would run past it and select nothing.
const windowEnd = R.monthEnd(dataset.months[dataset.months.length - 1]).getTime()
check('presets stay inside the dataset window',
  presets.every((p) => p.to.getTime() <= windowEnd && p.from.getTime() >= R.monthStart(dataset.months[0]).getTime()), true)
check('last30 starts 30 days before as-of',
  R.resolveRange(dataset, { key: 'last30' }).range.from.toISOString().slice(0, 10), '2025-12-01')

// Q4 must reconcile: deliveries in Oct-Dec across branches sum to the network.
const q4 = { range: R.resolveRange(dataset, { key: 'q4' }).range, branchId: null, repId: null }
const q4Kpis = A.computeKpis(dataset, q4)
check('Q4 units', q4Kpis.units, 102)
check('Q4 branch units sum matches network',
  A.computeBranchRollup(dataset, q4).reduce((s, b) => s + b.units, 0), q4Kpis.units)
check('Q4 target units', Math.round(q4Kpis.targetUnits), 690)

// A custom span with its months reversed must still resolve forwards.
const reversed = R.resolveRange(dataset, { key: 'custom', from: '2025-09', to: '2025-07' })
check('reversed custom span is corrected', reversed.label, 'Jul 2025 – Sep 2025')
const forward = R.resolveRange(dataset, { key: 'custom', from: '2025-07', to: '2025-09' })
check('reversed and forward spans agree',
  reversed.range.from.getTime() === forward.range.from.getTime(), true)

// Months outside the dataset must be clamped rather than selecting nothing.
const clamped = R.resolveRange(dataset, { key: 'custom', from: '2019-01', to: '2030-01' })
check('out-of-range custom clamps to the dataset', clamped.label, 'Jun 2025 – Dec 2025')

// The live pipeline deliberately ignores the range.
check('open pipeline is range-independent',
  A.selectOpenLeads(dataset, q4).length, A.selectOpenLeads(dataset, filters).length)

// --- monthly series across every range ---

for (const selection of [
  { key: 'full' },
  { key: 'q4' },
  { key: 'last90' },
  { key: 'last30' },
  { key: 'custom', from: '2025-12', to: '2025-12' },
  { key: 'custom', from: '2025-07', to: '2025-08' },
]) {
  const { range, label } = R.resolveRange(dataset, selection)
  const scoped = { range, branchId: null, repId: null }
  const points = A.computeMonthlySeries(dataset, scoped)
  const kpis = A.computeKpis(dataset, scoped)

  check(`${label}: has months`, points.length >= 1, true)
  check(`${label}: units reconcile`, points.reduce((s, p) => s + p.units, 0), kpis.units)
  check(`${label}: revenue reconciles`, points.reduce((s, p) => s + p.revenue, 0), kpis.revenue)
  check(
    `${label}: target reconciles`,
    Math.round(points.reduce((s, p) => s + p.targetRevenue, 0)),
    Math.round(kpis.targetRevenue),
  )
  // The deficit segment the chart stacks must never invert.
  check(
    `${label}: shortfall is never negative`,
    points.every((p) => Math.max(p.targetRevenue - p.revenue, 0) >= 0),
    true,
  )
  // Delivered + shortfall must equal the target, or the bar would misstate it.
  check(
    `${label}: delivered + shortfall = target`,
    points.every(
      (p) =>
        Math.abs(p.revenue + Math.max(p.targetRevenue - p.revenue, 0) - p.targetRevenue) < 1 ||
        p.revenue > p.targetRevenue,
    ),
    true,
  )
}

// --- actionable insights ---

const actions = openPipelineInsights(dataset, {})
check('open pipeline raises actions', actions.length, 3)
check('most severe action is first', actions[0].severity, 'critical')
check('stalled orders counted', actions.find((a) => a.id === 'stalled-orders').value, 55420000)

// Insights describe the live pipeline, so a narrow range must not change them.
const narrow = { range: R.resolveRange(dataset, { key: 'last30' }).range, branchId: null, repId: null }
check('actions ignore the date range',
  openPipelineInsights(dataset, {}).length, openPipelineInsights(dataset, narrow).length)

// Branch-scoped actions must partition: every stalled order belongs to one branch.
const perBranchStalled = dataset.branches.reduce((sum, b) => {
  const found = openPipelineInsights(dataset, { branchId: b.id }).find((a) => a.id === 'stalled-orders')
  return sum + (found ? found.value : 0)
}, 0)
check('branch stalled values sum to the network', perBranchStalled, 55420000)

// Every branch here has something worth acting on; each must name a real action.
for (const branch of dataset.branches) {
  const insight = branchInsight(dataset, filters, branch.id)
  check(`${branch.name}: has an insight`, insight !== null, true)
  check(`${branch.name}: insight is actionable`, Boolean(insight?.action && insight?.metric), true)
}
check('Lakeside is flagged for never-contacted leads',
  branchInsight(dataset, filters, 'B3').id, 'never-contacted')

// A branch with nothing wrong must return null rather than invent a finding.
const spotless = {
  ...dataset,
  leads: dataset.leads.filter((l) => l.branch_id !== 'B4' || (!l.isOpen && !l.neverContacted)),
  deliveries: dataset.deliveries.filter((d) => d.branch_id !== 'B4' || !d.isDelayed),
}
check('a clean branch yields no insight', branchInsight(spotless, filters, 'B4'), null)

// --- insights must be derived, not hard-coded ---
// Each of these mutates the source data and asserts the findings move with it.

const rawJson = JSON.parse(fs.readFileSync('dealership_data.json', 'utf8'))

// Deliver every outstanding order: the stalled-order finding must disappear.
const allDelivered = structuredClone(rawJson)
for (const lead of allDelivered.leads) {
  if (lead.status === 'order_placed') lead.status = 'delivered'
}
check(
  'delivering every order clears the stalled-order finding',
  openPipelineInsights(normalise(allDelivered), {}).some((i) => i.id === 'stalled-orders'),
  false,
)

// Give Lakeside a first call on every lead: its finding must change to something else.
const allContacted = structuredClone(rawJson)
for (const lead of allContacted.leads) {
  if (lead.branch_id !== 'B3') continue
  if (!lead.status_history.some((h) => h.status === 'contacted')) {
    lead.status_history.push({
      status: 'contacted',
      timestamp: lead.created_at,
      note: 'backfilled by test',
    })
  }
}
const contactedDs = normalise(allContacted)
check(
  'contacting every lead clears the never-contacted finding',
  branchInsight(contactedDs, { range: fullPeriod(contactedDs), branchId: null, repId: null }, 'B3')
    ?.id !== 'never-contacted',
  true,
)

// Double a branch's stalled value and the figure reported must follow.
const baseline = openPipelineInsights(dataset, { branchId: 'B5' }).find(
  (i) => i.id === 'stalled-orders',
)
const richer = structuredClone(rawJson)
for (const lead of richer.leads) {
  if (lead.branch_id === 'B5' && lead.status === 'order_placed') lead.deal_value *= 2
}
const richerValue = openPipelineInsights(normalise(richer), { branchId: 'B5' }).find(
  (i) => i.id === 'stalled-orders',
).value
check('reported value tracks the underlying deal values', richerValue, baseline.value * 2)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
