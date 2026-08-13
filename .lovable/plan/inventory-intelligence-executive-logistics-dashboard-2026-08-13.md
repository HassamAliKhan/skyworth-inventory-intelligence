# Inventory Intelligence — executive logistics dashboard

A single light, airy page in the Skyworth visual language: white cards, generous spacing, pill buttons, royal blue as the brand and forecast colour. All figures come from one seeded data file. No backend.

## Screen structure

1. **Header** — thin grey utility strip with right-aligned links (Operations, Planning, Suppliers, Support); below it a white nav bar with "SKYWORTH" in blue, a hairline divider, "Inventory Intelligence" in grey, and on the right a pill warehouse dropdown (All warehouses / DC-East / DC-West / DC-South) plus an "Engine live" status pill with a green dot.
2. **Time scrubber** — full-width range slider from Feb 2026 to Nov 2026 with a TODAY tick at ~66%. Solid dark track for settled history, dashed blue track for the simulated future, white handle with a thick ring (dark in the past, blue in the future) and a soft halo. A large date above updates while dragging, with a label that reads Historical state / Current state / Projected state. Dragging into the future switches KPIs to ranges and changes the subtitle to "Range shown, not a point estimate".
3. **KPI strip** — five cards: Available to promise (18,420 units, becomes "9,100 – 21,600 range" in blue in future mode), SKUs at risk (4), Data trust (0.91), Forecast error (14.2% WAPE, 31% better than naive baseline), Not forecast (1, engine withheld).
4. **Main row (2fr / 1fr)** — left: recharts ComposedChart titled "Runs out around 18 August" with solid history line, dashed blue p50 forecast, blue p10–p90 band widening with distance, dashed red zero line, dashed amber reorder line at 120, vertical today line, red dot at the zero crossing, and a vertical marker tracking the scrubber. Right: an AI read panel (short plain-English paragraph naming the two sites needing attention, footed with mono "WRITTEN FROM COMPUTED FIGURES · EVERY NUMBER TRACEABLE") above a Data trust panel listing four reconciliation exceptions with amber/green/grey status dots.
5. **Risk register table** — 8 clickable rows: item name with mono SKU, site, stockout risk bar plus percentage coloured by state, days of cover, trust score, recommended action, state pill. Two critical (78%, 88%), two watch, two on-plan, one excess (214 days, violet), one withheld with a grey "No forecast" tag and the action "Needs ~6 more weeks of history".
6. **Trace drawer** — clicking a row slides a white panel in from the right over a soft dark scrim. Seven numbered steps (01–07) with mono eyebrows and bordered number boxes: ledger (six signed movement events), reconciliation, position, forecast, simulation, validation, and the plain-English read in a soft blue box footed with the "language model describes computed figures only" line. Ends with a recommended action block: solid blue pill "Approve transfer" and outlined pill "Compare with air freight". For the withheld SKU, steps 04–06 are replaced by a short amber note that the engine will not publish a number it cannot defend, and the action block is hidden.

## Behaviour

- Scrubber position drives KPI mode (point vs range), the chart marker, and the state label.
- Warehouse dropdown filters the register.
- Row click opens the drawer; Escape and the scrim close it.

## Technical notes

- Design tokens added as CSS variables in `src/styles.css` (canvas #F6F7F9, card #FFFFFF, utility #EFEFF1, hairline #E3E5EA, brand #1A56DB, soft blue #EBF1FE, red #E5484D, amber #F0A020, teal #0E9F7E, violet #7C5CFC, text/body/muted/faint greys) and registered in `@theme inline` so they are usable as Tailwind utilities. 14px card radius, soft shadow, `rounded-full` on every button.
- Fonts loaded via a `<link>` in `src/routes/__root.tsx` head (Plus Jakarta Sans, Inter, JetBrains Mono) and exposed as font-family tokens.
- `src/data/data.ts` holds every seeded figure: time axis, history/forecast series, KPI values, exceptions, the 8 register rows, and per-SKU trace payloads.
- Page built at `src/routes/index.tsx` (replaces the placeholder) with components under `src/components/inventory/` — Header, TimeScrubber, KpiStrip, ProjectionChart, AiReadPanel, DataTrustPanel, RiskRegister, TraceDrawer.
- Scrubber built on the existing Radix slider for keyboard and focus support, styled custom.
- Route `head()` gets its own title, description, og and twitter tags.
- Responsive: KPIs wrap, main row stacks, table scrolls horizontally, drawer full width on mobile. `prefers-reduced-motion` respected; visible focus rings on slider, dropdown, rows and buttons.
