import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/inventory/Header";
import { TimeScrubber } from "@/components/inventory/TimeScrubber";
import { KpiStrip } from "@/components/inventory/KpiStrip";
import { ProjectionChart } from "@/components/inventory/ProjectionChart";
import { AiReadPanel, DataTrustPanel } from "@/components/inventory/SidePanels";
import { RiskRegister } from "@/components/inventory/RiskRegister";
import { TraceDrawer } from "@/components/inventory/TraceDrawer";
import { TODAY_PCT, riskRows, type RiskRow, type Warehouse } from "@/data/data";

const title = "Inventory Intelligence — Skyworth supply engine";
const description =
  "An executive view of inventory position, forecast confidence and stockout risk, with every number traceable to the ledger.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [pct, setPct] = useState(TODAY_PCT);
  const [warehouse, setWarehouse] = useState<Warehouse>("All warehouses");
  const [selected, setSelected] = useState<RiskRow | null>(null);

  const futureMode = pct > TODAY_PCT + 0.5;
  const rows = useMemo(
    () => (warehouse === "All warehouses" ? riskRows : riskRows.filter((r) => r.site === warehouse)),
    [warehouse],
  );

  return (
    <div className="ii-page min-h-screen">
      <Header warehouse={warehouse} onWarehouseChange={setWarehouse} />

      <main className="mx-auto max-w-[1400px] space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        <h1 className="sr-only">Inventory Intelligence</h1>

        <TimeScrubber pct={pct} onChange={setPct} />
        <KpiStrip futureMode={futureMode} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <ProjectionChart pct={pct} />
          <div className="space-y-5">
            <AiReadPanel />
            <DataTrustPanel />
          </div>
        </div>

        <RiskRegister rows={rows} onSelect={setSelected} />
      </main>

      <TraceDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
