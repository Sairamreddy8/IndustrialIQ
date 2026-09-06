# DealerPulse — decisions

**Live:** https://industrial-iq-topaz.vercel.app/
**Sai Ram Reddy** · React 19 + Vite + Tailwind v4 + Recharts, plain JavaScript, no backend.
Built on `dealership_data.json` — 7 months, 5 branches, 30 reps, 510 leads.

---

## What I built, and why

I read the dataset before designing anything, and it has one loud story in it: one branch is
failing at the top of its funnel, and ₹5.54 Cr of paid orders is sitting undelivered — the
worst for 195 days against a 17-day median. Neither fact is visible in the raw file.

So I built the five minimum requirements properly, then spent the open-ended budget on the
three things that surface and act on that story.

| From the brief                    | Where it lives                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Overview dashboard                | KPI row, deficit chart vs target, funnel, loss reasons, sources, delivery, model demand, branch table |
| Drill-down                        | Network → branch (modal) → rep (expanding row inside it)                                              |
| Actionable insight                | "Requires attention!" panel, plus one finding per branch                                              |
| Filtering / time range            | Presets and a custom month span in the navbar                                                         |
| Responsive                        | Driven at 1512 / 1024 / 820 with no horizontal overflow                                               |
| **Lead aging & follow-up alerts** | Three aging rules, plus an Idle column on every lead list                                             |
| **Conversion funnel**             | Stage-by-stage drop-off, with branch-vs-network benchmarking                                          |
| **Automatic flagging**            | Per-branch rules measured against the network baseline                                                |

Everything is client-side: 510 leads recompute in memory instantly on every filter change,
so a backend would have added deployment surface without making anything faster.

## The three open-ended pieces

**Lead aging and follow-up alerts.** Every lead carries `idleDays`, `ageDays` and
`daysSinceOrder`, computed once and measured from the dataset's own as-of date. Three rules
run over the live pipeline: orders paid but undelivered past `STALLED_ORDER_DAYS = 30`
(critical), deals past their `expected_close_date` (warning), and leads untouched beyond
`COLD_LEAD_DAYS = 7` (warning above five, else a note). Seven days is not arbitrary — the
median contacted-to-test-drive gap here is 5.9 days, so a week of silence is already
off-pattern. Findings sort by severity then rupees at stake, so the most expensive critical
item leads the page.

**The conversion funnel.** It counts every stage a lead _ever reached_, read from
`status_history`, not its current status — otherwise a delivered lead would not count as
having been contacted and every step would undercount. Each step shows how many continued,
how many fell out, and what share of the cohort survives. In the drill-down the same
component takes the network funnel as a benchmark and marks any step more than five points
behind it, so a manager sees where _their_ branch leaks rather than holding a number in
their head from the previous screen.

**Automatic flagging.** Each branch runs four rules and the most severe finding is shown;
two are baseline-relative rather than fixed thresholds. A branch is flagged for
never-contacted leads when its rate exceeds 1.4× the network rate, and for delivery delays
when it runs more than five points above it. This is rule-based flagging against a baseline,
not statistical anomaly detection — five branches is not enough population for a z-score to
mean anything, and a threshold I can explain to a CEO beats a statistic I cannot. It returns
nothing when a branch is clean: a branch with no problem must not have one manufactured.

## Product decisions and tradeoffs

**Everything time-relative is anchored to the data, not the clock.** The dataset ends
31 Dec 2025. Measuring idle days from `Date.now()` would report every lead as ~250 days stale
and make the aging alerts worthless. The app derives its as-of date from the newest activity
and shows it in the header, so "Last 30 days" means the last 30 _of the data_.

**Revenue counts on delivery, leads on creation — so there are two "delivered" numbers, kept
apart on purpose.** Units and rupees count on `delivery_date`, what the targets are written
against; leads and the funnel bucket on `created_at`. Conversion therefore needs a cohort —
leads _created_ in the period that went on to deliver — while attainment needs deliveries
_recognised_ in it. They agree over the full range and diverge under a filter, which looks
like a bug until labelled, so the branch table says "Converted" and "Units vs target" and the
subtitle spells out the difference.

**Insights ignore the date range.** An order placed in July that still has not shipped is
exactly what needs chasing; hiding it because the user is on December defeats the point. The
panel says so: "current state, not filtered by date."

**Targets are shown as-is.** They total 1,426 units against 510 leads, so attainment reads
2–15% everywhere and no branch could hit target even by converting every enquiry — the
biggest caveat on those numbers, and I have not smoothed it.

**A deficit bar rather than bars against a target line.** At ~11% attainment, bars under a
target line were slivers beneath an empty plot. Stacking the shortfall on top means each bar
spans the full target and attainment reads as how far the colour climbs — the empty space
now states the gap instead of just being empty.

**Drill-down is a modal, not routes.** It keeps the app one page, branch context adjacent to
the network numbers. The cost is real: a branch view is not linkable, and the back button
does not close it.

