import { Card, Badge, SectionTitle, usd, nf, Bar, Callout } from "@/components/ui";
import { mtoRows, mtoTotals, fabrication, rateFor, materialRate } from "@/lib/calc/mto";
import { equipment } from "@/data/equipment";

export const metadata = { title: "BOM / MTO — B047 WWT" };

const maxTonnes = Math.max(...mtoRows.map((r) => r.total_t));

export default function MtoPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Section 5" title="Bill of materials and material take-off">
        Plate, sections, coating area, weld length and manhours for the make scope, derived from each item&apos;s
        geometry and wall thickness. This is the document the Bahrain workshop buys plate against — the quantities
        here are order quantities, not estimates.
      </SectionTitle>

      <section className="grid gap-3 lg:grid-cols-5">
        {[
          { k: "Plate and sections", v: `${nf(mtoTotals.total_t, 0)} t`, s: "including 8 % supports and stiffeners" },
          { k: "Fabrication hours", v: mtoTotals.manhours.toLocaleString(), s: `${nf(mtoTotals.manhours / mtoTotals.total_t, 1)} h per tonne average` },
          { k: "Welding", v: `${nf(mtoTotals.weld_m, 0)} m`, s: "butt and fillet, excluding temporary" },
          { k: "Coating", v: `${nf(mtoTotals.coating_m2, 0)} m²`, s: "blast to Sa 2.5 plus epoxy system" },
          { k: "Direct workshop cost", v: usd(fabrication.total), s: "material, labour, coating, NDT, consumables" },
        ].map((s) => (
          <Card key={s.k} className="p-3.5">
            <div className="text-[10px] uppercase tracking-wide text-mist-400">{s.k}</div>
            <div className="mt-0.5 font-mono text-[15px] text-teal-300">{s.v}</div>
            <div className="text-[10.5px] leading-snug text-mist-400">{s.s}</div>
          </Card>
        ))}
      </section>

      <section>
        <SectionTitle eyebrow="Take-off" title="Material take-off by equipment" />
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Description</th>
                  <th>Grade</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Shell</th>
                  <th className="text-right">Bottom</th>
                  <th className="text-right">Roof</th>
                  <th className="text-right">Heads</th>
                  <th className="text-right">Struct.</th>
                  <th className="text-right">Total t</th>
                  <th className="text-right">Coat m²</th>
                  <th className="text-right">Weld m</th>
                  <th className="text-right">Hours</th>
                  <th className="w-[10%]">Weight</th>
                </tr>
              </thead>
              <tbody>
                {mtoRows.map((r) => (
                  <tr key={r.tag}>
                    <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{r.tag}</td>
                    <td className="min-w-[230px] text-mist-300">{r.description}</td>
                    <td>
                      <Badge tone={r.grade.includes("316") ? "teal" : r.grade.includes("FRP") ? "violet" : "slate"}>{r.grade}</Badge>
                    </td>
                    <td className="num">{r.qty}</td>
                    <td className="num">{nf(r.shell_t, 1)}</td>
                    <td className="num">{nf(r.bottom_t, 1)}</td>
                    <td className="num">{nf(r.roof_t, 1)}</td>
                    <td className="num">{nf(r.heads_t, 1)}</td>
                    <td className="num">{nf(r.structure_t, 1)}</td>
                    <td className="num font-semibold text-mist-200">{nf(r.total_t, 1)}</td>
                    <td className="num">{nf(r.coating_m2, 0)}</td>
                    <td className="num">{nf(r.weld_m, 0)}</td>
                    <td className="num">{r.manhours.toLocaleString()}</td>
                    <td>
                      <Bar value={r.total_t} max={maxTonnes} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={9} className="text-right text-[11px] text-mist-400">
                    Total
                  </td>
                  <td className="num font-semibold text-teal-300">{nf(mtoTotals.total_t, 1)}</td>
                  <td className="num text-mist-200">{nf(mtoTotals.coating_m2, 0)}</td>
                  <td className="num text-mist-200">{nf(mtoTotals.weld_m, 0)}</td>
                  <td className="num font-semibold text-teal-300">{mtoTotals.manhours.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Plate and section purchase by grade</h3>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Grade</th>
                <th className="text-right">Tonnes</th>
                <th className="text-right">Material rate</th>
                <th className="text-right">Material value</th>
                <th className="text-right">Labour rate</th>
                <th className="text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {mtoTotals.byGrade.map((g) => (
                <tr key={g.grade}>
                  <td className="text-mist-300">{g.grade}</td>
                  <td className="num text-mist-200">{nf(g.tonnes, 1)}</td>
                  <td className="num">{usd(materialRate(g.grade))}/t</td>
                  <td className="num text-mist-200">{usd(g.tonnes * materialRate(g.grade))}</td>
                  <td className="num">${rateFor(g.grade)}/h</td>
                  <td className="num">{g.hours.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="text-[11px] text-mist-400">Total</td>
                <td className="num font-semibold text-teal-300">{nf(mtoTotals.total_t, 1)}</td>
                <td />
                <td className="num font-semibold text-teal-300">
                  {usd(mtoTotals.byGrade.reduce((a, g) => a + g.tonnes * materialRate(g.grade), 0))}
                </td>
                <td />
                <td className="num font-semibold text-teal-300">{mtoTotals.manhours.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Workshop cost build-up</h3>
          <div className="mt-3 space-y-1.5">
            {[
              { k: "Plate, sections and consumable material", v: fabrication.material },
              { k: "Fabrication labour", v: fabrication.labour },
              { k: "Coating (blast + epoxy system)", v: fabrication.coating },
              { k: "Welding consumables", v: fabrication.consumables },
              { k: "NDT — RT, UT, PT, hydrotest support", v: fabrication.ndt },
              { k: "Workshop overhead (12 %)", v: fabrication.overhead },
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5">
                <span className="text-[11px] text-mist-400">{r.k}</span>
                <span className="font-mono text-[11px] text-mist-200">{usd(r.v)}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 pt-1.5">
              <span className="text-[11.5px] font-semibold text-mist-200">Direct workshop cost</span>
              <span className="font-mono text-[13px] font-semibold text-teal-300">{usd(fabrication.total)}</span>
            </div>
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-mist-400">
            Average blended labour rate {usd(fabrication.avgRate)}/h across CS, stainless and structural work.
            Excludes engineering, freight, site erection and margin — those sit in the make supply value shown on
            the estimate page.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle eyebrow="Bought-out BOM" title="Major purchased components inside the make items" />
        <Card className="overflow-hidden">
          <table className="grid-table">
            <thead>
              <tr>
                <th>Host item</th>
                <th>Bought-in component</th>
                <th>Why it is not made</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["T-2001 equalisation tanks", "2 × submersible mixers (22 kW, Ex ia)", "Zone 0 Ex motor and gearbox"],
                ["B-3001 API separator", "2 × chain and flight scraper drives", "Proprietary mechanism with wear guarantee"],
                ["DAF-3001 flotation units", "2 × air saturation skids, recycle pumps, compressors", "White-water release nozzle is patented"],
                ["CPI-3001 interceptors", "Plate packs (46 plates per unit)", "Plate spacing and angle set the oil-removal guarantee"],
                ["V-6001 multimedia filters", "Distribution headers, nozzles, filter media", "Media gradation is a vendor performance guarantee"],
                ["V-6010 GAC adsorbers", "60 t activated carbon per vessel", "Carbon activity and phenol capacity are guaranteed"],
                ["V-1001 neutralisation", "2 × 7.5 kW agitators", "Gearbox and seal are proprietary"],
                ["SK-9001 dosing skids", "8 × Milton Roy / Sera dosing pumps", "Governing AVL item, API 675"],
                ["V-1010 odour scrubber", "Packing, mist eliminator, fan", "Packing HETP is guaranteed by the supplier"],
                ["CF-8001 centrifuges", "Complete machines", "Rotating machine — buy"],
              ].map((r) => (
                <tr key={r[1]}>
                  <td className="whitespace-nowrap text-mist-300">{r[0]}</td>
                  <td className="text-mist-300">{r[1]}</td>
                  <td className="text-[10.5px] text-mist-400">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <Callout title="Procurement note" tone="amber">
        Order plate against the {nf(mtoTotals.total_t, 0)} t take-off with a 7 % scrap allowance on 316L and 4 % on
        carbon steel. The SS 316L tonnage ({nf(mtoTotals.byGrade.find((g) => g.grade === "SS 316L")?.tonnes ?? 0, 1)} t)
        is the long-lead item — mill delivery to Bahrain typically runs 14–16 weeks against 6–8 weeks for CS.
      </Callout>

      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">Make-scope tags covered by this MTO</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {equipment
            .filter((e) => e.makeBuy === "MAKE")
            .map((e) => (
              <span key={e.tag} className="rounded border border-line bg-ink-850 px-2 py-0.5 font-mono text-[10px] text-mist-300">
                {e.tag}
              </span>
            ))}
        </div>
      </Card>
    </div>
  );
}
