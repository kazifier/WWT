import Link from "next/link";
import { Card, Stat, Badge, SectionTitle, Callout, Bar, money, nf, usd } from "@/components/ui";
import { project, treatmentOptions, clarifications, hazardousArea } from "@/data/project";
import { equipmentSummary, byArea } from "@/data/equipment";
import { unlistedCategories } from "@/data/vendors";
import { process as P } from "@/lib/calc/process";
import { loadSummary } from "@/lib/calc/mechanical";
import { mtoTotals, fabrication } from "@/lib/calc/mto";
import { optionEstimates, opexFor, lifeCycle } from "@/lib/calc/cost";
import { haWithSqm, plotArea_m2, sqm } from "@/lib/plantLayout";

const recommended = "opt2r";
const rec = optionEstimates.find((o) => o.id === recommended)!;
const recOpex = opexFor(recommended);

export default function Home() {
  const maxCapex = Math.max(...optionEstimates.map((o) => o.total));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="relative px-6 py-7">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,176,160,0.13),transparent_60%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">Pre-bid engineering dossier</Badge>
              <Badge tone="slate">Rev A</Badge>
              <Badge tone="amber">AACE Class 4 · ±25 %</Badge>
            </div>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-mist-200">
              Waste Water Treatment System — 500 m³/h
            </h1>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-mist-400">
              Design basis, process and mechanical calculations, equipment register, RAMSIS make-versus-buy
              split, BOM/MTO, procurement recommendations and project estimate for{" "}
              {project.parent}, prepared against RFQ {project.rfqNo} and the ABG mechanical design basis.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11.5px] text-mist-400">
              <span>
                Client <span className="text-mist-200">{project.client}</span>
              </span>
              <span>
                EPC <span className="text-mist-200">{project.contractor}</span>
              </span>
              <span>
                EPCM <span className="text-mist-200">{project.epcm}</span>
              </span>
              <span>
                Site <span className="text-mist-200">{project.location}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Design capacity" value="500" unit="m³/h" sub="12,000 m³/d · 50–110 % turndown" accent />
        <Stat label="Recommended capex" value={money(rec.total)} unit="USD" sub={`${usd(rec.perCapacity)} per m³/h of capacity`} />
        <Stat label="Annual opex" value={money(recOpex.total)} unit="/yr" sub="Power, chemicals, membranes, sludge" />
        <Stat label="Equipment tags" value={String(equipmentSummary.count)} sub={`${equipmentSummary.makeCount} make · ${equipmentSummary.buyCount} buy`} />
        <Stat label="Open clarifications" value={String(clarifications.length)} sub={`${clarifications.filter((c) => c.severity === "High").length} high severity`} />
      </section>

      {/* Three findings */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15 text-[11px] text-emerald-300">1</span>
            <h3 className="text-[12.5px] font-semibold text-mist-200">RAMSIS is already approved</h3>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-400">
            RAMSIS Engineering appears on the MRC approved vendor list under <em>Manufactured Items — Columns,
            Pressure Vessels, Exchangers, Heaters, Air Coolers</em> as a <strong className="text-mist-200">non-governing</strong>{" "}
            vendor. That is the best possible starting position: the list explicitly allows the contractor to
            select a non-governing vendor without further MRC approval, provided the equipment meets the
            specification and holds a valid ASME U-stamp.
          </p>
          <Link href="/make-buy" className="mt-3 inline-block text-[11.5px] text-teal-300 hover:underline">
            See the make-versus-buy split →
          </Link>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-rust/15 text-[11px] text-rust">2</span>
            <h3 className="text-[12.5px] font-semibold text-mist-200">Option 1 cannot meet its own limits</h3>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-400">
            The blended inlet carries {nf(P.blended.cl, 0)} mg/L chloride and {nf(P.blended.so4, 0)} mg/L
            sulphate. The river discharge table allows 600 and 400. Neither is removable by biological
            treatment, so Option 1 needs desalination or a renegotiated consent — this has to be settled before
            the bid is priced.
          </p>
          <Link href="/calculations" className="mt-3 inline-block text-[11.5px] text-teal-300 hover:underline">
            Open the calculation sheets →
          </Link>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-l/15 text-[11px] text-amber-l">3</span>
            <h3 className="text-[12.5px] font-semibold text-mist-200">The pond is a plot problem</h3>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-400">
            At {P.membrane.roReject} m³/h of RO reject, net evaporation of {nf(P.evaporation.netEvap_m_yr, 2)} m/yr
            needs {haWithSqm(P.evaporation.areaWithFreeboard_ha)} of lined pond — roughly{" "}
            {money(P.evaporation.areaWithFreeboard_ha * 10_000 * 18)} of lining alone. Concentrating the brine
            first cuts that to about {haWithSqm(P.evaporation.areaWithFreeboard_ha * 0.2)} and is the basis of
            the recommended option.
          </p>
          <Link href="/estimate" className="mt-3 inline-block text-[11.5px] text-teal-300 hover:underline">
            Compare the four options →
          </Link>
        </Card>
      </section>

      {/* Option comparison */}
      <section>
        <SectionTitle eyebrow="Commercial comparison" title="Discharge options against the RFQ">
          The RFQ asks for three options. A fourth is added here because the evaporation pond in Option 2 is
          dominated by liner area, not by treatment cost — concentrating the brine first removes most of that
          area for a fraction of the ZLD cost.
        </SectionTitle>
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Option</th>
                  <th className="text-right">Capex</th>
                  <th className="text-right">Opex / yr</th>
                  <th className="text-right">20-yr PV</th>
                  <th className="w-[22%]">Relative capex</th>
                  <th>Disposition</th>
                </tr>
              </thead>
              <tbody>
                {lifeCycle.map((l) => {
                  const isRec = l.id === recommended;
                  return (
                    <tr key={l.id} className={isRec ? "bg-teal-500/[0.06]" : ""}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={isRec ? "font-semibold text-teal-300" : "text-mist-200"}>{l.name}</span>
                          {isRec && <Badge tone="teal">Recommended</Badge>}
                        </div>
                      </td>
                      <td className="num">{money(l.capex)}</td>
                      <td className="num">{money(l.opex)}</td>
                      <td className="num text-mist-200">{money(l.total)}</td>
                      <td>
                        <Bar value={l.capex} max={maxCapex} tone={isRec ? "teal" : "amber"} />
                      </td>
                      <td className="text-[11px] text-mist-400">
                        {treatmentOptions.find((t) => t.id === l.id)?.disposition ??
                          "Permeate to raw water RO; brine concentrated 4:1 then to a reduced lined pond"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Process at a glance */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Treatment train — design flows</h3>
          <div className="mt-3 space-y-2">
            {[
              { step: "Chemical drain neutralisation", flow: 120, note: "2 × 65 m³ agitated, pH 6.5–8.5" },
              { step: "Oil removal — API / CPI / DAF", flow: P.designFlow, note: `${P.oilRemoval.length_m} m separator, ${P.oilRemoval.dafArea_m2} m² DAF` },
              { step: "Equalisation", flow: P.designFlow, note: `${P.equalisation.volume_m3} m³ · ${P.equalisation.hrt_h} h` },
              { step: "Biological (nitrifying)", flow: P.designFlow, note: `${P.biological.volume_m3} m³ · SRT ${P.biological.srt_d} d` },
              { step: "Clarification", flow: P.designFlow, note: `${P.clarifier.units} × Ø ${P.clarifier.diameter_m} m` },
              { step: "Filtration + GAC", flow: P.designFlow, note: `${P.filtration.units} filters + 2 adsorbers` },
              { step: "UF + RO", flow: P.designFlow, note: `${P.membrane.roRecovery * 100} % recovery · ${P.membrane.roElements} elements` },
              { step: "Reject management", flow: P.membrane.roReject, note: "Brine concentrator then pond" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="w-[42%] shrink-0 text-[11.5px] text-mist-300">{s.step}</div>
                <div className="flex-1">
                  <Bar value={s.flow} max={P.designFlow} />
                </div>
                <div className="w-[26%] shrink-0 text-right font-mono text-[11px] text-mist-400">{nf(s.flow, 0)} m³/h</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-mist-400">{byArea.length} equipment areas · {equipmentSummary.count} tagged items · {usd(equipmentSummary.total)} of supply value</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Make scope at a glance</h3>
          <div className="mt-3 space-y-2.5 text-[12px] text-mist-400">
            <div className="flex justify-between">
              <span>Plate and sections</span>
              <span className="font-mono text-mist-200">{nf(mtoTotals.total_t, 0)} t</span>
            </div>
            <div className="flex justify-between">
              <span>Fabrication manhours</span>
              <span className="font-mono text-mist-200">{mtoTotals.manhours.toLocaleString()} h</span>
            </div>
            <div className="flex justify-between">
              <span>Welding</span>
              <span className="font-mono text-mist-200">{nf(mtoTotals.weld_m, 0)} m</span>
            </div>
            <div className="flex justify-between">
              <span>Coating area</span>
              <span className="font-mono text-mist-200">{nf(mtoTotals.coating_m2, 0)} m²</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <span>Workshop value</span>
              <span className="font-mono text-teal-300">{usd(fabrication.total)}</span>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {mtoTotals.byGrade.map((g) => (
              <div key={g.grade} className="flex items-center gap-2">
                <span className="w-[46%] text-[10.5px] text-mist-400">{g.grade}</span>
                <div className="flex-1">
                  <Bar value={g.tonnes} max={mtoTotals.total_t} />
                </div>
                <span className="w-[22%] text-right font-mono text-[10.5px] text-mist-300">{nf(g.tonnes, 0)} t</span>
              </div>
            ))}
          </div>
          <Link href="/mto" className="mt-3 inline-block text-[11.5px] text-teal-300 hover:underline">
            Full MTO by equipment →
          </Link>
        </Card>
      </section>

      {/* Vendor gap + HAC */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Approved vendor list gaps</h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-mist-400">
            {unlistedCategories.length} equipment categories in this package have no vendor on the MRC list.
            Each has a recommended vendor and the clause that permits it.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {unlistedCategories.map((u) => (
              <Badge key={u.id} tone="amber">
                {u.equipment.split(" (")[0]}
              </Badge>
            ))}
          </div>
          <Link href="/procurement" className="mt-3 inline-block text-[11.5px] text-teal-300 hover:underline">
            Vendor recommendations and justification →
          </Link>
        </Card>

        <Card className="p-4">
          <h3 className="text-[12.5px] font-semibold text-mist-200">Hazardous area — the note that governs this package</h3>
          <Callout title={hazardousArea.notes[0].ref} tone="rust">
            {hazardousArea.notes[0].text}
          </Callout>
          <p className="mt-2 text-[11.5px] leading-relaxed text-mist-400">
            Practical consequence: every instrument in the API separator, CPI and DAF oil-removal train defaults
            to Zone 0 (Ex ia, Category 1G), while the UF/RO module is Zone 2 IIB T3. That difference alone changes
            the instrument cost of the oil-removal area by roughly a factor of two.
          </p>
        </Card>
      </section>

      {/* Electrical + workflow */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Stat label="Electrical demand" value={nf(loadSummary.demand, 0)} unit="kW" sub={`${nf(loadSummary.mvLoad, 0)} kW on 3.3 kV · ${nf(loadSummary.transformer_kVA, 0)} kVA`} />
        <Stat label="Biological oxygen demand" value={nf(P.biological.aor_kgh, 0)} unit="kg O₂/h" sub={`${nf(P.biological.air_m3h, 0)} m³/h of process air`} />
        <Stat label="Sludge to disposal" value={nf(P.sludge.cake_t_d, 1)} unit="t/d" sub={`${nf(P.sludge.total_dry_kgd, 0)} kg/d dry solids at 25 %`} />
      </section>

      <section>
        <SectionTitle eyebrow="How this dossier is built" title="What each section contains">
          Everything is derived from one calculation engine. Change a process assumption and the equipment
          register, the material take-off and the estimate all move with it.
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/basis", title: "Design basis", body: "Site data, codes, hazardous area, inlet and outlet battery limits, and the contradictions between the issued documents." },
            { href: "/calculations", title: "Calculations", body: "18 calculation sheets with formula, substitution and a pass/fail check against the clause that requires it." },
            { href: "/equipment", title: "Equipment register", body: "Every tag with duty, material, code, zone, Ex rating, power, weight and lead time." },
            { href: "/make-buy", title: "Make versus buy", body: "What RAMSIS can fabricate in Bahrain, what must be bought, and why — item by item." },
            { href: "/mto", title: "BOM / MTO", body: "Plate, sections, coating and manhours for the make scope, by grade and by equipment." },
            { href: "/procurement", title: "Procurement", body: "Governing vendors from the MRC list, plus recommendations for every category the list omits." },
            { href: "/estimate", title: "Estimate", body: "Capex by line item, opex by driver, and a 20-year life-cycle comparison." },
            { href: "/model", title: "3D model", body: "Parametric plant model built from the equipment dimensions, with zone overlays." },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card group p-3.5 transition-colors hover:border-teal-500/40">
              <div className="text-[12px] font-semibold text-mist-200 group-hover:text-teal-300">{c.title}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-mist-400">{c.body}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
