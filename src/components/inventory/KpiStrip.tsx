import { kpis } from "@/data/data";

export function KpiStrip({ futureMode }: { futureMode: boolean }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const showRange = futureMode && kpi.rangeValue;
        const color = showRange
          ? "var(--color-brand)"
          : kpi.tone === "risk"
            ? "var(--color-risk)"
            : kpi.tone === "muted"
              ? "var(--color-mute)"
              : "var(--color-ink)";
        return (
          <article key={kpi.eyebrow} className="ii-card px-5 py-5">
            <p className="ii-eyebrow">{kpi.eyebrow}</p>
            <p
              className="mt-3 font-display font-extrabold tracking-tight"
              style={{ color, fontSize: showRange ? 22 : 30, lineHeight: 1.15 }}
            >
              {showRange ? kpi.rangeValue : kpi.value}
              {!showRange && kpi.unit ? (
                <span className="ml-1.5 font-sans text-xs font-medium text-mute">{kpi.unit}</span>
              ) : null}
              {showRange ? <span className="ml-1.5 font-sans text-xs font-medium text-brand">range</span> : null}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-mute">
              {showRange ? "Range shown, not a point estimate" : kpi.note}
            </p>
          </article>
        );
      })}
    </section>
  );
}
