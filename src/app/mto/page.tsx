import { Card, Badge, SectionTitle, usd, nf, Bar, Callout } from "@/components/ui";
import { CommercialOnly } from "@/components/view-mode";
import { mtoRows, mtoTotals, fabrication, rateFor, materialRate } from "@/lib/calc/mto";
import { equipment } from "@/data/equipment";
import { lineTakeoff, pipingSummary, valveSchedule, valveTotals, pipeBySize } from "@/lib/piping";
import { motors, motorSummary, powerSummary, trayFill, panels } from "@/lib/electrical";
import { instruments, ioSummary, instrumentsByType } from "@/lib/instruments";
import { insulationRows, insulationSummary, paintArea } from "@/lib/insulation";
import { rackParts, partCounts } from "@/lib/plantLayout";
import { bulkTotals } from "@/lib/calc/bulk";

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
        ].map((s) => (
          <Card key={s.k} className="p-3.5">
            <div className="text-[10px] uppercase tracking-wide text-mist-400">{s.k}</div>
            <div className="mt-0.5 font-mono text-[15px] text-teal-300">{s.v}</div>
            <div className="text-[10.5px] leading-snug text-mist-400">{s.s}</div>
          </Card>
        ))}
        <Card className="p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Direct workshop cost</div>
          <div className="mt-0.5 font-mono text-[15px] text-teal-300" data-commercial>
            {usd(fabrication.total)}
          </div>
          <div className="text-[10.5px] leading-snug text-mist-400">
            material, labour, coating, NDT, consumables
          </div>
        </Card>
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
                <th className="text-right" data-commercial>Material rate</th>
                <th className="text-right" data-commercial>Material value</th>
                <th className="text-right" data-commercial>Labour rate</th>
                <th className="text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {mtoTotals.byGrade.map((g) => (
                <tr key={g.grade}>
                  <td className="text-mist-300">{g.grade}</td>
                  <td className="num text-mist-200">{nf(g.tonnes, 1)}</td>
                  <td className="num" data-commercial>{usd(materialRate(g.grade))}/t</td>
                  <td className="num text-mist-200" data-commercial>{usd(g.tonnes * materialRate(g.grade))}</td>
                  <td className="num" data-commercial>${rateFor(g.grade)}/h</td>
                  <td className="num">{g.hours.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="text-[11px] text-mist-400">Total</td>
                <td className="num font-semibold text-teal-300">{nf(mtoTotals.total_t, 1)}</td>
                <td data-commercial />
                <td className="num font-semibold text-teal-300" data-commercial>
                  {usd(mtoTotals.byGrade.reduce((a, g) => a + g.tonnes * materialRate(g.grade), 0))}
                </td>
                <td />
                <td className="num font-semibold text-teal-300">{mtoTotals.manhours.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <CommercialOnly note="The workshop cost build-up — material, labour, coating, NDT and overhead — is commercial and is shown in the internal view.">
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
        </CommercialOnly>
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

      {/* ---------------------------------------------------------- */}
      {/* Bulk disciplines                                            */}
      {/* ---------------------------------------------------------- */}
      <section>
        <SectionTitle eyebrow="Bulk MTO" title="Piping, valves, instruments, electrical, insulation and racks">
          Everything that is not a single fabricated item. Quantities come from the line list, the instrument
          index, the motor schedule and the insulation and coating schedules, so each figure can be traced to the
          document that requires it and to the model that draws it.
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { k: "Bulk pipe", v: `${nf(pipingSummary.pipe_t, 1)} t`, s: `${pipingSummary.lines} lines · ${nf(pipingSummary.length_m, 0)} m` },
            { k: "Valves", v: `${pipingSummary.valves}`, s: `${valveTotals.actuated} actuated · ${valveTotals.control} control · ${valveTotals.psv} PSV` },
            { k: "Fittings & flanges", v: `${nf(pipingSummary.fittings_t, 1)} t / ${pipingSummary.flanges}`, s: `${pipingSummary.gaskets} gaskets · ${pipingSummary.bolts} bolts` },
            { k: "Instruments", v: `${ioSummary.wiredQty}`, s: `${ioSummary.total} I/O · ${ioSummary.sil2} SIL 2 · ${ioSummary.localQty} local gauges` },
            { k: "Motors & cable", v: `${motorSummary.count} / ${nf(motorSummary.cable_m, 0)} m`, s: `${nf(motorSummary.installed_kW, 0)} kW installed · ${trayFill.fill_pct} % tray fill` },
            { k: "Rack steel", v: `${nf(partCounts.rackLength_m, 0)} m`, s: `${partCounts.racks} racks · ${partCounts.insulation} insulated surfaces` },
          ].map((s) => (
            <Card key={s.k} className="p-3">
              <div className="text-[10px] uppercase tracking-wide text-mist-400">{s.k}</div>
              <div className="mt-0.5 font-mono text-[14px] text-teal-300">{s.v}</div>
              <div className="text-[10px] leading-snug text-mist-400">{s.s}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Piping" title="Line-by-line material take-off" />
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Service</th>
                  <th>Class</th>
                  <th className="text-right">Size</th>
                  <th className="text-right">Length m</th>
                  <th className="text-right">kg/m</th>
                  <th className="text-right">Pipe t</th>
                  <th className="text-right">Fittings t</th>
                  <th className="text-right">Flanges</th>
                  <th className="text-right">Valves</th>
                  <th className="text-right">Supports</th>
                  <th className="text-right">Insul. m²</th>
                  <th className="text-right">Paint m²</th>
                </tr>
              </thead>
              <tbody>
                {lineTakeoff.map((r) => (
                  <tr key={r.lineNo}>
                    <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{r.lineNo}</td>
                    <td className="min-w-[180px] text-mist-300">{r.service}</td>
                    <td>
                      <Badge tone="slate">{r.pipeClass}</Badge>
                    </td>
                    <td className="num">{r.nps}&quot;</td>
                    <td className="num">{nf(r.length_m, 0)}</td>
                    <td className="num">{nf(r.kg_per_m, 1)}</td>
                    <td className="num font-semibold text-mist-200">{nf(r.pipe_t, 2)}</td>
                    <td className="num">{nf(r.fittings_t, 2)}</td>
                    <td className="num">{r.flanges}</td>
                    <td className="num">{r.valves}</td>
                    <td className="num">{r.supports}</td>
                    <td className="num">{nf(r.insul_m2, 1)}</td>
                    <td className="num">{nf(r.paint_m2, 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right text-[11px] text-mist-400">
                    Total
                  </td>
                  <td />
                  <td className="num text-mist-200">{nf(pipingSummary.length_m, 0)}</td>
                  <td />
                  <td className="num font-semibold text-teal-300">{nf(pipingSummary.pipe_t, 2)}</td>
                  <td className="num text-mist-200">{nf(pipingSummary.fittings_t, 2)}</td>
                  <td className="num text-mist-200">{pipingSummary.flanges}</td>
                  <td className="num text-mist-200">{pipingSummary.valves}</td>
                  <td className="num text-mist-200">{pipingSummary.supports}</td>
                  <td className="num text-mist-200">{nf(pipingSummary.insulation_m2, 0)}</td>
                  <td className="num text-mist-200">{nf(pipingSummary.paint_m2, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Valve schedule</h3>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Type</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Actuated</th>
                <th className="text-right">Manual</th>
                <th>Sizes</th>
                <th>Classes</th>
              </tr>
            </thead>
            <tbody>
              {valveSchedule.map((v) => (
                <tr key={v.type}>
                  <td className="capitalize text-mist-300">{v.type}</td>
                  <td className="num font-semibold text-mist-200">{v.qty}</td>
                  <td className="num">{v.actuated}</td>
                  <td className="num">{v.manual}</td>
                  <td className="font-mono text-[10px] text-mist-400">{v.sizes.map((s) => `${s}"`).join(" ")}</td>
                  <td className="font-mono text-[10px] text-mist-400">{v.classes.join(" ")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="text-[11px] text-mist-400">Total</td>
                <td className="num font-semibold text-teal-300">{valveTotals.qty}</td>
                <td className="num text-mist-200">{valveTotals.actuated}</td>
                <td className="num text-mist-200">{valveTotals.manual}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Bulk pipe by size</h3>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>NPS</th>
                <th className="text-right">OD mm</th>
                <th className="text-right">Lines</th>
                <th className="text-right">Length m</th>
                <th className="text-right">Pipe t</th>
                <th className="text-right">Supports</th>
              </tr>
            </thead>
            <tbody>
              {pipeBySize.map((p) => (
                <tr key={p.nps}>
                  <td className="font-mono text-teal-300">{p.nps}&quot;</td>
                  <td className="num">{p.od_mm}</td>
                  <td className="num">{p.lines}</td>
                  <td className="num">{nf(p.length_m, 0)}</td>
                  <td className="num font-semibold text-mist-200">{nf(p.pipe_t, 2)}</td>
                  <td className="num">{p.supports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Instrument and I/O summary</h3>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Type</th>
                <th className="text-right">Tags</th>
                <th className="text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {instrumentsByType.map((t) => (
                <tr key={t.type}>
                  <td className="text-mist-300">{t.type}</td>
                  <td className="num">{t.tags}</td>
                  <td className="num text-mist-200">{t.qty}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="text-[11px] text-mist-400">
                  {instruments.length} tag groups · {ioSummary.total} I/O of {ioSummary.capacity} capacity
                </td>
                <td />
                <td className="num font-semibold text-teal-300">{ioSummary.wiredQty + ioSummary.localQty}</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Motor and cable schedule</h3>
            <span className="font-mono text-[10px] text-mist-400">
              {nf(motorSummary.installed_kW, 0)} kW · {nf(powerSummary.demand_kVA, 0)} kVA demand
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Driven item</th>
                  <th className="text-right">kW</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">V</th>
                  <th className="text-right">FLC A</th>
                  <th className="text-right">Breaker A</th>
                  <th>Cable</th>
                  <th>Starter</th>
                </tr>
              </thead>
              <tbody>
                {motors.map((m) => (
                  <tr key={m.tag}>
                    <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{m.tag}</td>
                    <td className="num">{m.kw}</td>
                    <td className="num">{m.qty}</td>
                    <td className="num">{m.volts}</td>
                    <td className="num">{nf(m.flc, 1)}</td>
                    <td className="num">{m.breaker}</td>
                    <td className="font-mono text-[10px] text-mist-400">{m.cable}</td>
                    <td className="text-[10px] text-mist-400">{m.starter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Insulation schedule</h3>
            <span className="font-mono text-[10px] text-mist-400">
              {nf(insulationSummary.area_m2, 0)} m² · {nf(insulationSummary.mass_kg / 1000, 1)} t
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Host</th>
                  <th>Material</th>
                  <th className="text-right">Temp °C</th>
                  <th className="text-right">Thk mm</th>
                  <th className="text-right">Area m²</th>
                  <th className="text-right">Mass kg</th>
                  <th>Jacketing</th>
                </tr>
              </thead>
              <tbody>
                {insulationRows.map((r) => (
                  <tr key={r.tag}>
                    <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{r.tag}</td>
                    <td className="font-mono text-[10px] text-mist-400">{r.host}</td>
                    <td className="text-mist-300">{r.material}</td>
                    <td className="num">{r.temp_C}</td>
                    <td className="num">{r.thickness_mm}</td>
                    <td className="num text-mist-200">{nf(r.area_m2, 1)}</td>
                    <td className="num">{nf(r.insulationMass_kg, 0)}</td>
                    <td className="text-[10px] text-mist-400">{r.jacketing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Painting and coating (QC-SPC-001)</h3>
            <div className="mt-2 space-y-1.5">
              {[
                { k: "Bare piping", v: `${nf(paintArea.piping_m2, 0)} m²` },
                { k: "Equipment and racks (MTO above)", v: `${nf(mtoTotals.coating_m2, 0)} m²` },
                { k: `Rack steel (${nf(bulkTotals.rack_t, 1)} t)`, v: `${nf(bulkTotals.rack_paint_m2, 0)} m²` },
                { k: "Insulation jacketing", v: `${nf(insulationSummary.jacketing_m2, 0)} m²` },
                { k: "Supplementary steelwork", v: `${nf(pipingSummary.supports, 0)} supports` },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5">
                  <span className="text-[11px] text-mist-400">{r.k}</span>
                  <span className="font-mono text-[11px] text-mist-200">{r.v}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-mist-400">{paintArea.note}</p>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-2.5">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Pipe racks (make scope)</h3>
            </div>
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Rack</th>
                  <th className="text-right">Length m</th>
                  <th className="text-right">Bent m</th>
                  <th className="text-right">Height m</th>
                  <th className="text-right">Frames</th>
                </tr>
              </thead>
              <tbody>
                {rackParts.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{r.id}</td>
                    <td className="num">{nf(r.w, 0)}</td>
                    <td className="num">{nf(r.d, 1)}</td>
                    <td className="num">{nf(r.h, 1)}</td>
                    <td className="num">{Math.ceil(r.w / 6) + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">Electrical bulk — panels and distribution</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {panels.map((p) => (
            <div key={p.tag} className="rounded border border-line bg-ink-850/60 px-2.5 py-2">
              <div className="font-mono text-[10.5px] text-teal-300">{p.tag}</div>
              <div className="text-[11px] text-mist-200">{p.description}</div>
              <div className="mt-0.5 font-mono text-[10px] text-mist-400">{p.rating}</div>
              <div className="text-[10px] text-mist-400">{p.code}{p.ways ? ` · ${p.ways} ways` : ""}</div>
            </div>
          ))}
        </div>
      </Card>

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
