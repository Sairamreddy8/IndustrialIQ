# DealerPulse — decisions

A dashboard over `dealership_data.json`: 7 months, 5 branches, 30 reps, 510 leads.
React 19 + Vite + Tailwind v4 + Recharts, plain JavaScript, no backend.

---

## What I built, and why

The brief has five minimum requirements and a wide open-ended space. I deliberately
built **only the five**, and tried to make each one genuinely good rather than spread
thin across forecasting, what-if scenarios and AI summaries.

The reasoning: this dataset has one loud story in it — one branch is failing, and
₹5.5 Cr of already-paid orders is sitting undelivered. A dashboard that surfaces those
two facts clearly is worth more to a dealership CEO than one that also has a what-if
slider. Breadth would have cost depth on the parts a real user touches every day.

| Requirement | How it is met |
|---|---|
| Overview dashboard | KPI row, deficit chart vs target, funnel, model demand, lead sources, delivery reliability, loss reasons, branch table |
| Drill-down | Network → branch (modal) → rep (expanding row inside it) |
| Actionable insight | "Requires attention!" panel + one finding per branch |
| Filtering / time range | Presets and a custom month span in the navbar |
| Responsive | Verified at 1440 / 1024 / 768 with no horizontal overflow |

The whole thing is client-side. 510 leads is small enough that every filter change
recomputes in memory instantly, so a backend would have added deployment surface
without making anything faster.

---

## Key product decisions and tradeoffs

**Metric definitions are fixed in one place.** Revenue and units are recognised on
`delivery_date`, because that is what the monthly targets are written against. Leads and
the funnel bucket on `created_at`. Every selector takes the same `{ range, branchId,
repId }` scope, so the branch modal is the same functions with a narrower scope rather
than a second implementation that can drift.

**Everything time-relative is anchored to the data, not the clock.** The dataset ends
31 Dec 2025. Measuring "days idle" from `Date.now()` would report every lead as ~250 days
stale and make aging alerts meaningless, so the app derives an as-of date from the newest
activity and states it in the header. "Last 30 days" means the last 30 days *of the data*.

**Two different "delivered" numbers, kept apart on purpose.** Conversion needs a cohort
(leads *created* in the period that went on to deliver); target attainment needs
deliveries *recognised* in the period. They are identical over the full range and diverge
under a filter, which looks like a bug until it is labelled — so the branch table says
"Converted" and "Units vs target" and the subtitle spells out the difference.

**Insights ignore the date range.** An order placed in July that still has not been
delivered is exactly what needs chasing; hiding it because the user is looking at
December would defeat the point. The panel says "current state, not filtered by date".
Same reasoning for open pipeline, which stays constant across ranges and is labelled
"leads live now".

**Targets are shown as-is.** They total 1,426 units against 510 total leads, so every
attainment figure reads 2–15% and no branch could hit target even by converting every
enquiry. I flagged this and was asked to present it without editorial commentary, so the
dashboard reports the real numbers. It is the single biggest caveat for anyone reading
the attainment figures.

**A deficit bar instead of bars against a target line.** At ~11% attainment, bars plotted
under a target line were slivers beneath a mostly empty plot. Stacking the shortfall on
top means each bar spans the full target, attainment reads as how far the blue climbs,
and the empty space now states the gap instead of being blank.

**Drill-down is a modal, not routes.** This was an explicit product call during the build.
It keeps the app a single page and the branch context adjacent to the network numbers.
The tradeoff is real: a branch view is not linkable or shareable, and a browser back
button does not close the modal. With routes I would have got both.

**Deterministic insights, not an LLM.** Every finding is a rule over the data with the
numbers that produced it and a named action. No API key, no cost, and — more importantly
— it cannot invent a figure. The tradeoff is that the prose is templated: the rules pick
which finding fires and every number in it, but the sentence shapes are hand-written.

**No contact details for managers.** `sales_reps` carries only id, name, branch, role and
joined date; the only phone numbers in the file belong to lead customers. The manager card
shows identity and tenure rather than inventing a phone number that would look real in a
dashboard someone might act on.

**Managers are excluded from the rep leaderboard.** All five carry zero leads, which is
information rather than missing data. They head the branch panel instead of appearing as
a row of dashes.

**Light mode only, single-hue marks.** Bar length already carries magnitude, so colour is
not spent re-encoding it; the two blues alternate as rhythm, not meaning, and carry no
legend. The four status colours are reserved for state and always ship beside a word.

