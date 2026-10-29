import { Card, Badge, SectionTitle, Callout, usd, nf, Bar } from "@/components/ui";
import { equipment, equipmentSummary } from "@/data/equipment";
import { avlCategories, avlRules } from "@/data/vendors";
import { mtoTotals, fabrication } from "@/lib/calc/mto";
import { pipingSummary, valveTotals } from "@/lib/piping";
import { ioSummary } from "@/lib/instruments";
import { motorSummary, trayFill } from "@/lib/electrical";
import { insulationSummary, paintArea } from "@/lib/insulation";
import { partCounts } from "@/lib/plantLayout";
import { bulkTotals } from "@/lib/calc/bulk";

export const metadata = { title: "Make vs buy — B047 WWT" };

const make = equipment.filter((e) => e.makeBuy === "MAKE");
const buy = equipment.filter((e) => e.makeBuy === "BUY");
const makeValue = make.reduce((s, e) => s + e.cost_usd * e.qty, 0);
const buyValue = buy.reduce((s, e) => s + e.cost_usd * e.qty, 0);

const capability = [
  { skill: "Plate rolling", required: "up to 8 mm CS / 8 mm 316L on this package; 40 mm shop capacity", status: true, note: "All make-scope shells are inside the workshop's capacity with margin." },
  { skill: "ASME VIII Div.1 U-stamp", required: "Mandatory per AVL note for all pressure equipment", status: true, note: "RAMSIS holds the stamp; the Authorised Inspector must witness every hydrotest. Certificate validity to be confirmed at PO stage." },
  { skill: "API 650 field-erected tanks", required: "2 × 2,200 m³ equalisation tanks", status: true, note: "Rolling, erection and shell-to-bottom weld detail are routine. Site erection in Diwanya needs a mobile crew and a crawler crane." },
  { skill: "Austenitic and duplex welding", required: "316L tanks, 2205 mixer propellers", status: true, note: "316L TIG/GTAW with pickling and passivation. Duplex is bought as castings, not fabricated." },
  { skill: "FRP / thermoplastic fabrication", required: "odour scrubber, CPI plate packs, dosing tanks", status: true, note: "Hand lay-up FRP for the scrubber shell; the CPI plate packs remain bought-in." },
  { skill: "Coating and lining", required: "epoxy lining of CS basins, rubber lining of caustic tanks", status: true, note: "Blast to Sa 2.5 plus epoxy. Rubber lining is subcontracted to a specialist applicator." },
  { skill: "PWHT and impact testing", required: "only if MDMT drops below −10 °C", status: false, note: "Not in-house. MDMT is +1 °C operating and −8 °C ambient, so PWHT is not triggered — but confirm with CL-001 before assuming." },
  { skill: "Rotating equipment manufacture", required: "pumps, blowers, centrifuges, mixers", status: false, note: "Not a RAMSIS capability, and the approved vendor list makes these governing purchases anyway." },
  { skill: "Membrane and thermal packages", required: "UF, RO, MVR, crystalliser", status: false, note: "Proprietary process guarantees cannot be fabricated. Buy." },
];

