# DealerPulse

Dealership network performance dashboard for the take-home in `Assignment.md`.
React 19 + Vite + Tailwind v4 + Recharts, plain JavaScript (`.jsx`, no TypeScript).
Data source is `dealership_data.json` — 7 months, 5 branches, 30 reps, 510 leads.

## Commands

```bash
npm run dev       # dev server
npm run build     # production build
npm run preview   # serve the build
npm run lint      # oxlint
npm run verify    # analytics regression checks — run after touching src/lib/
```

## Architecture

```
src/lib/          data normalisation, metric functions, insights, formatting — no React
src/context/      loads the dataset once, shares it (DataContext / DataProvider / useDataset)
src/components/   presentational pieces; charts under components/charts/
src/pages/        Overview — composes everything and owns drill-down state
scripts/          verify-analytics.mjs, the regression oracle
```

Data flows one way: `data.js` normalises the raw JSON once → `analytics.js` derives
every number from it → components only render. **Components never compute metrics.**

There is no router. Drill-down (network → branch → rep) is a modal opened from the
branch table, with rep detail as an expandable row inside it. State lives in
`Overview.jsx` as `openBranchId`, and in `BranchDetail.jsx` as `expandedRepId`.

## Conventions

- **Time range lives in `App.jsx` state** (`selection`) because the navbar owns the
  control and the page owns the panels that read it; the resolved range is passed to
  `Overview` as props. Resolved by
  `src/lib/ranges.js`. Presets are measured back from `dataset.asOf`, never the wall
  clock. The resolved `filters` object is passed straight to the branch modal, so the
  drill-down always matches the period on screen.
- **The revenue chart is always monthly, and is a deficit bar**: each bar spans the
  month's target, with delivered stacked below the shortfall. Attainment runs ~11%, so
  bars plotted against a separate target line were slivers under an empty plot. The
  shortfall is clamped at zero so an over-performing month cannot invert the stack.
- **Two different "delivered" numbers exist on purpose.** `deliveredCount` counts leads
  *created* in the range that later delivered (the cohort behind `conversionRate`);
  `units` counts deliveries *recognised* in the range, which is what targets measure.
  They agree over the full period and diverge under a narrower one.
- **Insights live in `src/lib/insights.js`** as pure rules over the same selectors.
  `openPipelineInsights` drives the dashboard's action card; `branchInsight` returns the
  single most severe finding for one branch, or `null` when nothing stands out — a
  branch with no problem must not have one manufactured for it. Both describe the
  **live** pipeline and deliberately ignore the date range, for the same reason
  `selectOpenLeads` does. Every threshold is a named constant (`STALLED_ORDER_DAYS`,
  `COLD_LEAD_DAYS`) and every figure is derived — nothing about a branch or a number is
  written into the copy. `npm run verify` proves this by mutating the dataset and
  asserting the findings move: deliver every order and the stalled finding vanishes;
  contact every Lakeside lead and its finding changes; double a branch's deal values
  and the reported rupees double. Do not replace a derived figure with a literal.
- **Every analytics selector takes `{ range, branchId, repId }`.** Scope keys are
  optional and null-safe. Add new metrics as pure functions in `analytics.js` with that
  same signature rather than special-casing a caller.
- **`pct()` returns `null`, never `NaN`/`Infinity`**, and `format*()` renders `null` as
  `—`. This is what makes empty periods and lead-less reps degrade cleanly. Do not
  replace it with raw division.
- **Charts:** marks are single-hue blue; the two shades in `charts/shades.js` alternate
  row-by-row on the horizontal bar charts as rhythm, not encoding, so those charts carry
  no colour legend. The four status colours (`good`/`warning`/`serious`/`critical`) are
  reserved for state and always ship beside a text label. One y-axis, never two.
- **Colour tokens live in `src/index.css`** under Tailwind v4 `@theme`. Use the token
  utilities (`text-ink-2`, `bg-series`), not raw hex.
- `.tnum` (tabular figures) belongs on table columns and axis ticks, never on hero
  numbers.
- Tables scroll inside their own container on narrow screens rather than reflowing into
  cards — a comparison table stops comparing once rows stop sharing an axis.
- Light mode only, deliberately.

## Data gotchas — these are load-bearing

1. **The dataset ends 31 Dec 2025.** Anything time-relative is measured from
   `dataset.asOf` (the newest `last_activity_at`), never `Date.now()`. Using the wall
   clock reports every lead as ~250 days stale.
2. **Current stage comes from `lead.status`, never the tail of `status_history`.**
   14 leads are marked `lost` with no `lost` event and a null `lost_reason`, so the two
   disagree. `computeLostReasons` buckets those as `Not recorded`.
3. **The funnel counts stages a lead *ever reached*** (from `status_history`), so a
   delivered lead still counts as contacted. Current status would undercount every step.
4. **Revenue and units are recognised on `delivery_date`** — that is what the monthly
   targets are written against. Leads and the funnel bucket on `created_at`.
5. **Targets are branch-level only.** `selectTargets` returns `null` for a rep scope on
   purpose; splitting a branch target across reps would invent a number.
6. **Targets are prorated** by the share of each month a range covers, so a partial
   month is never judged against a full month's target.
7. **All five branch managers carry zero leads.** That is real, not missing data. The
   manager heads the branch modal in `BranchManagerCard`; `BranchDetail` filters
   `role === 'branch_manager'` out of the rep leaderboard so the same person is not
   listed twice with an empty row.
8. **There is no contact information anywhere in the dataset.** `sales_reps` holds only
   id, name, branch_id, role and joined; the only phone numbers belong to lead
   customers. `BranchManagerCard` shows identity and tenure for that reason — do not
   fabricate a phone or email to fill the space.
9. **Targets total 1,426 units against 510 total leads**, so attainment reads 2–15%
   everywhere. Shown as-is by product decision; it is not a bug to fix.

## Verifying changes

`npm run verify` holds 52 assertions against values derived independently from the
dataset (revenue ₹38.88 Cr, 160 units, funnel 510→391→300→235→198→160, branch units
47/40/36/31/6, rep rollups reconciling with branch rollups, and empty-period behaviour).
Extend it when adding a selector; do not weaken an assertion to make a change pass.

For UI changes, drive the real thing rather than assuming: `npm run preview`, then
Chrome headless with `--remote-debugging-port=9222` and a small CDP script to click
through and read the DOM. This is how the drill-down was checked end to end.
