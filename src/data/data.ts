// Single seeded data source for the Inventory Intelligence dashboard.
// No backend: every figure on screen is computed here from a deterministic simulation.

export const TIMELINE_START = new Date(Date.UTC(2026, 1, 1)); // 1 Feb 2026
export const TIMELINE_END = new Date(Date.UTC(2026, 10, 30)); // 30 Nov 2026
export const TODAY_PCT = 66;

const DAY = 86_400_000;
const totalDays = Math.round((TIMELINE_END.getTime() - TIMELINE_START.getTime()) / DAY);

export const TODAY = new Date(TIMELINE_START.getTime() + Math.round(totalDays * (TODAY_PCT / 100)) * DAY);
const TODAY_INDEX = Math.round(totalDays * (TODAY_PCT / 100));

export function dateAtPct(pct: number): Date {
  return new Date(TIMELINE_START.getTime() + Math.round(totalDays * (pct / 100)) * DAY);
}

export function pctAtDate(d: Date): number {
  const idx = Math.round((d.getTime() - TIMELINE_START.getTime()) / DAY);
  return Math.min(100, Math.max(0, (idx / totalDays) * 100));
}

export function dayIndexOf(d: Date): number {
  return Math.round((d.getTime() - TIMELINE_START.getTime()) / DAY);
}

export function dateAtIndex(i: number): Date {
  return new Date(TIMELINE_START.getTime() + i * DAY);
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-GB");
}

/* ---------------------------------------------------------------- engine */

// Deterministic LCG. Same output on every reload.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

