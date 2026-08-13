import { stateLabels, type RiskRow, type RiskState } from "@/data/data";

export const stateColor: Record<RiskState, string> = {
  critical: "var(--color-risk)",
  watch: "var(--color-watch)",
  "on-plan": "var(--color-onplan)",
  excess: "var(--color-excess)",
  withheld: "var(--color-faint)",
};

export function StatePill({ state }: { state: RiskState }) {
  const color = stateColor[state];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em]"
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 12%, white)` }}
    >
      {stateLabels[state]}
    </span>
  );
}

export function RiskRegister({ rows, onSelect }: { rows: RiskRow[]; onSelect: (row: RiskRow) => void }) {
  return (
    <section className="ii-card overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 px-5 py-5 sm:px-7">
        <div className="min-w-0">
          <p className="ii-eyebrow">Risk register</p>
          <h2 className="mt-1.5 text-lg font-bold tracking-tight">Items ranked by stockout risk</h2>
        </div>
        <p className="text-xs text-mute">Select a row to trace it</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-y border-hairline bg-canvas">
              {["Item", "Site", "Stockout risk", "Days of cover", "Trust score", "Recommended action", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.12em] text-mute"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                role="button"
                onClick={() => onSelect(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(row);
                  }
                }}
                className="cursor-pointer border-b border-hairline transition-colors last:border-0 hover:bg-canvas"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-ink">{row.item}</p>
                  <p className="mt-1 font-mono text-[11px] text-mute">{row.sku}</p>
                </td>
                <td className="px-5 py-4 text-sm text-body">{row.site}</td>
                <td className="px-5 py-4">
                  {row.risk === null ? (
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">Withheld</span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-utility">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${row.risk}%`, backgroundColor: stateColor[row.state] }}
                        />
                      </span>
                      <span className="font-mono text-xs" style={{ color: stateColor[row.state] }}>
                        {row.risk}%
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-body">
                  {row.state === "withheld" ? "—" : row.daysOfCover}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-body">{row.trust.toFixed(2)}</td>
                <td className="px-5 py-4 text-sm text-body">{row.action}</td>
                <td className="px-5 py-4 text-right">
                  <StatePill state={row.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
