# DealerPulse

Dealership network performance dashboard, built on `dealership_data.json`
(7 months, 5 branches, 30 sales reps, 510 leads).

## Running

```bash
npm install
npm run dev        # development server
npm run build      # production build
npm run preview    # serve the production build
npm run lint       # oxlint
```

`npm run verify` checks the analytics layer against known values derived from the
dataset — run it after touching anything in `src/lib/`.

## Structure

```
src/lib/          data normalisation, metric functions, formatting
src/context/      loads the dataset once, shares it via context
src/components/   presentational pieces (cards, table, charts)
src/pages/        Overview — composes the above
scripts/          regression checks for the analytics layer
```

## Metric definitions

These are fixed in `src/lib/analytics.js` so every view agrees:

- **Revenue and units** are recognised on `delivery_date` — that is what the monthly
  targets are written against.
- **Leads and the funnel** are bucketed on `created_at`. The funnel counts every stage
  a lead *ever reached*, read from `status_history`, so a delivered lead still counts
  as having been contacted.
- **Targets** are prorated by the share of each month a date range covers, so a partial
  month is never judged against a full month's target.
- **Anything time-relative** is measured from the dataset's own as-of date
  (31 Dec 2025), never `Date.now()`.
- **Current stage** comes from `lead.status`, never the tail of `status_history` — 14
  leads are marked `lost` without a matching `lost` event, so the two disagree.

## Notes on the data

- Targets total 1,426 units against 510 total leads for the period, so attainment reads
  2–15% across every branch. That is the data as supplied; it is shown as-is.
- Lakeside Toyota (Bangalore) delivered 6 units against a 264 target and contacted only
  58% of its leads, against 78–82% at every other branch.
