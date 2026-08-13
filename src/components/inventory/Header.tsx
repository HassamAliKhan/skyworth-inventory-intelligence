import { warehouses, type Warehouse } from "@/data/data";

export function Header({
  warehouse,
  onWarehouseChange,
}: {
  warehouse: Warehouse;
  onWarehouseChange: (w: Warehouse) => void;
}) {
  return (
    <header>
      <div className="bg-utility">
        <div className="mx-auto flex max-w-[1400px] justify-end gap-6 px-5 py-2 sm:px-8">
          {["Operations", "Planning", "Suppliers", "Support"].map((link) => (
            <a
              key={link}
              href="#"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-body transition-colors hover:text-ink"
            >
              {link}
            </a>
          ))}
        </div>
      </div>

      <div className="border-b border-hairline bg-surface">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="font-display text-lg font-extrabold tracking-tight text-brand">SKYWORTH</span>
            <span className="h-5 w-px shrink-0 bg-hairline" />
            <span className="truncate text-sm text-mute">Inventory Intelligence</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                aria-label="Warehouse"
                value={warehouse}
                onChange={(e) => onWarehouseChange(e.target.value as Warehouse)}
                className="cursor-pointer appearance-none rounded-full border border-hairline bg-surface py-2 pl-4 pr-9 text-xs text-ink transition-colors hover:border-brand"
              >
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden
                viewBox="0 0 12 12"
                className="pointer-events-none absolute right-3.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-mute"
              >
                <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </div>

            <span className="hidden items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-onplan" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-body">Engine live</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