**Verification is a script, not a claim.** `npm run verify` holds 124 assertions against
figures derived independently from the dataset — totals, funnel counts, per-branch
rollups reconciling with network totals, empty-period behaviour, and three mutation tests
that prove the insights are derived rather than hard-coded (deliver every order and the
stalled finding disappears; double a branch's deal values and the reported rupees
double). UI behaviour was checked by driving the built app through Chrome DevTools
Protocol, not by eyeballing screenshots.

---

## What I would build next

1. **Make views linkable.** Move drill-down and the time range into the URL. It is the
   main thing lost by choosing a modal, and it is what lets a CEO send a branch manager a
   link to the exact view they are discussing.
2. **Lead-level actions.** The insights name what to do but cannot yet do it. Clicking
   "24 paid orders are stuck" should open that list of 24 with the customer, the rep and
   a way to mark it chased.
3. **Cohort-aware forecasting.** Median lead-to-delivery is 37 days, p90 51. That is
   enough to project which open leads land inside the month and give the pace-to-target
   number the target tiles cannot currently support.
4. **Rep coaching view.** Per-rep stage conversion against the branch, to separate reps
   who cannot open from reps who cannot close.
5. **Trend on the insights.** "24 stalled orders" matters differently if it was 30 last
   week or 12. Nothing in a single snapshot can say which.
6. **Tests around the components.** The analytics layer is well covered; the React layer
   is verified by driving the real app, which catches regressions but is slower than unit
   tests would be.

---

## Patterns in the data

**Lakeside Toyota is failing at the top of its funnel, not the bottom.** It delivered
6 units against a 264 target (2%) while every other branch ran 12–15%. The cause is not
speed — its median first-contact is 2.1 days against 1.9 network-wide — it is that
**33 of its 79 leads were never called at all** (42%, against 18–22% elsewhere), and
every one of those was written off as lost.

**A first call is effectively a prerequisite for a sale.** Across all 510 leads, 119 never
reached "contacted". **Zero of them ever converted** — 114 lost, 5 still sitting open.
Not a weak correlation; no exceptions.

**Contact rate almost entirely explains branch conversion.** Across the five branches the
correlation between contact rate and lead-to-delivery conversion is **0.96**. With only
five branches this is suggestive rather than conclusive, but it points at execution
rather than territory or product mix.

**It is not the cars, and not the deal size.** Average deal value is flat across branches
(₹21.6 L–₹25.5 L), and Lakeside's average is mid-pack. No branch is losing because it
attracts cheaper buyers.

**Lead source quality varies threefold and the branches are not equally supplied.**
Walk-ins convert at 46%, social media at 14%, everything else 28–30%. Walk-in share by
branch tracks conversion at 0.94 — Eastside and Downtown draw ~31% walk-ins, Lakeside
only 20%. Source mix and contact rate are confounded here, so I would not claim which
drives which without more branches.

**₹5.5 Cr is paid for and undelivered.** 24 orders sit past 30 days with no handover,
11 of them past 90 days, the worst at **195 days** — against a 17-day median delivery.
This is the highest-value, most immediately fixable item in the dataset, and nothing in
the raw data surfaces it.

**Delivery reliability is a branch problem, not a network one.** 45% of all deliveries
carry a delay reason, but that ranges from Central at 26% to Downtown at 55% on similar
volumes. The common causes are logistics and allocation, which suggests process rather
than demand.

**Demand was still growing when the data ends.** Monthly leads rose 55 → 95 from June to
November before dipping to 75 in December, while deliveries climbed to a high of 52 in
December. Deliveries lag leads by roughly two months (median lead-to-delivery is 37 days
plus the order backlog), so June's leads only start landing in August — which is why the
first month shows zero revenue against a full target.

### Data quality notes

- **14 leads are marked `lost` with no `lost` event in their history and no reason.**
  Current stage therefore comes from `lead.status`, never the tail of `status_history`.
  They are bucketed as "Not recorded" rather than dropped.
- **Targets are unreachable by construction** — 1,426 units against 510 total leads.
- **Referential integrity is otherwise clean**: every `assigned_to` resolves, rep and lead
  branches always agree, all 160 deliveries join 1:1 to the 160 delivered leads, and every
  status history is chronologically ordered.
- **No contact information exists** for reps anywhere in the file.