export default function MakeBuyPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Section 4" title="What RAMSIS manufactures — and what it must buy">
        The split is not a commercial preference. It follows from three tests applied to every tag: does the item
        carry a proprietary performance guarantee, is it rotating equipment, and does it sit inside the approved
        vendor list as a governing item? Anything that fails all three is a candidate for the Bahrain workshop.
      </SectionTitle>

      {/* AVL status */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="green">Approved vendor list position</Badge>
          <Badge tone="teal">Non-governing — manufactured process equipment</Badge>
        </div>
        <h3 className="mt-3 text-[15px] font-semibold text-mist-200">
          RAMSIS Engineering is already on the MRC list
        </h3>
        <p className="mt-2 max-w-4xl text-[12.5px] leading-relaxed text-mist-400">
          The vendors list (2024B047-ABG-DIW R1) carries RAMSIS Engineering under <em>Manufactured Items —
          Columns, Pressure Vessels, Exchangers, Heaters, Air Coolers</em> with the status{" "}
          <strong className="text-mist-200">Non-Governing (Non-Critical)</strong>. Under the list&apos;s own
          definition, the contractor follows project specifications and selects the most suitable vendor for
          non-governing items — no special approval is needed to place the order with RAMSIS.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {avlRules.slice(1, 4).map((r) => (
            <div key={r.rule} className="rounded border border-line bg-ink-900/60 p-3">
              <div className="text-[11px] font-semibold text-mist-200">{r.rule}</div>
              <p className="mt-1 border-l-2 border-teal-500/40 pl-2 font-mono text-[10.5px] leading-relaxed text-teal-300/90">
                “{r.quote}”
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mist-400">{r.application}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary */}
      <section className="grid gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Make — RAMSIS</div>
          <div className="mt-1 font-mono text-xl text-emerald-300" data-commercial>{usd(makeValue)}</div>
          <div className="text-[11px] text-mist-400">{make.length} tags · {nf((makeValue / (makeValue + buyValue)) * 100, 0)} % of supply</div>
          <div className="mt-2"><Bar value={makeValue} max={makeValue + buyValue} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Buy — purchased</div>
          <div className="mt-1 font-mono text-xl text-violet-300" data-commercial>{usd(buyValue)}</div>
          <div className="text-[11px] text-mist-400">{buy.length} tags · {nf((buyValue / (makeValue + buyValue)) * 100, 0)} % of supply</div>
          <div className="mt-2"><Bar value={buyValue} max={makeValue + buyValue} tone="amber" /></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Workshop take-off</div>
          <div className="mt-1 font-mono text-xl text-mist-200">{nf(mtoTotals.total_t, 0)} t</div>
          <div className="text-[11px] text-mist-400">{mtoTotals.manhours.toLocaleString()} h · {nf(mtoTotals.weld_m, 0)} m weld</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Direct workshop cost</div>
          <div className="mt-1 font-mono text-xl text-teal-300" data-commercial>{usd(fabrication.total)}</div>
          <div className="text-[11px] text-mist-400">Plate, labour, coating, NDT, consumables</div>
        </Card>
      </section>

      {/* Capability cross-check */}
      <section>
        <SectionTitle eyebrow="Capability check" title="Shop capability against the scope it would take">
          Each row is a real requirement from the make list, checked against what a Bahrain workshop of this class
          can actually deliver. Two rows fail — and both are deliberately outside the make scope.
        </SectionTitle>
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Package requirement</th>
                  <th>In house</th>
                  <th>Assessment</th>
                </tr>
              </thead>
              <tbody>
                {capability.map((c) => (
                  <tr key={c.skill}>
                    <td className="text-mist-200">{c.skill}</td>
                    <td className="min-w-[260px] text-[10.5px] text-mist-400">{c.required}</td>
                    <td>
                      <Badge tone={c.status ? "green" : "rust"}>{c.status ? "Yes" : "No"}</Badge>
                    </td>
                    <td className="min-w-[320px] text-[10.5px] text-mist-400">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Decision table */}
      <section>
        <SectionTitle eyebrow="Item by item" title="Make / buy decision and the reason behind it">
          {equipmentSummary.makeCount} tags are made and {equipmentSummary.buyCount} bought. The rationale column
          is the one that matters at the bid clarification meeting.
        </SectionTitle>
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Supply</th>
                  <th>Decision</th>
                  <th>Reason</th>
                  <th>AVL status</th>
                </tr>
              </thead>
              <tbody>
                {[...make, ...buy].map((e) => (
                  <tr key={e.tag}>
                    <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{e.tag}</td>
                    <td className="min-w-[190px] text-mist-200">
                      {e.description}
                      <div className="text-[10px] text-mist-400">{e.type}</div>
                    </td>
                    <td className="num">{e.qty}</td>
                    <td className="num" data-commercial>{usd(e.cost_usd * e.qty)}</td>
                    <td>
                      <Badge tone={e.makeBuy === "MAKE" ? "green" : "violet"}>{e.makeBuy}</Badge>
                    </td>
                    <td className="min-w-[360px] text-[10.5px] leading-relaxed text-mist-400">{e.rationale}</td>
                    <td>
                      <Badge tone={e.avl === "Governing" ? "amber" : e.avl === "Non-governing" ? "teal" : "slate"}>{e.avl}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Bulk disciplines */}
      <section>
        <SectionTitle eyebrow="Bulk scope" title="Piping, valves, instruments, motors, insulation and racks">
          The same three tests are applied to the bulk disciplines. Fabrication is kept where it is welding and
          steelwork — spools, supports, racks, cladding and coating — and everything with a proprietary rating,
          a certificate or a catalogue number is bought.
        </SectionTitle>
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Discipline</th>
                  <th>Scope item</th>
                  <th className="text-right">Quantity</th>
                  <th>Decision</th>
                  <th>Where it goes / who supplies it</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Piping",
                    "Bulk pipe, fittings, flanges, gaskets, bolting",
                    `${nf(pipingSummary.pipe_t, 1)} t · ${pipingSummary.flanges} flanges`,
                    "BUY",
                    "Pipe mill and fittings stockholder against PP-SPE-0002 classes; 316L is the long-lead item. Gaskets to B16.20 spiral wound, bolting A193 B7 / A194 2H.",
                  ],
                  [
                    "Piping",
                    "Spool fabrication, supports and spring hangers",
                    `${nf(pipingSummary.length_m, 0)} m · ${pipingSummary.supports} supports`,
                    "MAKE",
                    "RAMSIS spool shop: cutting, bevelling, TIG root and GTAW fill on 316L, hydrotest packs by area. Supports to MSS SP-58 from the same plate take-off.",
                  ],
                  [
                    "Valves",
                    "Gate, globe, check, ball, butterfly, control, PSV",
                    `${valveTotals.qty} off (${valveTotals.actuated} actuated)`,
                    "BUY",
                    "Non-governing catalogue items — buy against the class. Control valves and PSVs are governing: size and select with the vendor, not from stock.",
                  ],
                  [
                    "Instruments",
                    "Transmitters, analysers, switches, gauges, positioners",
                    `${ioSummary.wiredQty + ioSummary.localQty} off · ${ioSummary.total} I/O`,
                    "BUY",
                    "Endress+Hauser, Emerson/Rosemount, Yokogawa (recommended where not on the AVL). Ex ia IIC T4 certification is mandatory in Zone 0.",
                  ],
                  [
                    "Electrical",
                    "Motors, VFDs, cables, trays, junction boxes",
                    `${motorSummary.count} motors · ${nf(motorSummary.cable_m, 0)} m cable`,
                    "BUY",
                    "Motors and drives from the AVL motor vendors; cable and tray from a Gulf stockholder. Tray fill checked at " + `${trayFill.fill_pct} %` + " on the 300 mm ladder.",
                  ],
                  [
                    "Electrical",
                    "MCC, PCC and control panels — enclosure and assembly",
                    `${trayFill.tray}`,
                    "MAKE",
                    "Panel assembly and wiring can be done in Bahrain under IEC 61439 with bought-in breakers and drives; the Form 4b type test certificate stays with the component vendor.",
                  ],
                  [
                    "Piperacks",
                    "Rack steel, bents, bracing, base plates",
                    `${partCounts.racks} racks · ${nf(partCounts.rackLength_m, 0)} m · ~${nf(bulkTotals.rack_t, 1)} t`,
                    "MAKE",
                    "Ideal make item: hot-rolled sections, bolted bents, galvanised or painted in the same shop. Ships as loose steel, erects in days.",
                  ],
                  [
                    "Insulation",
                    "Rock wool, cellular glass, PUF, aluminium jacketing",
                    `${nf(insulationSummary.area_m2, 0)} m² · ${nf(insulationSummary.mass_kg / 1000, 1)} t`,
                    "MAKE",
                    "Material bought from an insulation stockholder; RAMSIS applies it with its own cladding crew — the labour, not the material, is the make content.",
                  ],
                  [
                    "Painting",
                    "Blast and coating system",
                    `${nf(paintArea.piping_m2 + mtoTotals.coating_m2, 0)} m²`,
                    "MAKE",
                    "Paint bought to QC-SPC-001; application in the RAMSIS blast and paint shop, DFT and holiday tested before dispatch.",
                  ],
                ].map((r) => (
                  <tr key={r[0] + r[1]}>
                    <td className="whitespace-nowrap text-mist-300">{r[0]}</td>
                    <td className="min-w-[250px] text-mist-200">{r[1]}</td>
                    <td className="num whitespace-nowrap">{r[2]}</td>
                    <td>
                      <Badge tone={r[3] === "MAKE" ? "green" : "violet"}>{r[3]}</Badge>
                    </td>
                    <td className="min-w-[340px] text-[10.5px] leading-relaxed text-mist-400">{r[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Why make helps */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">What the make scope buys the project</h3>
          <ul className="mt-2 space-y-2 text-[11.5px] leading-relaxed text-mist-400">
            <li>
              <span className="text-mist-200">Schedule.</span> The two equalisation tanks and the API separator
              basins are on the critical path at 28–30 weeks. Fabricating them 120 km from the site instead of
              importing from Korea or Italy removes 6–8 weeks of sea freight and customs from the programme.
            </li>
            <li>
              <span className="text-mist-200">Interface risk.</span> The DAF basin, the scraper mounts and the
              air-saturation nozzle positions are all defined by the process design. Welding the basin around the
              bought-in scraper, in the same shop, removes the classic “holes don&apos;t line up” claim.
            </li>
            <li>
              <span className="text-mist-200">Change orders.</span> Nozzle and manway changes on a rework basis
              cost a fraction of a vendor claim once the shell is in Bahrain rather than in a Korean yard.
            </li>
            <li>
              <span className="text-mist-200">Local content.</span> The project is delivered by ABG for MRC in
              Iraq; Gulf-based fabrication supports the local-content weighting in the bid evaluation.
            </li>
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Risks that must be managed</h3>
          <ul className="mt-2 space-y-2 text-[11.5px] leading-relaxed text-mist-400">
            <li>
              <span className="text-rust">U-stamp validity.</span> The AVL note requires every pressure equipment
              manufacturer to be ASME U-stamp certified. Confirm the certificate is current for the specific shop
              and that the Authorised Inspector is engaged before the first shell is rolled — not after.
            </li>
            <li>
              <span className="text-rust">Zone 0 instrument integration.</span> Fitting Ex ia instruments to a
              Zone 0 basin is not a welding problem but a documentation problem: the intrinsically safe loop
              calculations must be done by the E&I contractor, not assumed.
            </li>
            <li>
              <span className="text-amber-l">Site erection crew.</span> The 2,200 m³ tanks cannot travel erected.
              A mobile crew, a crawler crane and a certified welder pool must be planned for a 10-week window in
              Diwanya in summer.
            </li>
            <li>
              <span className="text-amber-l">Rubber and epoxy lining.</span> Subcontracted to a specialist
              applicator; the lining cure schedule is the single biggest threat to the basin delivery date.
            </li>
          </ul>
        </Card>
      </section>

      <Callout title="Recommendation" tone="teal">
        Take the make scope exactly as listed: {make.length} tags{" "}
        <span data-commercial>worth {usd(makeValue)}</span>, being the fabricated static items with no proprietary
        process guarantee. Buy the {buy.length} tags <span data-commercial>worth {usd(buyValue)}</span> that carry a
        performance guarantee, a rotating element or a governing AVL status. Do not attempt the membrane
        skids, blowers or centrifuges in house — the guarantee exposure outweighs any fabrication margin.
      </Callout>

      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">AVL coverage used for the split</h3>
        <div className="mt-3 space-y-1">
          {avlCategories.slice(0, 8).map((c) => (
            <div key={c.equipment} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 py-1.5">
              <span className="text-[11px] text-mist-300">{c.equipment}</span>
              <span className="font-mono text-[10px] text-mist-400">
                {c.governing ? "GOVERNING" : "non-governing"} · {c.vendors.length} vendors
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