function hashSeed(text: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

// Standard normal CDF.
function phi(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.398942280401 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

export type PurchaseOrder = { reference: string; qty: number; arrivalIndex: number; leadSpreadDays: number };

export type SkuProfile = {
  id: string;
  sku: string;
  item: string;
  site: Site;
  opening: number;
  baseDemand: number;
  promoSensitive: boolean;
  seasonalAmp: number;
  reorderPoint: number;
  safetyStock: number;
  reservedShare: number;
  trust: number;
  inbound: PurchaseOrder[];
  withheld?: boolean;
};

export const warehouses = ["All warehouses", "DC-East", "DC-West", "DC-South", "DC-North"] as const;
export type Warehouse = (typeof warehouses)[number];
export type Site = Exclude<Warehouse, "All warehouses">;

// Promotion window, weeks 33–35 of 2026 (mid-August).
const PROMO_START = dayIndexOf(new Date(Date.UTC(2026, 7, 10)));
const PROMO_END = dayIndexOf(new Date(Date.UTC(2026, 7, 30)));

function weekdayMultiplier(index: number): number {
  const dow = dateAtIndex(index).getUTCDay();
  return dow === 0 || dow === 6 ? 0.45 : 1.12;
}

function seasonal(index: number, amp: number): number {
  return 1 + amp * Math.sin((2 * Math.PI * (index + 20)) / 365);
}

function demandOn(p: SkuProfile, index: number, rand: () => number): number {
  const promo = p.promoSensitive && index >= PROMO_START && index <= PROMO_END ? 1.6 : 1;
  const noise = 0.82 + rand() * 0.36;
  return p.baseDemand * weekdayMultiplier(index) * seasonal(index, p.seasonalAmp) * promo * noise;
}

export type DayState = {
  index: number;
  date: Date;
  onHand: number;
  reserved: number;
  availableToPromise: number;
  inTransit: number;
  daysOfCover: number;
  stockoutRisk: number | null;
  state: RiskState;
  isActual: boolean;
  p50: number;
  band: [number, number];
  dailyDemand: number;
};

type Path = {
  level: number[];
  demand: number[];
  inTransit: number[];
  sigma1: number;
};

const pathCache = new Map<string, Path>();

function buildPath(p: SkuProfile): Path {
  const rand = lcg(hashSeed(p.sku));
  const level: number[] = [];
  const demand: number[] = [];
  const inTransit: number[] = [];
  let onHand = p.opening;
  for (let i = 0; i <= totalDays; i++) {
    const arrivals = p.inbound
      .filter((po) => po.arrivalIndex === i)
      .reduce((sum, po) => sum + po.qty, 0);
    const d = demandOn(p, i, rand);
    onHand = onHand + arrivals - d;
    if (i <= TODAY_INDEX) onHand = Math.max(0, onHand);
    level.push(onHand);
    demand.push(d);
    inTransit.push(
      p.inbound.filter((po) => po.arrivalIndex > i).reduce((sum, po) => sum + po.qty, 0),
    );
  }
  const sigma1 = p.baseDemand * 0.42 + 4;
  return { level, demand, inTransit, sigma1 };
}

function pathFor(p: SkuProfile): Path {
  const cached = pathCache.get(p.id);
  if (cached) return cached;
  const built = buildPath(p);
  pathCache.set(p.id, built);
  return built;
}

function clampIndex(i: number) {
  return Math.min(totalDays, Math.max(0, i));
}

function avgDemand(path: Path, from: number, days: number): number {
  let sum = 0;
  let n = 0;
  for (let i = from; i < Math.min(path.demand.length, from + days); i++) {
    sum += path.demand[i]!;
    n++;
  }
  return n ? sum / n : 1;
}

export function stateAt(skuId: string, date: Date): DayState {
  const p = profileById(skuId);
  const path = pathFor(p);
  const index = clampIndex(dayIndexOf(date));
  const isActual = index <= TODAY_INDEX;
  const daysAhead = Math.max(0, index - TODAY_INDEX);
  const sigma = path.sigma1 * Math.sqrt(Math.max(1, daysAhead));

  const p50 = path.level[index]!;
  const onHand = isActual ? Math.max(0, p50) : Math.max(0, p50);
  const band: [number, number] = isActual
    ? [onHand, onHand]
    : [Math.max(0, p50 - 1.2816 * sigma), p50 + 1.2816 * sigma];

  const reserved = Math.round(onHand * p.reservedShare);
  const perDay = avgDemand(path, index, 30);
  const daysOfCover = Math.round(onHand / Math.max(1, perDay));

  // Risk of running to zero within the next 30 days, read off the band.
  const horizon = clampIndex(index + 30);
  const horizonAhead = Math.max(1, horizon - TODAY_INDEX);
  const horizonSigma = path.sigma1 * Math.sqrt(horizonAhead);
  const horizonP50 = path.level[horizon]!;
  let risk = phi((0 - horizonP50) / Math.max(1, horizonSigma));
  risk = Math.min(0.99, Math.max(0.01, risk));

  let state: RiskState;
  if (p.withheld) state = "withheld";
  else if (daysOfCover > 180) state = "excess";
  else if (risk >= 0.65) state = "critical";
  else if (risk >= 0.35) state = "watch";
  else state = "on-plan";

  return {
    index,
    date: dateAtIndex(index),
    onHand: Math.round(onHand),
    reserved,
    availableToPromise: Math.round(onHand) - reserved,
    inTransit: Math.round(path.inTransit[index]!),
    daysOfCover,
    stockoutRisk: p.withheld ? null : risk,
    state,
    isActual,
    p50: Math.round(p50),
    band: [Math.round(band[0]), Math.round(band[1])],
    dailyDemand: perDay,
  };
}

export type SeriesPoint = {
  t: number;
  label: string;
  history: number | null;
  p50: number | null;
  band: [number, number] | null;
};

export function seriesFor(skuId: string): SeriesPoint[] {
  const p = profileById(skuId);
  const path = pathFor(p);
  const points: SeriesPoint[] = [];
  for (let i = 0; i <= totalDays; i += 2) {
    const date = dateAtIndex(i);
    const level = path.level[i]!;
    const ahead = Math.max(0, i - TODAY_INDEX);
    const sigma = path.sigma1 * Math.sqrt(Math.max(1, ahead));
    points.push({
      t: date.getTime(),
      label: formatShortDate(date),
      history: i <= TODAY_INDEX ? Math.round(Math.max(0, level)) : null,
      p50: i >= TODAY_INDEX ? Math.round(level) : null,
      band:
        i >= TODAY_INDEX
          ? [Math.round(level - 1.2816 * sigma), Math.round(level + 1.2816 * sigma)]
          : null,
    });
  }
  return points;
}

export function stockoutIndexFor(skuId: string): number | null {
  const path = pathFor(profileById(skuId));
  for (let i = TODAY_INDEX; i <= totalDays; i++) {
    if (path.level[i]! <= 0) return i;
  }
  return null;
}

export function stockoutDateFor(skuId: string): Date | null {
  const i = stockoutIndexFor(skuId);
  return i === null ? null : dateAtIndex(i);
}

export const REORDER_POINT = 120;

/* ------------------------------------------------------------- profiles */

function po(reference: string, qty: number, month: number, day: number, spread: number): PurchaseOrder {
  return {
    reference,
    qty,
    arrivalIndex: dayIndexOf(new Date(Date.UTC(2026, month, day))),
    leadSpreadDays: spread,
  };
}

export const skuProfiles: SkuProfile[] = [
  {
    id: "sku-4420",
    sku: "SKU-4420",
    item: "55-inch QLED panel",
    site: "DC-East",
    opening: 3400,
    baseDemand: 46,
    promoSensitive: true,
    seasonalAmp: 0.18,
    reorderPoint: 620,
    safetyStock: 380,
    reservedShare: 0.22,
    trust: 0.91,
    inbound: [po("PO-8841", 900, 3, 12, 6), po("PO-8902", 640, 5, 2, 9)],
  },
  {
    id: "sku-3311",
    sku: "SKU-3311",
    item: "65-inch OLED panel",
    site: "DC-South",
    opening: 2600,
    baseDemand: 38,
    promoSensitive: true,
    seasonalAmp: 0.2,
    reorderPoint: 540,
    safetyStock: 320,
    reservedShare: 0.24,
    trust: 0.84,
    inbound: [po("PO-8720", 700, 3, 28, 8), po("PO-8955", 480, 6, 6, 11)],
  },
  {
    id: "sku-2208",
    sku: "SKU-2208",
    item: "Soundbar, 3.1 channel",
    site: "DC-West",
    opening: 2900,
    baseDemand: 27,
    promoSensitive: false,
    seasonalAmp: 0.12,
    reorderPoint: 400,
    safetyStock: 240,
    reservedShare: 0.18,
    trust: 0.93,
    inbound: [po("PO-8611", 620, 4, 18, 5), po("PO-9011", 540, 8, 9, 7)],
  },
  {
    id: "sku-6015",
    sku: "SKU-6015",
    item: "Wall mount bracket, large",
    site: "DC-East",
    opening: 3100,
    baseDemand: 31,
    promoSensitive: true,
    seasonalAmp: 0.1,
    reorderPoint: 380,
    safetyStock: 200,
    reservedShare: 0.15,
    trust: 0.88,
    inbound: [po("PO-8702", 480, 5, 20, 4)],
  },
  {
    id: "sku-1102",
    sku: "SKU-1102",
    item: "Remote control, voice",
    site: "DC-West",
    opening: 5200,
    baseDemand: 24,
    promoSensitive: false,
    seasonalAmp: 0.08,
    reorderPoint: 300,
    safetyStock: 180,
    reservedShare: 0.12,
    trust: 0.95,
    inbound: [po("PO-8508", 900, 6, 14, 4), po("PO-9120", 700, 9, 1, 6)],
  },
  {
    id: "sku-5540",
    sku: "SKU-5540",
    item: "Power supply module",
    site: "DC-South",
    opening: 4800,
    baseDemand: 21,
    promoSensitive: false,
    seasonalAmp: 0.09,
    reorderPoint: 280,
    safetyStock: 160,
    reservedShare: 0.14,
    trust: 0.92,
    inbound: [po("PO-8577", 800, 6, 24, 5), po("PO-9142", 600, 9, 12, 8)],
  },
  {
    id: "sku-8890",
    sku: "SKU-8890",
    item: "43-inch LED panel",
    site: "DC-West",
    opening: 7400,
    baseDemand: 12,
    promoSensitive: false,
    seasonalAmp: 0.06,
    reorderPoint: 260,
    safetyStock: 150,
    reservedShare: 0.1,
    trust: 0.9,
    inbound: [po("PO-8460", 900, 4, 6, 5)],
  },
  {
    id: "sku-7104",
    sku: "SKU-7104",
    item: "Portable projector, new line",
    site: "DC-East",
    opening: 240,
    baseDemand: 3.2,
    promoSensitive: false,
    seasonalAmp: 0.05,
    reorderPoint: 90,
    safetyStock: 60,
    reservedShare: 0.14,
    trust: 0.41,
    inbound: [po("PO-9101", 120, 6, 22, 12)],
    withheld: true,
  },
  {
    id: "sku-4488",
    sku: "SKU-4488",
    item: "75-inch QLED panel",
    site: "DC-North",
    opening: 1900,
    baseDemand: 22,
    promoSensitive: true,
    seasonalAmp: 0.19,
    reorderPoint: 340,
    safetyStock: 210,
    reservedShare: 0.26,
    trust: 0.87,
    inbound: [po("PO-8814", 420, 5, 11, 9)],
  },
  {
    id: "sku-2260",
    sku: "SKU-2260",
    item: "Soundbar, 5.1 channel",
    site: "DC-North",
    opening: 2100,
    baseDemand: 19,
    promoSensitive: true,
    seasonalAmp: 0.14,
    reorderPoint: 320,
    safetyStock: 190,
    reservedShare: 0.19,
    trust: 0.9,
    inbound: [po("PO-8933", 500, 7, 3, 6)],
  },
  {
    id: "sku-6042",
    sku: "SKU-6042",
    item: "Wall mount bracket, tilt",
    site: "DC-South",
    opening: 2400,
    baseDemand: 17,
    promoSensitive: true,
    seasonalAmp: 0.1,
    reorderPoint: 260,
    safetyStock: 150,
    reservedShare: 0.13,
    trust: 0.89,
    inbound: [po("PO-8688", 380, 6, 29, 5)],
  },
  {
    id: "sku-1140",
    sku: "SKU-1140",
    item: "Remote control, standard",
    site: "DC-North",
    opening: 6100,
    baseDemand: 16,
    promoSensitive: false,
    seasonalAmp: 0.07,
    reorderPoint: 240,
    safetyStock: 140,
    reservedShare: 0.11,
    trust: 0.94,
    inbound: [po("PO-8790", 700, 8, 20, 4)],
  },
  {
    id: "sku-5588",
    sku: "SKU-5588",
    item: "Power module, wide input",
    site: "DC-East",
    opening: 2050,
    baseDemand: 18,
    promoSensitive: false,
    seasonalAmp: 0.11,
    reorderPoint: 300,
    safetyStock: 170,
    reservedShare: 0.16,
    trust: 0.86,
    inbound: [po("PO-8866", 360, 7, 17, 7)],
  },
  {
    id: "sku-7220",
    sku: "SKU-7220",
    item: "Short throw projector",
    site: "DC-West",
    opening: 1500,
    baseDemand: 9,
    promoSensitive: false,
    seasonalAmp: 0.13,
    reorderPoint: 180,
    safetyStock: 110,
    reservedShare: 0.17,
    trust: 0.83,
    inbound: [po("PO-9077", 260, 8, 28, 9)],
  },
];

const profileMap = new Map(skuProfiles.map((p) => [p.id, p]));

export function profileById(id: string): SkuProfile {
  const p = profileMap.get(id);
  if (!p) throw new Error(`Unknown SKU ${id}`);
  return p;
}

/* --------------------------------------------------------------- states */

export type RiskState = "critical" | "watch" | "on-plan" | "excess" | "withheld";

export const stateLabels: Record<RiskState, string> = {
  critical: "Critical",
  watch: "Watch",
  "on-plan": "On plan",
  excess: "Excess",
  withheld: "No forecast",
};

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
  site: Site;
  risk: number | null;
  daysOfCover: number;
  trust: number;
  action: string;
  state: RiskState;
  position: DayState;
  trace: Trace;
};

function ledgerFor(p: SkuProfile, date: Date): LedgerEvent[] {
  const path = pathFor(p);
  const index = clampIndex(dayIndexOf(date));
  const rand = lcg(hashSeed(p.sku + "ledger"));
  const events: LedgerEvent[] = [];
  for (let k = 6; k >= 1; k--) {
    const i = clampIndex(index - k);
    const d = formatShortDate(dateAtIndex(i)) + " 2026";
    const demand = Math.round(path.demand[i]!);
    const roll = rand();
    if (roll < 0.18) {
      events.push({
        date: d,
        type: "RECEIPT",
        source: "WMS",
        reference: `PO-${8000 + Math.floor(rand() * 900)}`,
        qty: Math.round(demand * 6),
      });
    } else if (roll < 0.3) {
      events.push({
        date: d,
        type: "CYCLE_COUNT",
        source: "WMS",
        reference: `CC-${3200 + Math.floor(rand() * 200)}`,
        qty: -Math.max(1, Math.round(demand * 0.06)),
      });
    } else if (roll < 0.4) {
      events.push({
        date: d,
        type: "RETURN",
        source: "OMS",
        reference: `RMA-${1100 + Math.floor(rand() * 90)}`,
        qty: Math.max(1, Math.round(demand * 0.08)),
      });
    } else if (roll < 0.52) {
      events.push({
        date: d,
        type: "TRANSFER_OUT",
        source: "WMS",
        reference: `TR-${2200 + Math.floor(rand() * 90)}`,
        qty: -Math.round(demand * 1.4),
      });
    } else {
      events.push({
        date: d,
        type: "SALE",
        source: "OMS",
        reference: `SO-${41000 + Math.floor(rand() * 1500)}`,
        qty: -demand,
      });
    }
  }
  return events;
}

const storyReads: Record<string, string> = {
  "sku-4420":
    "This item carries the heaviest promotion exposure of the panel range. A transfer from DC-West covers the gap ahead of the projected stockout and costs less than air freight on the same volume.",
  "sku-3311":
    "Supplier lead time is 18 days at p50, so an order raised in the same week as the reorder breach still lands before cover reaches zero.",
  "sku-7104":
    "There are three weeks of sales history for this line and no comparable item to borrow a demand shape from. The position above is measured, not predicted.",
};

function traceFor(p: SkuProfile, s: DayState): Trace {
  const stockout = stockoutDateFor(p.id);
  const base: Trace = {
    ledger: ledgerFor(p, s.date),
    reconciliation: [
      { label: "Last count", value: `${formatShortDate(dateAtIndex(clampIndex(s.index - 4)))} 2026, cycle count` },
      { label: "Variance", value: `−${Math.max(1, Math.round(s.onHand * 0.004))} units` },
      { label: "Open exceptions", value: p.trust < 0.9 ? "1" : "0" },
      { label: "Feed freshness", value: "WMS 12 min · OMS 8 min · TMS 19 h" },
      { label: "Data trust score", value: p.trust.toFixed(2) },
    ],
    position: [
      { label: "On hand", value: formatNumber(s.onHand) },
      { label: "Reserved", value: `−${formatNumber(s.reserved)}` },
      { label: "Available to promise", value: formatNumber(s.availableToPromise) },
      { label: "In transit", value: `+${formatNumber(s.inTransit)}` },
    ],
    forecast: [
      { label: "Model", value: "gradient-boosted demand, v4.2.1" },
      {
        label: "Demand p10 / p50 / p90",
        value: `${Math.round(s.dailyDemand * 0.7)} / ${Math.round(s.dailyDemand)} / ${Math.round(
          s.dailyDemand * 1.4,
        )} units per day`,
      },
      { label: "Top driver", value: p.promoSensitive ? "Retail promotion window, weeks 33–35" : "Steady base demand" },
      { label: "Lead time p50 / p90", value: `${p.inbound[0]?.leadSpreadDays ?? 6} day spread on inbound` },
    ],
    simulation: [
      {
        label: "Paths ending in stockout",
        value: `${formatNumber((s.stockoutRisk ?? 0) * 5000)} of 5,000`,
      },
      { label: "Probability", value: `${Math.round((s.stockoutRisk ?? 0) * 100)}%` },
      {
        label: "Median stockout date",
        value: stockout ? formatLongDate(stockout) : "Beyond the planning horizon",
      },
      { label: "Expected units short", value: formatNumber(Math.max(0, -s.p50)) },
    ],
    validation: [
      { label: "Backtest WAPE", value: `${(14.2 + (1 - p.trust) * 12).toFixed(1)}%` },
      { label: "Improvement over baseline", value: "31%" },
      { label: "Interval coverage", value: "p10–p90 captured 88% of actuals" },
      { label: "Publish gate", value: "PASSED" },
    ],
    read:
      storyReads[p.id] ??
      `Cover sits at ${s.daysOfCover} days at the selected date, with ${formatNumber(
        s.inTransit,
      )} units inbound. The position is computed from the settled ledger and the seeded demand model.`,
  };

  if (p.withheld) {
    return {
      ledger: base.ledger,
      reconciliation: base.reconciliation,
      position: base.position,
      read: storyReads["sku-7104"]!,
      withheldNote:
        "The engine will not publish a number it cannot defend. This line has three weeks of history, below the nine weeks the validation gate requires, so no forecast, simulation or backtest is produced. Roughly six more weeks of sales will clear the gate.",
    };
  }
  return base;
}

function recommendedAction(p: SkuProfile, s: DayState, allStates: { p: SkuProfile; s: DayState }[]): string {
  if (p.withheld) return "Needs ~6 more weeks of history";
  if (s.daysOfCover > 180) {
    const short = allStates.find((o) => o.s.daysOfCover < 30 && o.p.id !== p.id);
    return short
      ? `Rebalance ${formatNumber(Math.round(s.onHand * 0.08))} units to ${short.p.site}`
      : `Rebalance ${formatNumber(Math.round(s.onHand * 0.08))} units across sites`;
  }
  if (s.onHand < p.reorderPoint) {
    const surplus = allStates.find((o) => o.p.id !== p.id && o.s.daysOfCover > 180);
    if (surplus) {
      return `Transfer ${formatNumber(Math.max(60, Math.round(p.reorderPoint * 0.9)))} units from ${surplus.p.site}`;
    }
    return `Raise purchase order, ${formatNumber(Math.max(120, Math.round(p.reorderPoint * 1.8)))} units`;
  }
  return "No action";
}

const stateRank: Record<RiskState, number> = {
  critical: 0,
  watch: 1,
  "on-plan": 2,
  excess: 3,
  withheld: 4,
};

export function rowsAt(date: Date): RiskRow[] {
  const states = skuProfiles.map((p) => ({ p, s: stateAt(p.id, date) }));
  const rows = states.map(({ p, s }) => ({
    id: p.id,
    item: p.item,
    sku: p.sku,
    site: p.site,
    risk: s.stockoutRisk === null ? null : Math.round(s.stockoutRisk * 100),
    daysOfCover: s.daysOfCover,
    trust: p.trust,
    action: recommendedAction(p, s, states),
    state: s.state,
    position: s,
    trace: traceFor(p, s),
  }));
  rows.sort((a, b) => {
    const r = stateRank[a.state] - stateRank[b.state];
    if (r !== 0) return r;
    return (b.risk ?? -1) - (a.risk ?? -1);
  });
  return rows;
}

/* ------------------------------------------------------------------ kpis */

export type Kpi = {
  eyebrow: string;
  value: string;
  unit?: string;
  note: string;
  rangeValue?: string;
  tone?: "brand" | "risk" | "muted";
};

export function kpisAt(date: Date, rows: RiskRow[]): Kpi[] {
  const isFuture = dayIndexOf(date) > TODAY_INDEX;
  const isPast = dayIndexOf(date) < TODAY_INDEX;
  const atp = rows.reduce((sum, r) => sum + r.position.availableToPromise, 0);
  const low = rows.reduce((sum, r) => sum + Math.max(0, r.position.band[0] - r.position.reserved), 0);
  const high = rows.reduce((sum, r) => sum + Math.max(0, r.position.band[1] - r.position.reserved), 0);
  const atRisk = rows.filter((r) => (r.risk ?? 0) > 35).length;
  const avgTrust = rows.reduce((sum, r) => sum + r.trust, 0) / Math.max(1, rows.length);
  const settledNote = "Settled — traces to source events";
  const withheldCount = rows.filter((r) => r.state === "withheld").length;

  return [
    {
      eyebrow: "AVAILABLE TO PROMISE",
      value: formatNumber(atp),
      unit: "units",
      note: isPast ? settledNote : `Across ${new Set(rows.map((r) => r.site)).size} sites`,
      rangeValue: isFuture ? `${formatNumber(low)} – ${formatNumber(high)}` : undefined,
    },
    {
      eyebrow: "SKUS AT RISK",
      value: String(atRisk),
      note: isPast ? settledNote : `Risk above 35% at the selected date`,
      tone: atRisk > 0 ? "risk" : undefined,
    },
    {
      eyebrow: "DATA TRUST",
      value: avgTrust.toFixed(2),
      note: isPast ? settledNote : `${rows.filter((r) => r.trust < 0.9).length} exceptions open`,
    },
    {
      eyebrow: "FORECAST ERROR",
      value: `${(14.2 + (0.91 - avgTrust) * 10).toFixed(1)}%`,
      unit: "WAPE",
      note: isPast ? settledNote : "31% better than naive baseline",
    },
    {
      eyebrow: "NOT FORECAST",
      value: String(withheldCount),
      note: isPast ? settledNote : "Engine withheld — insufficient data",
      tone: "muted",
    },
  ];
}

/* --------------------------------------------------------------- ai read */

export function aiReadAt(date: Date, rows: RiskRow[]): string {
  const idx = dayIndexOf(date);
  const isPast = idx < TODAY_INDEX - 1;
  const isFuture = idx > TODAY_INDEX + 1;
  const ranked = rows.filter((r) => r.state !== "withheld");
  const first = ranked[0];
  const second = ranked[1];
  if (!first || !second) return "No items are currently in scope for this view.";

  const when = formatLongDate(date);
  const so = stockoutDateFor(first.id);
  const verb = isPast ? "held" : isFuture ? "is projected to hold" : "holds";
  const runs = isPast ? "ran" : "runs";

  const lead = isPast
    ? `On ${when}, ${first.item} at ${first.site} ${verb} ${formatNumber(first.position.availableToPromise)} units available to promise, about ${first.daysOfCover} days of cover.`
    : `${first.item} at ${first.site} ${verb} ${formatNumber(first.position.availableToPromise)} units available to promise on ${when}, about ${first.daysOfCover} days of cover.`;

  const risk =
    first.risk === null
      ? ""
      : ` Stockout risk over the next thirty days reads ${first.risk}%${
          so ? `, with the p50 path ${runs} to zero around ${formatLongDate(so)}` : ""
        }.`;

  const secondLine = ` The second concern is ${second.item} at ${second.site}: ${second.daysOfCover} days of cover, ${
    second.risk === null ? "no published risk" : `${second.risk}% risk`
  }, recommended action ${second.action.toLowerCase()}.`;

  return lead + risk + secondLine;
}

export const aiRead = {
  footer: "WRITTEN FROM COMPUTED FIGURES · EVERY NUMBER TRACEABLE",
};

/* ------------------------------------------------------------ exceptions */

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
