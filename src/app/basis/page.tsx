import { Card, Badge, SectionTitle, Callout, nf } from "@/components/ui";
import { siteData, documentRegister, clarifications, hazardousArea, project } from "@/data/project";
import { streams, inletParameters, blendedConcentration, riverLimits, reuseLimits } from "@/data/influent";

export const metadata = { title: "Design basis — B047 WWT" };

export default function BasisPage() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle eyebrow="Section 1" title="Design basis and battery limits">
          Transcribed from the five issued documents. Where two documents disagree, the more onerous value is
          adopted and a formal clarification is raised — the register is at the bottom of this page.
        </SectionTitle>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Document register</h3>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Rev</th>
                <th>Role in this package</th>
              </tr>
            </thead>
            <tbody>
              {documentRegister.map((d) => (
                <tr key={d.docNo}>
                  <td>
                    <div className="font-mono text-[11px] text-teal-300">{d.docNo}</div>
                    <div className="mt-0.5 text-[11px] text-mist-300">{d.title}</div>
                    <div className="mt-0.5 text-[10px] text-mist-400">{d.status}</div>
                  </td>
                  <td className="num">{d.rev}</td>
                  <td className="text-[11px] text-mist-400">{d.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Site and meteorological data</h3>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {siteData.map((s) => (
                <tr key={s.label}>
                  <td className="text-mist-300">{s.label}</td>
                  <td className="font-mono text-[11px] text-mist-200">{s.value}</td>
                  <td className="text-[10.5px] text-mist-400">
                    {s.source}
                    {s.note && <div className="mt-0.5 text-amber-l/90">{s.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Codes */}
      <section>
        <SectionTitle eyebrow="Applicable codes" title="Code basis carried into the equipment data sheets" />
        <Card className="p-4">
          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Pressure vessels", "ASME VIII Div.1 · U-stamp mandatory"],
              ["Storage tanks", "API 650 · API 12 series (agitators)"],
              ["Heat exchangers", "TEMA Class R · API 660"],
              ["Centrifugal pumps", "API 610 · API 682 seals"],
              ["Dosing pumps", "API 675"],
              ["Blowers", "API 673"],
              ["Compressors", "API 617 / API 618"],
              ["Steam turbines", "API 611 / API 612"],
              ["Air cooler fans", "API 661 · tip speed ≤ 60 m/s"],
              ["Couplings", "API 671 · ISO 21940-1 G2.5"],
              ["Lube and seal oil", "API 614"],
              ["Piping", "ASME B31.3 · ASTM grades only"],
              ["Flanges", "ASME B16.5 class 150/300"],
              ["Gaskets", "ASME B16.20 spiral wound"],
              ["Welding / NDE", "ASME IX / ASME V"],
              ["Motors", "IEC 60034 · IP55 · Class F/B"],
              ["Electrical assemblies", "IEC 61439 · IEC 60079 for Ex"],
              ["Structural concrete", "ACI 350 for liquid-retaining"],
              ["Seismic", "UBC 1997 Ca 0.12, I = 1.25 (governing)"],
              ["Wind", "ASCE 7-2010, 180 km/h, exposure C"],
              ["Oil-water separation", "API 421"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1.5">
                <span className="text-[11px] text-mist-400">{k}</span>
                <span className="text-right font-mono text-[10.5px] text-mist-200">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Inlet characterisation */}
      <section>
        <SectionTitle eyebrow="RFQ §7" title="Inlet waste water characterisation">
          The four sources are blended on a mass basis. A simple average would understate oil by a third, because
          the 50 m³/h CDU stream carries 1,500 mg/L while the 250 m³/h process drain carries 500.
        </SectionTitle>
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Unit</th>
                  {streams.map((s) => (
                    <th key={s.id} className="text-right">
                      {s.name}
                      <div className="font-normal normal-case tracking-normal text-mist-400">{s.flow_m3h} m³/h</div>
                    </th>
                  ))}
                  <th className="text-right text-teal-300">Blended</th>
                  <th className="text-right">Load</th>
                </tr>
              </thead>
              <tbody>
                {inletParameters.map((p) => {
                  const b = blendedConcentration(p);
                  const load = (b * 550) / 1000;
                  return (
                    <tr key={p.key}>
                      <td className="text-mist-300">{p.label}</td>
                      <td className="text-[10.5px] text-mist-400">{p.unit}</td>
                      {p.values.map((v, i) => (
                        <td key={i} className="num text-mist-400">
                          {v.toLocaleString()}
                        </td>
                      ))}
                      <td className="num font-semibold text-teal-300">
                        {p.nonAdditive ? "6–9" : b.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                      </td>
                      <td className="num text-mist-400">
                        {p.nonAdditive ? "—" : `${nf(load, p.key === "pb" || p.key === "cr" ? 2 : 1)} kg/h`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-2 text-[11px] text-mist-400">
          Load column is at the 550 m³/h design flow (110 % of nameplate, RFQ §17). COD/BOD ratio is{" "}
          {nf(blendedConcentration(inletParameters.find((p) => p.key === "cod")!) / blendedConcentration(inletParameters.find((p) => p.key === "bod")!), 2)}{" "}
          — biodegradable, but with a refractory fraction that needs the GAC polisher.
        </p>
      </section>

      {/* Outlet limits */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Option 1 — river discharge limits</h3>
            <p className="text-[10.5px] text-mist-400">RFQ §8. Values flagged in amber cannot be met by the treatment train.</p>
          </div>
          <div className="max-h-[520px] overflow-y-auto scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Parameter</th>
                  <th className="text-right">Limit</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {riverLimits.map((r) => (
                  <tr key={r.no}>
                    <td className="text-[10px] text-mist-400">{r.no}</td>
                    <td className="text-mist-300">{r.parameter}</td>
                    <td className="num">{r.limit}</td>
                    <td className="text-[10.5px] text-amber-l/90">{r.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Option 2 — reuse feed to raw water RO</h3>
            <p className="text-[10.5px] text-mist-400">
              RFQ §9. 31 of the 49 parameters are marked “VTA” (vendor to advise) — see clarification CL-005.
            </p>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Unit</th>
                <th className="text-right">Limit</th>
                <th className="text-right">Design adopted</th>
              </tr>
            </thead>
            <tbody>
              {reuseLimits.map((r) => (
                <tr key={r.parameter}>
                  <td className="text-mist-300">{r.parameter}</td>
                  <td className="text-[10.5px] text-mist-400">{r.unit}</td>
                  <td className="num">{r.limit}</td>
                  <td className="num text-teal-300">{r.design.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* HAC */}
      <section>
        <SectionTitle eyebrow="Hazardous area" title="Area classification applied to this package">
          {hazardousArea.drawing}. {hazardousArea.tempClass}. {hazardousArea.gasGroup}.
        </SectionTitle>
        <div className="grid gap-3 lg:grid-cols-2">
          {hazardousArea.notes.map((n) => (
            <Card key={n.ref} className="p-4">
              <div className="flex items-center gap-2">
                <Badge tone="rust">{n.ref}</Badge>
                <span className="text-[11px] text-mist-300">{n.impact.split(".")[0]}.</span>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-mist-400">{n.text}</p>
              <p className="mt-2 border-l-2 border-teal-500/40 pl-2 text-[11px] text-mist-300">{n.impact}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Clarifications */}
      <section>
        <SectionTitle eyebrow="Open items" title="Clarifications to raise before the bid is priced">
          Eight contradictions and gaps were found in the issued documents. Each is written so it can be issued
          to ABG today: reference, issue, proposal and cost impact.
        </SectionTitle>
        <div className="space-y-3">
          {clarifications.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-teal-300">{c.id}</span>
                <span className="text-[12.5px] font-semibold text-mist-200">{c.subject}</span>
                <Badge tone={c.severity === "High" ? "rust" : c.severity === "Medium" ? "amber" : "slate"}>
                  {c.severity}
                </Badge>
              </div>
              <div className="mt-2 grid gap-3 md:grid-cols-[1.4fr_1.4fr_0.9fr]">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-mist-400">Issue</div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-mist-300">{c.issue}</p>
                  <p className="mt-1 font-mono text-[10px] text-mist-400">{c.complainantDocs}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-mist-400">Proposal</div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-mist-300">{c.proposal}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-mist-400">Cost impact</div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-mist-400">{c.costImpact}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Callout title="Scope note" tone="amber">
            {project.executionBasis}. Delivery {project.deliveryTerms}. Guarantee basis: {project.guaranteeBasis}.
          </Callout>
        </div>
      </section>
    </div>
  );
}
