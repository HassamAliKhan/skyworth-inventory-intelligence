// Single seeded data source for the Inventory Intelligence dashboard.
// No backend: every figure on screen originates here.

export const TIMELINE_START = new Date(Date.UTC(2026, 1, 1)); // 1 Feb 2026
export const TIMELINE_END = new Date(Date.UTC(2026, 10, 30)); // 30 Nov 2026
export const TODAY_PCT = 66;

const DAY = 86_400_000;
const totalDays = Math.round((TIMELINE_END.getTime() - TIMELINE_START.getTime()) / DAY);

export const TODAY = new Date(TIMELINE_START.getTime() + Math.round(totalDays * (TODAY_PCT / 100)) * DAY);

export function dateAtPct(pct: number): Date {
  return new Date(TIMELINE_START.getTime() + Math.round(totalDays * (pct / 100)) * DAY);
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export type SeriesPoint = {
  t: number;
  label: string;
  history: number | null;
  p50: number | null;
  band: [number, number] | null;
};

function wobble(i: number) {
  return Math.sin(i * 1.7) * 34 + Math.sin(i * 0.6) * 22;
}

function buildSeries(): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  const todayT = TODAY.getTime();
  const weeklyBurn = 48;
  for (let week = 0; week <= 43; week++) {
    const date = new Date(TIMELINE_START.getTime() + week * 7 * DAY);
    const t = date.getTime();
    const weeksFromToday = (t - todayT) / (7 * DAY);
    const level = 90 - weeksFromToday * weeklyBurn;
    const point: SeriesPoint = {
      t,
      label: formatShortDate(date),
      history: null,
      p50: null,
      band: null,
    };
    if (t <= todayT) {
      point.history = Math.max(0, Math.round(level + wobble(week)));
    }
    if (t >= todayT) {
      const k = Math.max(0, weeksFromToday);
      const spread = 26 + k * 58;
      const floor = -260;
      point.p50 = Math.max(floor, Math.round(level));
      point.band = [
        Math.max(floor, Math.round(level - spread)),
        Math.max(floor, Math.round(level + spread)),
      ];
    }
    points.push(point);
  }
  return points;
}

export const projectionSeries = buildSeries();

// p50 crosses zero here.
export const stockoutDate = new Date(Date.UTC(2026, 7, 18));
export const stockoutPoint = (() => {
  const t = stockoutDate.getTime();
  return { t, y: 0 };
})();

export const REORDER_POINT = 120;

export const warehouses = ["All warehouses", "DC-East", "DC-West", "DC-South"] as const;
export type Warehouse = (typeof warehouses)[number];

export type Kpi = {
  eyebrow: string;
  value: string;
  unit?: string;
  note: string;
  rangeValue?: string;
  tone?: "brand" | "risk" | "muted";
};

export const kpis: Kpi[] = [
  {
    eyebrow: "AVAILABLE TO PROMISE",
    value: "18,420",
    unit: "units",
    note: "Across four sites",
    rangeValue: "9,100 – 21,600",
  },
  { eyebrow: "SKUS AT RISK", value: "4", note: "Two need action this week", tone: "risk" },
  { eyebrow: "DATA TRUST", value: "0.91", note: "Two exceptions open" },
  { eyebrow: "FORECAST ERROR", value: "14.2%", unit: "WAPE", note: "31% better than naive baseline" },
  { eyebrow: "NOT FORECAST", value: "1", note: "Engine withheld — insufficient data", tone: "muted" },
];

export const aiRead = {
  paragraph:
    "Two sites need attention. DC-East runs out of the 55-inch panel around 18 August at the current sell-through, and a transfer from DC-West covers the gap with eleven days to spare. DC-South is the second concern: count variance has widened for three cycles, so its available-to-promise is being treated as less reliable until the next full count clears.",
  footer: "WRITTEN FROM COMPUTED FIGURES · EVERY NUMBER TRACEABLE",
};

export type Exception = {
  title: string;
  detail: string;
  status: "open" | "resolved" | "watch";
  statusLabel: string;
};

export const exceptions: Exception[] = [
  {
    title: "Negative on-hand, DC-East",
    detail: "Resolved as a timing gap between the sale and the receipt posting.",
    status: "resolved",
    statusLabel: "Resolved",
  },
  {
    title: "Unit-of-measure mismatch",
    detail: "Supplier sends cases, the ledger records eaches on SKU-4420.",
    status: "open",
    statusLabel: "Open",
  },
  {
    title: "Stale TMS feed",
    detail: "In-transit positions last refreshed 19 hours ago, against a 4-hour target.",
    status: "open",
    statusLabel: "Open",
  },
  {
    title: "Count variance trend, DC-South",
    detail: "Variance widened across three cycles. Watching until the next full count.",
    status: "watch",
    statusLabel: "Watching",
  },
];