**Deterministic rules, not an LLM.** Every finding is a rule carrying the numbers that
produced it and a named action. No API key, no per-view cost, and it cannot invent a figure.
The tradeoff is templated prose: the rules pick which finding fires and every number in it,
but the sentence shapes are mine.

## Architecture and verification

The raw JSON is fetched and normalised once. That pass precomputes, per lead, its dates, the
set of stages it reached and its idle and order ages — so no component re-walks
`status_history`, and the funnel is a set lookup per stage rather than a scan. Data flows one
way: `data.js` normalises, `analytics.js` derives every number, components only render, and
every selector takes the same `{ range, branchId, repId }` scope — so the branch modal is
those functions narrowed, not a second implementation that can drift. Each view computes its
panels in one `useMemo`.

Honest note on performance: the rollups call the selectors per branch and per rep, so they
are linear rescans rather than one grouping pass. At 510 leads that is free; at a hundred
thousand it is the first thing I would change.

`npm run verify` holds 124 assertions against figures derived independently from the dataset
— totals, exact funnel counts, per-branch rollups reconciling with network totals, target
proration, empty-period behaviour. Three are mutation tests proving the insights are derived
rather than hard-coded: deliver every outstanding order and the stalled finding disappears;
contact every Lakeside lead and its finding changes; double a branch's deal values and the
reported rupees double. UI behaviour was checked by driving the built app through the Chrome
DevTools Protocol, not by eyeballing.

## What I would build next, with more time

1. **Export and sharing.** The first thing I would add, and the price of the modal: put
   drill-down and the time range in the URL so a view is a link, then a CSV behind any panel
   and a one-page branch summary. Spotting Lakeside is step one; forwarding it to whoever
   owns Lakeside is step two, and the app cannot do it.
2. **AI-written summaries over the same rules.** The rules already pick which finding fires
   and every number in it; what they cannot do is write. An LLM handed only the computed
   findings, never the raw dataset, would turn them into a paragraph a manager reads in one
   go — and could phrase a figure but never invent one. The templated prose above, fixed
   without giving up the guarantee.
3. **Lead-level actions.** The insights name what to do but cannot do it. Clicking "24 paid
   orders are stuck" should open those 24 with the customer, the rep, and a way to mark one
   chased.
4. **Cohort-aware forecasting.** Median lead-to-delivery is 37 days, p90 51 — enough to
   project which open leads land inside the month and give the pace-to-target number the
   target tiles cannot currently support.

## Patterns in the data

**Lakeside Toyota is failing at the top of its funnel, not the bottom.** It delivered 6 units
against a 264 target (2%) while every other branch ran 12–15%. Not speed — median first
contact is 2.1 days against 1.9 network-wide. It is that **33 of its 79 leads were never
called at all** (42%, against 18–22% elsewhere), every one written off as lost.

**A first call is effectively a prerequisite for a sale.** Of 510 leads, 119 never reached
"contacted". **Zero converted** — 114 lost, 5 still open. Not a weak correlation; no
exceptions.

**Contact rate almost entirely explains branch conversion.** Across the five branches the
correlation between contact rate and conversion is **0.96** — suggestive rather than
conclusive at n=5, but it points at execution, not territory or product mix. It is certainly
not the cars or the deal size: average deal value is flat across branches (₹21.6–25.5 L),
with Lakeside mid-pack.

**Lead source quality varies threefold, and branches are not equally supplied.** Walk-ins
convert at 46%, social media at 14%, the rest 28–30%. Walk-in share by branch tracks
conversion at 0.94. Source mix and contact rate are confounded, so I would not claim which
drives which without more branches.

**₹5.54 Cr is paid for and undelivered.** 24 orders sit past 30 days with no handover, 11
past 90, the worst at **195 days** against a 17-day median. It is the highest-value, most
immediately fixable item in the file, and nothing in the raw data surfaces it.

**Delivery reliability is a branch problem, not a network one.** 45% of deliveries carry a
delay reason, ranging from Central at 26% to Downtown at 55% on similar volumes. The common
causes are logistics and allocation — process, not demand.

**Demand was still growing when the data ends.** Monthly leads rose 55 → 95 from June to
November, dipping to 75 in December. Deliveries lag leads by about two months — which is why
June shows zero revenue against a full target.

### Data quality notes

- **14 leads are marked `lost` with no `lost` event and no reason.** Current stage therefore
  comes from `lead.status`, never the tail of `status_history`; those 14 bucket as
  "Not recorded" rather than being dropped.
- **Targets are unreachable by construction** — 1,426 units against 510 leads.
- **Integrity is otherwise clean**: every `assigned_to` resolves, rep and lead branches
  agree, all 160 deliveries join 1:1 to the 160 delivered leads, histories are ordered.
- **No contact information exists** for reps — `sales_reps` holds only id, name, branch,
  role and joined. The manager card shows identity and tenure rather than inventing a phone
  number that would look real in a dashboard someone might act on.
