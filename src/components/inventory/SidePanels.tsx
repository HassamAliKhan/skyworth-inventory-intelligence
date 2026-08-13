import { aiRead, exceptions } from "@/data/data";

const dotColor = {
  open: "var(--color-watch)",
  resolved: "var(--color-onplan)",
  watch: "var(--color-faint)",
} as const;

export function AiReadPanel() {
  return (
    <section className="ii-card px-5 py-6 sm:px-6">
      <p className="ii-eyebrow">What the engine reads</p>
      <p className="mt-3 text-sm leading-relaxed text-body">{aiRead.paragraph}</p>
      <p className="mt-5 border-t border-hairline pt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-faint">
        {aiRead.footer}
      </p>
    </section>
  );
}

export function DataTrustPanel() {
  return (
    <section className="ii-card px-5 py-6 sm:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <p className="ii-eyebrow">Data trust</p>
        <p className="font-display text-lg font-extrabold text-ink">0.91</p>
      </div>
      <ul className="mt-4 divide-y divide-hairline">
        {exceptions.map((ex) => (
          <li key={ex.title} className="flex gap-3 py-3.5">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor[ex.status] }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{ex.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">{ex.detail}</p>
            </div>
            <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
              {ex.statusLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