export type RiskState = "critical" | "watch" | "on-plan" | "excess" | "withheld";

export type LedgerEvent = {
  date: string;
  type: "RECEIPT" | "SALE" | "TRANSFER_OUT" | "CYCLE_COUNT" | "RETURN";
  source: string;
  reference: string;
  qty: number;
};

export type Trace = {
  ledger: LedgerEvent[];
  reconciliation: { label: string; value: string }[];
  position: { label: string; value: string }[];
  forecast?: { label: string; value: string }[];
  simulation?: { label: string; value: string }[];
  validation?: { label: string; value: string }[];
  read: string;
  withheldNote?: string;
};

export type RiskRow = {
  id: string;
  item: string;
  sku: string;
  site: Exclude<Warehouse, "All warehouses">;
  risk: number | null;
  daysOfCover: number;
  trust: number;
  action: string;
  state: RiskState;
  trace: Trace;
};

const baseLedger = (sku: string): LedgerEvent[] => [
  { date: "04 Aug 2026", type: "RECEIPT", source: "WMS", reference: `PO-88${sku.slice(-2)}1`, qty: 240 },
  { date: "05 Aug 2026", type: "SALE", source: "OMS", reference: "SO-41902", qty: -128 },
  { date: "06 Aug 2026", type: "TRANSFER_OUT", source: "WMS", reference: "TR-2207", qty: -60 },
  { date: "07 Aug 2026", type: "CYCLE_COUNT", source: "WMS", reference: "CC-3391", qty: -6 },
  { date: "09 Aug 2026", type: "RETURN", source: "OMS", reference: "RMA-1188", qty: 14 },
  { date: "10 Aug 2026", type: "SALE", source: "OMS", reference: "SO-42077", qty: -84 },
];

function makeTrace(over: Partial<Trace> & { sku: string; read: string }): Trace {
  return {
    ledger: baseLedger(over.sku),
    reconciliation: [
      { label: "Last count", value: "07 Aug 2026, cycle count CC-3391" },
      { label: "Variance", value: "−6 units (0.4% of counted quantity)" },
      { label: "Open exceptions", value: "1 — unit-of-measure mismatch" },
      { label: "Feed freshness", value: "WMS 12 min · OMS 8 min · TMS 19 h" },
      { label: "Data trust score", value: "0.91" },
    ],
    position: [
      { label: "On hand", value: "90" },
      { label: "Reserved", value: "−40" },
      { label: "Available to promise", value: "50" },
      { label: "In transit", value: "+200" },
    ],
    forecast: [
      { label: "Model", value: "gradient-boosted demand, v4.2.1" },
      { label: "Demand p10 / p50 / p90", value: "38 / 61 / 94 units per day" },
      { label: "Top driver", value: "Retail promotion window, weeks 33–35" },
      { label: "Lead time p50 / p90", value: "18 days / 27 days" },
    ],
    simulation: [
      { label: "Paths ending in stockout", value: "3,900 of 5,000" },
      { label: "Probability", value: "78%" },
      { label: "Median stockout date", value: "18 August 2026" },
      { label: "Expected units short", value: "1,240" },
    ],
    validation: [
      { label: "Backtest WAPE", value: "14.2%" },
      { label: "Improvement over baseline", value: "31%" },
      { label: "Interval coverage", value: "p10–p90 captured 88% of actuals" },
      { label: "Publish gate", value: "PASSED" },
    ],
    ...over,
  };
}

