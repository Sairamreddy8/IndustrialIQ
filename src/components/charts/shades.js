/**
 * Which of the five hues each chart carries, in one place.
 *
 * Every chart here plots a single series, so colour is not spent saying which
 * bar is which — length already does that. What it does instead is say what
 * the panel is *about*, and it says the same thing everywhere: the aqua on the
 * source bars is the aqua on the on-time deliveries, because both mean a lead
 * that went well.
 *
 * This replaced a two-blue alternation that was explicitly rhythm rather than
 * encoding. Rhythm is what a chart reaches for when its colour has no job;
 * these have one.
 */
export const MARK = {
  /** Volume — counts and rupees with no verdict attached. */
  volume: 'var(--color-series)',
  /** A lead that converted, a car handed over on time. */
  good: 'var(--color-good)',
  /** Late, or at risk of being late. */
  warning: 'var(--color-warning)',
  /** Lost, stalled, needs chasing. */
  critical: 'var(--color-critical)',
  /** Demand: what buyers asked for, what is still open. */
  demand: 'var(--color-demand)',
}
