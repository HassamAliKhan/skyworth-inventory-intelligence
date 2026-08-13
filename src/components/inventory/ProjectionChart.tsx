import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  REORDER_POINT,
  TODAY,
  dateAtPct,
  formatShortDate,
  projectionSeries,
  stockoutPoint,
} from "@/data/data";

export function ProjectionChart({ pct }: { pct: number }) {
  const scrubT = dateAtPct(pct).getTime();

  return (
    <section className="ii-card flex flex-col px-5 py-6 sm:px-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="ii-eyebrow">Projected cover · SKU-4420 · DC-East</p>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">Runs out around 18 August</h2>
        </div>
        <div className="hidden gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-mute sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-ink" /> Settled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: "var(--color-brand)" }} />
            p50
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: "var(--color-brandsoft)" }} /> p10–p90
          </span>
        </div>
      </div>

      <div className="mt-6 h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={projectionSeries} margin={{ top: 12, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t) => formatShortDate(new Date(t))}
              tick={{ fontSize: 11, fill: "var(--color-mute)" }}
              axisLine={{ stroke: "var(--color-hairline)" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-mute)" }}
              axisLine={false}
              tickLine={false}
              width={56}
              domain={[-300, 1600]}
              ticks={[-300, 0, 400, 800, 1200, 1600]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: "1px solid var(--color-hairline)",
                boxShadow: "var(--shadow-card)",
                fontSize: 12,
              }}
              labelFormatter={(t) => formatShortDate(new Date(Number(t)))}
              formatter={(value: unknown, name: string) => {
                if (Array.isArray(value)) return [`${value[0]} – ${value[1]} units`, "p10–p90"];
                return [`${value} units`, name === "history" ? "Settled" : "p50 forecast"];
              }}
            />

            <Area
              dataKey="band"
              stroke="none"
              fill="var(--color-brand)"
              fillOpacity={0.12}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              dataKey="history"
              stroke="var(--color-ink)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="p50"
              stroke="var(--color-brand)"
              strokeWidth={2}
              strokeDasharray="6 5"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />

            <ReferenceLine y={0} stroke="var(--color-risk)" strokeDasharray="4 4" />
            <ReferenceLine
              y={REORDER_POINT}
              stroke="var(--color-watch)"
              strokeDasharray="4 4"
              label={{
                value: "Reorder point",
                position: "insideTopLeft",
                fill: "var(--color-watch)",
                fontSize: 10,
              }}
            />
            <ReferenceLine
              x={TODAY.getTime()}
              stroke="var(--color-ink)"
              label={{ value: "Today", position: "top", fill: "var(--color-ink)", fontSize: 10 }}
            />
            <ReferenceLine x={scrubT} stroke="var(--color-brand)" strokeWidth={1} strokeOpacity={0.5} />
            <ReferenceDot
              x={stockoutPoint.t}
              y={stockoutPoint.y}
              r={5}
              fill="var(--color-risk)"
              stroke="var(--color-surface)"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