export const riskRows: RiskRow[] = [
  {
    id: "sku-4420",
    item: "55-inch QLED panel",
    sku: "SKU-4420",
    site: "DC-East",
    risk: 88,
    daysOfCover: 7,
    trust: 0.91,
    action: "Transfer 600 units from DC-West",
    state: "critical",
    trace: makeTrace({
      sku: "SKU-4420",
      read: "This item runs out around 18 August at the current rate of sale. A transfer of 600 units from DC-West arrives eleven days before the projected stockout and costs less than air freight on the same volume.",
    }),
  },
  {
    id: "sku-3311",
    item: "65-inch OLED panel",
    sku: "SKU-3311",
    site: "DC-South",
    risk: 78,
    daysOfCover: 11,
    trust: 0.84,
    action: "Raise purchase order, 1,200 units",
    state: "critical",
    trace: makeTrace({
      sku: "SKU-3311",
      read: "Cover falls below the reorder point in eleven days. Supplier lead time is 18 days at p50, so a purchase order raised this week still lands after the reorder point is crossed but before cover reaches zero.",
    }),
  },
  {
    id: "sku-2208",
    item: "Soundbar, 3.1 channel",
    sku: "SKU-2208",
    site: "DC-West",
    risk: 46,
    daysOfCover: 24,
    trust: 0.93,
    action: "Hold, review after next count",
    state: "watch",
    trace: makeTrace({
      sku: "SKU-2208",
      read: "Cover sits at 24 days and demand is steady. The position is worth a second look after the next cycle count, but no order is needed this week.",
    }),
  },
  {
    id: "sku-6015",
    item: "Wall mount bracket, large",
    sku: "SKU-6015",
    site: "DC-East",
    risk: 39,
    daysOfCover: 29,
    trust: 0.88,
    action: "Hold, monitor promotion uplift",
    state: "watch",
    trace: makeTrace({
      sku: "SKU-6015",
      read: "Demand rises with panel sales, so the promotion window in weeks 33 to 35 is the main uncertainty. Cover holds at 29 days under the p50 path.",
    }),
  },
  {
    id: "sku-1102",
    item: "Remote control, voice",
    sku: "SKU-1102",
    site: "DC-West",
    risk: 12,
    daysOfCover: 61,
    trust: 0.95,
    action: "No action",
    state: "on-plan",
    trace: makeTrace({
      sku: "SKU-1102",
      read: "Cover is comfortable at 61 days with stable demand and a short lead time. Nothing is required.",
    }),
  },
  {
    id: "sku-5540",
    item: "Power supply module",
    sku: "SKU-5540",
    site: "DC-South",
    risk: 9,
    daysOfCover: 74,
    trust: 0.92,
    action: "No action",
    state: "on-plan",
    trace: makeTrace({
      sku: "SKU-5540",
      read: "Supply and demand are matched. The next replenishment is already scheduled and lands well inside cover.",
    }),
  },
  {
    id: "sku-8890",
    item: "43-inch LED panel",
    sku: "SKU-8890",
    site: "DC-West",
    risk: 3,
    daysOfCover: 214,
    trust: 0.9,
    action: "Rebalance 400 units to DC-East",
    state: "excess",
    trace: makeTrace({
      sku: "SKU-8890",
      read: "Cover runs to 214 days, well past the point where holding cost outweighs the service benefit. Moving 400 units to DC-East reduces the excess and covers demand there.",
    }),
  },
  {
    id: "sku-7104",
    item: "Portable projector, new line",
    sku: "SKU-7104",
    site: "DC-East",
    risk: null,
    daysOfCover: 0,
    trust: 0.41,
    action: "Needs ~6 more weeks of history",
    state: "withheld",
    trace: {
      ledger: [
        { date: "22 Jul 2026", type: "RECEIPT", source: "WMS", reference: "PO-9101", qty: 120 },
        { date: "26 Jul 2026", type: "SALE", source: "OMS", reference: "SO-40118", qty: -8 },
        { date: "31 Jul 2026", type: "CYCLE_COUNT", source: "WMS", reference: "CC-3288", qty: -2 },
        { date: "03 Aug 2026", type: "SALE", source: "OMS", reference: "SO-40559", qty: -11 },
        { date: "06 Aug 2026", type: "RETURN", source: "OMS", reference: "RMA-1174", qty: 3 },
        { date: "09 Aug 2026", type: "TRANSFER_OUT", source: "WMS", reference: "TR-2214", qty: -15 },
      ],
      reconciliation: [
        { label: "Last count", value: "31 Jul 2026, cycle count CC-3288" },
        { label: "Variance", value: "−2 units (1.7% of counted quantity)" },
        { label: "Open exceptions", value: "0" },
        { label: "Feed freshness", value: "WMS 12 min · OMS 8 min · TMS 19 h" },
        { label: "Data trust score", value: "0.41" },
      ],
      position: [
        { label: "On hand", value: "87" },
        { label: "Reserved", value: "−12" },
        { label: "Available to promise", value: "75" },
        { label: "In transit", value: "+0" },
      ],
      read: "There are three weeks of sales history for this line and no comparable item to borrow a demand shape from. The position above is measured, not predicted.",
      withheldNote:
        "The engine will not publish a number it cannot defend. This line has three weeks of history, below the nine weeks the validation gate requires, so no forecast, simulation or backtest is produced. Roughly six more weeks of sales will clear the gate.",
    },
  },
];

export const stateLabels: Record<RiskState, string> = {
  critical: "Critical",
  watch: "Watch",
  "on-plan": "On plan",
  excess: "Excess",
  withheld: "No forecast",
};
