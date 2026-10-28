"use client";

import { useMemo, useState } from "react";
import { Card, Badge, SectionTitle, usd } from "@/components/ui";
import { equipment, areas, equipmentSummary } from "@/data/equipment";

export default function EquipmentPage() {
  const [area, setArea] = useState("All");
  const [makeBuy, setMakeBuy] = useState("All");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      equipment.filter((e) => {
        if (area !== "All" && e.area !== area) return false;
        if (makeBuy !== "All" && e.makeBuy !== makeBuy) return false;
        if (q) {
          const hay = `${e.tag} ${e.description} ${e.vendor} ${e.moc} ${e.type}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [area, makeBuy, q],
  );

  const value = rows.reduce((s, e) => s + e.cost_usd * e.qty, 0);
  const power = rows.reduce((s, e) => s + e.power_kW * e.qty, 0);

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Section 3" title="Equipment register">
        {equipmentSummary.count} tagged items. Duty, material and code come from the calculation sheets; the
        hazardous area and Ex rating come from drawing B047-ABG-03-PR-LAY-0001 Rev 4 Note 17. Cost is supply only,
        FOB vendor works.
      </SectionTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { k: "Tags", v: String(equipmentSummary.count) },
          { k: "Make (RAMSIS)", v: String(equipmentSummary.makeCount) },
          { k: "Buy", v: String(equipmentSummary.buyCount) },
          { k: "Supply value", v: usd(equipmentSummary.total) },
          { k: "Installed power", v: `${power.toFixed(0)} kW` },
        ].map((s) => (
          <Card key={s.k} className="px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-mist-400">{s.k}</div>
            <div className="font-mono text-[15px] text-mist-200">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded border border-ink-600 bg-ink-850 px-2 py-1 text-[11px] text-mist-200"
        >
          <option value="All">All areas</option>
          {areas.map((a) => (
            <option key={a.code} value={a.code}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
        <select
          value={makeBuy}
          onChange={(e) => setMakeBuy(e.target.value)}
          className="rounded border border-ink-600 bg-ink-850 px-2 py-1 text-[11px] text-mist-200"
        >
          <option value="All">Make and buy</option>
          <option value="MAKE">Make (RAMSIS)</option>
          <option value="BUY">Buy</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tag, service, material or vendor"
          className="min-w-[240px] flex-1 rounded border border-ink-600 bg-ink-850 px-2.5 py-1 text-[11px] text-mist-200 placeholder:text-mist-400/60"
        />
        <span className="font-mono text-[10.5px] text-mist-400">
          {rows.length} shown · {usd(value)}
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="scroll-x">
          <table className="grid-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Service</th>
                <th>Type / duty</th>
                <th className="text-right">Qty</th>
                <th>Material / code</th>
                <th>Area class</th>
                <th className="text-right">Power</th>
                <th className="text-right">Weight</th>
                <th className="text-right">Supply</th>
                <th>Make / buy</th>
                <th>Vendor</th>
                <th className="text-right">Lead</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.tag}>
                  <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{e.tag}</td>
                  <td className="min-w-[170px] text-mist-200">
                    {e.description}
                    <div className="text-[10px] text-mist-400">{e.type}</div>
                  </td>
                  <td className="min-w-[220px] text-[10.5px] text-mist-400">{e.duty}</td>
                  <td className="num">{e.qty}</td>
                  <td className="min-w-[170px] text-[10.5px] text-mist-400">
                    {e.moc}
                    <div className="text-[10px] text-mist-400/70">{e.code}</div>
                  </td>
                  <td>
                    <Badge tone={e.zone === "Zone 0" ? "rust" : e.zone === "Zone 1" ? "amber" : e.zone === "Zone 2" ? "teal" : "slate"}>
                      {e.zone}
                    </Badge>
                    <div className="mt-0.5 text-[9.5px] text-mist-400">{e.exRating}</div>
                  </td>
                  <td className="num">{e.power_kW ? `${e.power_kW} kW` : "—"}</td>
                  <td className="num">{e.weight_t ? `${e.weight_t} t` : "—"}</td>
                  <td className="num text-mist-200">{usd(e.cost_usd * e.qty)}</td>
                  <td>
                    <Badge tone={e.makeBuy === "MAKE" ? "green" : "violet"}>{e.makeBuy}</Badge>
                  </td>
                  <td className="min-w-[160px] text-[10.5px] text-mist-400">
                    {e.vendor}
                    <div className="mt-0.5">
                      <Badge tone={e.avl === "Governing" ? "amber" : e.avl === "Non-governing" ? "teal" : "slate"}>{e.avl}</Badge>
                    </div>
                  </td>
                  <td className="num">{e.leadWeeks} w</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8} className="text-right text-[11px] text-mist-400">
                  Total supply value of the filtered set
                </td>
                <td className="num font-semibold text-teal-300">{usd(value)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">Equipment by area</h3>
        <div className="mt-3 grid gap-x-6 gap-y-1 md:grid-cols-2">
          {areas.map((a) => {
            const items = equipment.filter((e) => e.area === a.code);
            const v = items.reduce((s, e) => s + e.cost_usd * e.qty, 0);
            return (
              <div key={a.code} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1.5">
                <span className="text-[11px] text-mist-300">
                  <span className="font-mono text-[10px] text-mist-400">{a.code}</span> {a.name}
                </span>
                <span className="whitespace-nowrap font-mono text-[10.5px] text-mist-400">
                  {items.length} items · {usd(v)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
