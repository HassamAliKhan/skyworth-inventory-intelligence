import * as Slider from "@radix-ui/react-slider";
import { TODAY_PCT, dateAtPct, formatLongDate } from "@/data/data";

export function TimeScrubber({ pct, onChange }: { pct: number; onChange: (p: number) => void }) {
  const isFuture = pct > TODAY_PCT + 0.5;
  const isPast = pct < TODAY_PCT - 0.5;
  const stateLabel = isFuture ? "Projected state" : isPast ? "Historical state" : "Current state";
  const date = dateAtPct(pct);

  return (
    <section className="ii-card px-5 py-6 sm:px-8 sm:py-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="ii-eyebrow">Time position</p>
          <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {formatLongDate(date)}
          </p>
        </div>
        <p
          className="font-mono text-[10px] uppercase tracking-[0.12em]"
          style={{ color: isFuture ? "var(--color-brand)" : "var(--color-body)" }}
        >
          {stateLabel}
        </p>
      </div>

      <div className="mt-7">
        <Slider.Root
          className="relative flex h-8 w-full touch-none select-none items-center"
          value={[pct]}
          min={0}
          max={100}
          step={0.5}
          aria-label="Date shown"
          onValueChange={([v]) => onChange(v)}
        >
          <Slider.Track className="relative h-8 w-full grow">
            <span
              className="absolute top-1/2 h-px -translate-y-1/2"
              style={{ left: 0, width: `${TODAY_PCT}%`, backgroundColor: "var(--color-ink)", height: 2 }}
            />
            <span
              className="absolute top-1/2 -translate-y-1/2 border-t-2 border-dashed"
              style={{
                left: `${TODAY_PCT}%`,
                right: 0,
                borderColor: "var(--color-brand)",
              }}
            />
            <span
              className="absolute top-1/2 h-3 w-px -translate-y-1/2"
              style={{ left: `${TODAY_PCT}%`, backgroundColor: "var(--color-ink)" }}
            />
            <span
              className="absolute font-mono text-[10px] uppercase tracking-[0.12em] text-ink"
              style={{ left: `${TODAY_PCT}%`, top: -22, transform: "translateX(-50%)" }}
            >
              Today
            </span>
          </Slider.Track>
          <Slider.Thumb
            className="block h-5 w-5 rounded-full bg-surface transition-shadow"
            style={{
              border: `3px solid ${isFuture ? "var(--color-brand)" : "var(--color-ink)"}`,
              boxShadow: `0 0 0 8px ${isFuture ? "rgba(26,86,219,0.12)" : "rgba(15,20,25,0.08)"}`,
            }}
          />
        </Slider.Root>

        <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          <span>Feb 2026</span>
          <span className="hidden sm:inline">Settled history</span>
          <span className="hidden sm:inline" style={{ color: "var(--color-brand)" }}>
            Simulated future
          </span>
          <span>Nov 2026</span>
        </div>
      </div>
    </section>
  );
}
