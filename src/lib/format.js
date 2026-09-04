const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function trimZeros(n) {
  return n.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * Indian currency shorthand. Deal values run into the millions, so crore/lakh
 * is what these users actually read — not "₹388,760,000".
 */
export function formatINR(value, { precise = false } = {}) {
  if (value == null || Number.isNaN(value)) return '—'
  if (precise) return '₹' + Math.round(value).toLocaleString('en-IN')
  const abs = Math.abs(value)
  if (abs >= 1e7) return `₹${trimZeros(value / 1e7)} Cr`
  if (abs >= 1e5) return `₹${trimZeros(value / 1e5)} L`
  if (abs >= 1e3) return `₹${trimZeros(value / 1e3)}K`
  return '₹' + Math.round(value).toLocaleString('en-IN')
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return Math.round(value).toLocaleString('en-IN')
}

export function formatPercent(value, digits = 0) {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)}%`
}

/** Safe ratio as a percentage. Returns null rather than NaN/Infinity. */
export function pct(numerator, denominator) {
  if (!denominator) return null
  return (numerator / denominator) * 100
}

/** "2025-12-31" | Date -> "31 Dec 2025" */
export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "2025-12" -> "Dec 2025" */
export function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

/** "2025-12" -> "Dec" — for dense chart axes. */
export function formatMonthShort(monthKey) {
  return MONTH_NAMES[Number(monthKey.split('-')[1]) - 1]
}

export function formatDays(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)} days`
}
