import { useEffect } from "react";
import type { RiskRow } from "@/data/data";
import { StatePill } from "./RiskRegister";

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline py-6 first:border-0">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-hairline font-mono text-[10px] text-mute">
          {n}
        </span>
        <span className="ii-eyebrow">{title}</span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Rows({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-hairline">
      {items.map((it) => (
        <div key={it.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2.5">
          <dt className="text-xs text-mute">{it.label}</dt>
          <dd className="text-right font-mono text-xs text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TraceDrawer({ row, onClose }: { row: RiskRow | null; onClose: () => void }) {
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;
  const t = row.trace;
  const withheld = row.state === "withheld";

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close trace"
        onClick={onClose}
        className="ii-scrim absolute inset-0 h-full w-full cursor-default"
        style={{ backgroundColor: "rgba(15,20,25,0.35)" }}
      />
      <aside
        role="dialog"
        aria-label={`Trace for ${row.sku}`}
        className="ii-drawer absolute right-0 top-0 flex h-full w-full flex-col bg-surface sm:w-[560px]"
        style={{ boxShadow: "var(--shadow-drawer)", animation: "ii-slide-in 260ms ease-out" }}
      >
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-hairline px-6 py-5">
          <div className="min-w-0">
            <p className="ii-eyebrow">Trace</p>
            <h2 className="mt-1.5 truncate text-lg font-bold tracking-tight">{row.item}</h2>
            <p className="mt-1 font-mono text-[11px] text-mute">
              {row.sku} · {row.site}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatePill state={row.state} />
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full border border-hairline text-mute transition-colors hover:text-ink"
            >
              ×
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10">
          <Step n="01" title="Ledger">
            <ul className="divide-y divide-hairline">
              {t.ledger.map((e) => (
                <li key={e.reference} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-ink">{e.type}</p>
                    <p className="mt-0.5 text-[11px] text-mute">
                      {e.date} · {e.source} · {e.reference}
                    </p>
                  </div>
                  <span
                    className="font-mono text-xs"
                    style={{ color: e.qty >= 0 ? "var(--color-onplan)" : "var(--color-risk)" }}
                  >
                    {e.qty > 0 ? "+" : ""}
                    {e.qty}
                  </span>
                </li>
              ))}
            </ul>
          </Step>

          <Step n="02" title="Reconciliation">
            <Rows items={t.reconciliation} />
          </Step>

          <Step n="03" title="Position">
            <Rows items={t.position} />
          </Step>

          {withheld ? (
            <section className="border-t border-hairline py-6">
              <div
                className="rounded-[14px] px-5 py-5"
                style={{
                  backgroundColor: "color-mix(in oklab, var(--color-watch) 10%, white)",
                  border: "1px solid color-mix(in oklab, var(--color-watch) 35%, white)",
                }}
              >
                <p className="ii-eyebrow" style={{ color: "var(--color-watch)" }}>
                  Steps 04–06 not produced
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-body">{t.withheldNote}</p>
              </div>
            </section>
          ) : (
            <>
              <Step n="04" title="Forecast">
                <Rows items={t.forecast ?? []} />
              </Step>
              <Step n="05" title="Simulation">
                <Rows items={t.simulation ?? []} />
              </Step>
              <Step n="06" title="Validation">
                <Rows items={t.validation ?? []} />
              </Step>
            </>
          )}

          <Step n="07" title="Read">
            <div
              className="rounded-[14px] px-5 py-5"
              style={{ backgroundColor: "var(--color-brandsoft)" }}
            >
              <p className="text-sm leading-relaxed text-body">{t.read}</p>
              <p className="mt-4 border-t pt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-mute"
                 style={{ borderColor: "color-mix(in oklab, var(--color-brand) 20%, white)" }}>
                Language model describes computed figures only · it never produces a quantity
              </p>
            </div>
          </Step>

          {!withheld && (
            <section className="border-t border-hairline py-6">
              <p className="ii-eyebrow">Recommended action</p>
              <p className="mt-2.5 text-sm text-ink">{row.action}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="rounded-full bg-brand px-5 py-2.5 text-xs font-medium text-white transition-colors hover:opacity-90">
                  Approve transfer
                </button>
                <button className="rounded-full border border-hairline bg-surface px-5 py-2.5 text-xs font-medium text-ink transition-colors hover:border-brand">
                  Compare with air freight
                </button>
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
