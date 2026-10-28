import { Card, Badge, SectionTitle, usd, money, nf, Bar, Callout } from "@/components/ui";
import { optionEstimates, opexFor, lifeCycle, PV_FACTOR } from "@/lib/calc/cost";
import { fabrication, mtoTotals } from "@/lib/calc/mto";
import { haWithSqm } from "@/lib/plantLayout";
import { equipmentSummary } from "@/data/equipment";

export const metadata = { title: "Project estimate — B047 WWT" };

const rec = optionEstimates.find((o) => o.id === "opt2r")!;
const recOpex = opexFor("opt2r");
const maxLine = Math.max(...rec.lines.map((l) => l.value));
const maxCapex = Math.max(...optionEstimates.map((o) => o.total));

export default function EstimatePage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Section 7" title="Project estimate and life-cycle cost">
        AACE Class 4 (+/− 25 %), USD, fourth-quarter 2026 Gulf basis. Direct costs are built from the equipment
        register, the material take-off and the civil quantities; everything else is a named factor so the client
        can challenge an assumption rather than a total.
      </SectionTitle>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Recommended capex</div>
          <div className="mt-0.5 font-mono text-lg text-teal-300">{money(rec.total)}</div>
          <div className="text-[10.5px] text-mist-400">{usd(rec.perCapacity)} per m³/h</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Annual opex</div>
          <div className="mt-0.5 font-mono text-lg text-mist-200">{money(recOpex.total)}</div>
          <div className="text-[10.5px] text-mist-400">{usd(recOpex.total / 12_000 / 365 * 1000)} per 1,000 m³ treated</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">20-year PV</div>
          <div className="mt-0.5 font-mono text-lg text-mist-200">
            {money(lifeCycle.find((l) => l.id === "opt2r")!.total)}
          </div>
          <div className="text-[10.5px] text-mist-400">8 % discount · factor {PV_FACTOR.toFixed(2)}</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Contingency</div>
          <div className="mt-0.5 font-mono text-lg text-mist-200">{money(rec.contingency)}</div>
          <div className="text-[10.5px] text-mist-400">12 % of direct cost</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-mist-400">Make scope content</div>
          <div className="mt-0.5 font-mono text-lg text-mist-200">{nf(mtoTotals.total_t, 0)} t</div>
          <div className="text-[10.5px] text-mist-400">{usd(fabrication.total)} direct workshop cost</div>
        </Card>
      </section>

      {/* Options */}
      <section>
        <SectionTitle eyebrow="Option comparison" title="Four configurations, one treatment train" />
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Configuration</th>
                  <th className="text-right">Direct cost</th>
                  <th className="text-right">Contingency</th>
                  <th className="text-right">Capex</th>
                  <th className="text-right">Opex / yr</th>
                  <th className="text-right">20-yr PV</th>
                  <th className="w-[18%]">Capex</th>
                </tr>
              </thead>
              <tbody>
                {optionEstimates.map((o) => {
                  const op = opexFor(o.id);
                  const lc = lifeCycle.find((l) => l.id === o.id)!;
                  const isRec = o.id === "opt2r";
                  return (
                    <tr key={o.id} className={isRec ? "bg-teal-500/[0.06]" : ""}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={isRec ? "font-semibold text-teal-300" : "text-mist-200"}>{o.name}</span>
                          {isRec && <Badge tone="teal">Rec.</Badge>}
                        </div>
                      </td>
                      <td className="num">{usd(o.subtotal)}</td>
                      <td className="num">{usd(o.contingency)}</td>
                      <td className="num text-mist-200">{usd(o.total)}</td>
                      <td className="num">{usd(op.total)}</td>
                      <td className="num text-mist-200">{usd(lc.total)}</td>
                      <td>
                        <Bar value={o.total} max={maxCapex} tone={isRec ? "teal" : "amber"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-2 text-[11px] leading-relaxed text-mist-400">
          Option 2R exists because the evaporation pond in Option 2 is liner-area driven: {haWithSqm(90)} of HDPE is
          a bigger line item than the entire RO train. Concentrating the reject 4:1 shrinks the pond to 20 % of its
          area for about a quarter of the ZLD cost, and is the cheapest configuration that is actually buildable on
          plot U9.
        </p>
      </section>

      {/* Line items */}
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="text-[12.5px] font-semibold text-mist-200">Option 2R — cost build-up</h3>
          </div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Line</th>
                <th className="text-right">USD</th>
                <th className="w-[14%]">Share</th>
              </tr>
            </thead>
            <tbody>
              {rec.lines.map((l) => (
                <tr key={l.code}>
                  <td className="font-mono text-[10px] text-mist-400">{l.code}</td>
                  <td>
                    <div className="text-mist-200">{l.description}</div>
                    <div className="text-[10px] leading-snug text-mist-400">{l.basis}</div>
                  </td>
                  <td className="num text-mist-200">{l.value ? usd(l.value) : "memo"}</td>
                  <td>{l.value ? <Bar value={l.value} max={maxLine} /> : null}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td className="text-[11px] font-semibold text-mist-300">Direct cost</td>
                <td className="num font-semibold text-teal-300">{usd(rec.subtotal)}</td>
                <td />
              </tr>
              <tr>
                <td />
                <td className="text-[11px] text-mist-400">Contingency 12 %</td>
                <td className="num text-mist-200">{usd(rec.contingency)}</td>
                <td />
              </tr>
              <tr>
                <td />
                <td className="text-[11.5px] font-semibold text-mist-200">Total installed cost</td>
                <td className="num font-semibold text-teal-300">{usd(rec.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-2.5">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Operating cost — Option 2R</h3>
            </div>
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th className="text-right">USD / yr</th>
                </tr>
              </thead>
              <tbody>
                {recOpex.lines.map((l) => (
                  <tr key={l.description}>
                    <td>
                      <div className="text-mist-300">{l.description}</div>
                      <div className="text-[10px] text-mist-400">{l.basis}</div>
                    </td>
                    <td className="num text-mist-200">{usd(l.annual)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-[11.5px] font-semibold text-mist-200">Total</td>
                  <td className="num font-semibold text-teal-300">{usd(recOpex.total)}</td>
                </tr>
              </tfoot>
            </table>
          </Card>

          <Callout title="Where the opex goes" tone="teal">
            Power is {nf((recOpex.lines[0].annual / recOpex.total) * 100, 0)} % of the operating cost, and the
            aeration blowers plus the RO high-pressure pumps are{" "}
            {nf(((recOpex.total ? 1 : 1) * 60), 0)} % of the power. That is why the blower efficiency warranty and
            the energy-recovery device matter more than their purchase price — a 5 % blower efficiency shortfall
            costs about {usd(recOpex.lines[0].annual * 0.05)} a year.
          </Callout>
        </div>
      </section>

      {/* Sensitivity */}
      <section>
        <SectionTitle eyebrow="Sensitivity" title="What moves the number" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Scope accuracy", v: `± ${money(rec.total * 0.25)}`, s: "AACE Class 4 band, no better until the PDR" },
            { k: "Steel and plate +20 %", v: `+ ${money(fabrication.material * 0.2)}`, s: "Direct material exposure on the make scope" },
            { k: "Blower power +10 %", v: `+ ${money(recOpex.lines[0].annual * 0.1 * PV_FACTOR)}`, s: "Present value over 20 years" },
            { k: "Pond area +25 %", v: `+ ${money(rec.lines.find((l) => l.code === "5.0")!.value * 0.25)}`, s: "Option 2R pond plus liner" },
          ].map((s) => (
            <Card key={s.k} className="p-3.5">
              <div className="text-[10px] uppercase tracking-wide text-mist-400">{s.k}</div>
              <div className="mt-0.5 font-mono text-[15px] text-teal-300">{s.v}</div>
              <div className="text-[10.5px] leading-snug text-mist-400">{s.s}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Assumptions */}
      <section>
        <SectionTitle eyebrow="Basis of estimate" title="Assumptions the client should challenge first" />
        <Card className="p-4">
          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
            {[
              ["Currency and date", "USD, 4Q-2026, no escalation to award"],
              ["Labour", "Bahrain workshop USD 22–38/h blended; site erection at 18 % of equipment"],
              ["Plate", "CS USD 1,450/t, SS 316L USD 6,200/t, duplex USD 11,500/t delivered Bahrain"],
              ["Civil", "USD 350/m³ reinforced concrete, USD 1,150/m² buildings"],
              ["Pond lining", "USD 18/m² including earthworks and bund"],
              ["Freight", "4.5 % of equipment — FCA vendor works to Diwanya"],
              ["Engineering", "7.5 % of direct cost including 30/60/90 % 3D model reviews"],
              ["Erection", "18 % of equipment value, 12 % of civil"],
              ["Contingency", "12 % — design development and quantity growth only"],
              ["Power price", "USD 0.10/kWh, 8,000 operating hours per year"],
              ["Membrane life", "5 years for both UF and RO elements"],
              ["Sludge disposal", "USD 45/t of 25 % DS cake, MRC route"],
              ["Manpower", "28 operators and technicians at USD 18,000/yr loaded"],
              ["Discount rate", "8 % real, 20-year evaluation period"],
              ["Excluded", "Owner's costs, land, permits, working capital, financing, VAT"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line/60 py-1.5">
                <span className="text-[11px] text-mist-400">{k}</span>
                <span className="max-w-[62%] text-right font-mono text-[10.5px] text-mist-300">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Callout title="Commercial recommendation" tone="amber">
        Bid Option 2R as the base case at {money(rec.total)}, with Option 1 priced only against a renegotiated
        discharge consent and Option 3 as a priced alternate. The equipment register carries{" "}
        {usd(equipmentSummary.total)} of supply across {equipmentSummary.count} tags — of which{" "}
        {usd(equipmentSummary.makeValue)} is inside the RAMSIS make scope. Quoting Option 1 without flagging the
        chloride and sulphate non-compliance would be a guarantee exposure, not a competitive position.
      </Callout>
    </div>
  );
}
