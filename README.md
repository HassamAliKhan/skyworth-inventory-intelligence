# Inventory Compass

Build an executive logistics dashboard called Inventory Intelligence. Single page, light, airy, premium — match skyworthusa.com exactly — white, spacious, rounded, calm, not a generic SaaS admin panel. All data is seeded in a single data.js file. No backend, no auth, no Supabase.

Design tokens — use these exactly, as CSS variables:

Page canvas #F6F7F9, cards white #FFFFFF, a light grey utility bar #EFEFF1, hairlines #E3E5EA

Brand royal blue #1A56DB, soft blue fill #EBF1FE

Risk red #E5484D, watch amber #F0A020, on-plan teal #0E9F7E, excess violet #7C5CFC

Text #0F1419, body #5A6272, muted #8A92A6, faint #B4BAC6

Blue is the brand and the forecast colour — anything predicted is blue and dashed. Red means risk. Never use blue for a warning.

Typography — load from Google Fonts: Plus Jakarta Sans (headings and large numerals, 700/800), Inter (body), JetBrains Mono (SKU codes, quantities, small uppercase eyebrow labels). Cards use 14px radius with a soft shadow, and every button is a full pill (border-radius: 999px) exactly like the Learn More button on skyworthusa.com. Light, airy, generous padding — this is not a dense dark cockpit.

Layout, top to bottom:

Header — two bars, matching skyworthusa.com. A thin light grey utility strip on top with right-aligned links (Operations, Planning, Suppliers, Support). Below it a white nav bar: "SKYWORTH" in bold blue, a thin divider, then "Inventory Intelligence" in grey. Right side: a pill-shaped warehouse dropdown (All warehouses / DC-East / DC-West / DC-South) and a pill status chip with a small green dot reading "Engine live".

Time scrubber — this is the signature element, give it real care. A full-width horizontal range slider spanning Feb 2026 to Nov 2026, with a "TODAY" tick at roughly 66%. The track left of TODAY is a solid dark line (settled history); the track right of TODAY is a dashed blue line (simulated future). The handle is a white circle with a thick ring — dark in the past, blue in the future — and a soft halo. Above it, a large date that updates as you drag, plus a label that switches between "Historical state" / "Current state" / "Projected state". Dragging into the future must visibly change the dashboard: KPI point values are replaced by ranges, and the subtitle changes to "Range shown, not a point estimate".

KPI strip — five cards in a row: Available to promise (18,420 units), SKUs at risk (4), Data trust (0.91), Forecast error (14.2% WAPE, "31% better than naive baseline"), and Not forecast (1, "Engine withheld — insufficient data"). In future mode the first card shows "9,100 – 21,600 range" in blue instead of a single number.

Main row, two columns (2fr / 1fr). Left: a projection chart (recharts ComposedChart). A solid white line for settled history up to today, a dashed blue line for the p50 forecast, and a blue shaded area for the p10–p90 band that widens with distance into the future. Mark: a dashed red zero line, a dashed amber "reorder point" line at 120, a vertical "today" line, a red dot where the p50 crosses zero, and a vertical marker that follows the scrubber position. Title it "Runs out around 18 August". Right, stacked: an AI read panel — a short paragraph in plain English naming the two sites that need attention, footed with small mono text reading "WRITTEN FROM COMPUTED FIGURES · EVERY NUMBER TRACEABLE". Below it a Data trust panel listing four reconciliation exceptions, each with a small coloured status dot (amber = open, green = resolved, grey = watch): a negative on-hand resolved as a timing gap, a unit-of-measure mismatch, a stale TMS feed, and a count-variance trend at DC-South.

Risk register table — 8 rows. Columns: Item (name plus mono SKU beneath), Site, Stockout risk (a small horizontal bar plus a percentage, coloured by state), Days of cover, Trust score, Recommended action, and a state pill. Rows highlight on hover and are clickable. Include: two critical items (78% and 88%), two watch items, two on-plan items, one excess item (214 days cover, purple pill), and one item where risk reads "withheld" with a grey "No forecast" tag and the action "Needs ~6 more weeks of history".

Trace drawer — clicking any row slides a white panel in from the right over a soft dark scrim. This is the most important feature in the product, so build it properly. Seven numbered steps (01–07), each with a mono eyebrow label and a small bordered number box:

01 Ledger — six movement events with date, type (RECEIPT / SALE / TRANSFER_OUT / CYCLE_COUNT / RETURN), source, reference, and a signed quantity coloured green for positive, red for negative

02 Reconciliation — last count and variance, open exceptions, feed freshness, data trust score

03 Position — on hand 90, reserved −40, available to promise 50, in transit +200

04 Forecast — model name and version, demand p10/p50/p90, top driver, lead time p50/p90

05 Simulation — paths ending in stockout (3,900 of 5,000), probability, median date, expected units short

06 Validation — backtest WAPE, improvement over baseline, interval coverage, publish gate PASSED

07 Read — a plain-English paragraph in a soft blue tinted box, footed with "LANGUAGE MODEL DESCRIBES COMPUTED FIGURES ONLY · IT NEVER PRODUCES A QUANTITY"

 Then a recommended action block with two buttons: a solid blue pill "Approve transfer" and an outlined white pill "Compare with air freight". For the withheld item, steps 04–06 are replaced by a short amber explanation that the engine will not publish a number it cannot defend, and the action block is hidden.

Copy rules: sentence case throughout, plain verbs, no exclamation marks, no marketing language. Say "Runs out around 18 August", not "Stock alert!". Labels name what the user controls, not how the system works.

Responsive down to mobile: KPIs wrap, the two-column row stacks, the table scrolls horizontally, and the drawer goes full width. Respect prefers-reduced-motion. Visible keyboard focus on the slider, dropdown, table rows, and buttons.

What each screen element proves to the client

Worth having in your head for the walkthrough — every piece maps to a line in their brief.

Their requirementWhat you point at"Historical → Current → Predicted"The scrubber. Drag it and the whole page moves through time."Traceable to underlying data, assumptions, calculations"The trace drawer, steps 01–07."Confidence level"The p10–p90 fan, and KPIs turning into ranges in future mode."Reconciliation, anomaly detection"The data trust panel and the trust score column."Backtesting, continuous validation"Step 06, and the WAPE-vs-baseline KPI."Explicitly communicate uncertainty rather than manufacture confidence"SKU-7104. The engine refuses to forecast and says why."Not unexplained AI outputs"Step 07's footer line, twice on screen."The engine is the product"The whole page reads as a window onto an engine, not a CRUD app.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://skyworth-inventory-intelligence.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/304420d5-e8b8-495f-ba92-67d297ebcf61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
