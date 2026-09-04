import { formatMonth } from './format.js'

const DAY_MS = 86400000

/** First millisecond of a "YYYY-MM", in UTC. */
export function monthStart(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1))
}

/** Last millisecond of a "YYYY-MM", in UTC. */
export function monthEnd(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
}

/**
 * Presets are anchored to the dataset's own as-of date, never the wall clock.
 * The data ends 31 Dec 2025, so "last 30 days" has to mean the last 30 days of
 * the data or it would select nothing at all.
 */
export function buildPresets(dataset) {
  const { asOf, months } = dataset
  const first = monthStart(months[0])
  const last = monthEnd(months[months.length - 1])
  const back = (days) => ({
    from: new Date(Math.max(asOf.getTime() - days * DAY_MS, first.getTime())),
    to: asOf,
  })

  return [
    { key: 'full', label: 'All time', from: first, to: last },
    { key: 'q4', label: 'Q4 2025', from: monthStart('2025-10'), to: monthEnd('2025-12') },
    { key: 'last90', label: 'Last 90 days', ...back(90) },
    { key: 'last30', label: 'Last 30 days', ...back(30) },
  ]
}

/**
 * Turns the filter selection into a concrete range plus a human label.
 * Guards a custom selection against months outside the dataset and against a
 * reversed pair, so the range is always valid.
 */
export function resolveRange(dataset, selection) {
  const presets = buildPresets(dataset)

  if (selection.key === 'custom') {
    const { months } = dataset
    const from = months.includes(selection.from) ? selection.from : months[0]
    const to = months.includes(selection.to) ? selection.to : months[months.length - 1]
    const [lo, hi] = from <= to ? [from, to] : [to, from]
    return {
      range: { from: monthStart(lo), to: monthEnd(hi) },
      label: lo === hi ? formatMonth(lo) : `${formatMonth(lo)} – ${formatMonth(hi)}`,
    }
  }

  const preset = presets.find((p) => p.key === selection.key) ?? presets[0]
  return {
    range: { from: preset.from, to: preset.to },
    label: preset.label,
  }
}
