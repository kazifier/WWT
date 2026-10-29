"use client";

import { useState } from "react";
import { Card, Badge, SectionTitle, Stat, Callout, Bar, nf, usd, money } from "@/components/ui";
import { useViewMode } from "@/components/view-mode";
import {
  optionComparisons,
  recommendedOption,
  ranking,
  weightedTotal,
  commercialDelta,
  type OptionComparison,
} from "@/lib/options";
import { process as P } from "@/lib/calc/process";
import { haWithSqm, plotArea_m2, sqm } from "@/lib/plantLayout";
import { project } from "@/data/project";
import { PV_FACTOR } from "@/lib/calc/cost";

const fmtLand = (m2: number) => `${sqm(m2)} (${(m2 / 10_000).toFixed(2)} ha)`;
const fmtMW = (kw: number) => `${nf(kw / 1000, 2)} MW`;

const TONE: Record<string, "teal" | "amber" | "rust" | "slate" | "green" | "violet"> = {
  opt1: "rust",
  opt2: "amber",
  opt2r: "green",
  opt3: "violet",
};

export default function OptionsPage() {
  const { isInternal } = useViewMode();
  const [detail, setDetail] = useState<OptionComparison["id"]>(recommendedOption.id);
  const order = ranking(isInternal);
  const current = optionComparisons.find((o) => o.id === detail)!;
  const maxCapex = Math.max(...optionComparisons.map((o) => o.capex));
  const maxOpex = Math.max(...optionComparisons.map((o) => o.opex));

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Section 11" title="Discharge options — detailed comparison and recommendation">
        The RFQ asks for three routes: river discharge (§8), reuse with an evaporation pond (§9) and zero liquid
        discharge (§10). Every number below is derived from the same process sheets, land calculations and estimate
        model that the rest of this dossier uses, so the comparison moves with the design rather than sitting beside
        it. A fourth route — reuse with an MVR brine concentrator — is added and recommended.
      </SectionTitle>

      {/* ---------------------------------------------------------------- */}
      {/* recommendation                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="col-span-2 border-emerald-500/30 p-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Badge tone="green">Recommended</Badge>
            <span className="font-mono text-[11px] text-mist-400">Option {recommendedOption.code}</span>
          </div>
          <div className="mt-1.5 text-[15px] font-semibold text-mist-100">{recommendedOption.short}</div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-mist-400">{recommendedOption.disposition}</p>
        </Card>
        <Stat
          label="Water recovered"
          value={`${recommendedOption.recovery_pct} %`}
          sub={`${nf(recommendedOption.reuse_m3h, 0)} m³/h back to the raw-water RO, ${recommendedOption.recovery_pct} % of the membrane feed`}
          accent
        />
        <Stat
          label="Brine to the refinery"
          value={`${nf(recommendedOption.brine_m3h, 0)} m³/h`}
          sub="No river discharge, no pond, no salt on the plot"
        />
        <Stat
          label="Plot for disposal"
          value={fmtLand(recommendedOption.land_m2).split(" (")[0]}
          sub={`${(recommendedOption.land_m2 / 10_000).toFixed(2)} ha — Option 2 needs ${P.evaporation.areaWithFreeboard_ha} ha`}
        />
      </section>

      {!isInternal && (
        <Callout title="Client view active" tone="teal">
          Pricing, capital and operating cost, and every commercial figure are removed from this page. Switch to the
          internal view in the header to see the full comparison.
        </Callout>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* at-a-glance matrix                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">1 · The four options at a glance</h3>
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="min-w-[190px]">Criterion</th>
                  {optionComparisons.map((o) => (
                    <th key={o.id} className="min-w-[170px]">
                      <div className="flex items-center gap-1.5">
                        <span>Option {o.code}</span>
                        {o.recommended && <Badge tone="green">Rec.</Badge>}
                      </div>
                      <div className="mt-0.5 text-[9.5px] font-normal normal-case tracking-normal text-mist-400">
                        {o.short}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Final disposition", (o: OptionComparison) => o.disposition],
                  ["Water recovered", (o: OptionComparison) => `${o.recovery_pct} % · ${nf(o.reuse_m3h, 0)} m³/h`],
                  [
                    "Liquid leaving the plot",
                    (o: OptionComparison) =>
                      o.pond_m3h > 0
                        ? `${nf(o.pond_m3h, 0)} m³/h to the pond, 0 to the river`
                        : o.brine_m3h > 0
                          ? `${nf(o.brine_m3h, 0)} m³/h of brine to the refinery`
                          : o.discharge_m3h > 0
                            ? `${nf(o.discharge_m3h, 0)} m³/h to the river`
                            : "None — dry salt only",
                  ],
                  ["River limits met", (o: OptionComparison) => (o.river_compliant ? "Yes" : "No — deviation required")],
                  ["Reuse limits met", (o: OptionComparison) => (o.reuse_compliant ? "Yes" : "Not applicable")],
                  ["Chloride in the product", (o: OptionComparison) => (o.chloride_mgL === null ? "—" : `${nf(o.chloride_mgL, 0)} mg/L`)],
                  ["Sulphate in the product", (o: OptionComparison) => (o.sulphate_mgL === null ? "—" : `${nf(o.sulphate_mgL, 0)} mg/L`)],
                  ["Salt for disposal", (o: OptionComparison) => (o.salt_t_d > 0 ? `${nf(o.salt_t_d, 1)} t/d` : "None")],
                  ["Plant demand", (o: OptionComparison) => `${fmtMW(o.power_kW)} total · +${nf(o.incremental_kW / 1000, 2)} MW`],
                  ["Land for disposal", (o: OptionComparison) => fmtLand(o.land_m2)],
                  ["Weighted score", (o: OptionComparison) => `${weightedTotal(o.scores, isInternal)} / 5`],
                ].map(([label, fn]) => (
                  <tr key={label as string}>
                    <td className="text-mist-300">{label as string}</td>
                    {optionComparisons.map((o) => (
                      <td key={o.id} className="text-mist-200">
                        {(fn as (o: OptionComparison) => string)(o)}
                      </td>
                    ))}
                  </tr>
                ))}
                {isInternal && (
                  <tr className="bg-ink-900/40">
                    <td className="text-mist-300">Capital cost, AACE Class 4</td>
                    {optionComparisons.map((o) => (
                      <td key={o.id} className="num font-semibold text-teal-300" data-commercial>
                        {money(o.capex)}
                      </td>
                    ))}
                  </tr>
                )}
                {isInternal && (
                  <tr className="bg-ink-900/40">
                    <td className="text-mist-300">Operating cost, per year</td>
                    {optionComparisons.map((o) => (
                      <td key={o.id} className="num text-mist-200" data-commercial>
                        {money(o.opex)}
                      </td>
                    ))}
                  </tr>
                )}
                {isInternal && (
                  <tr className="bg-ink-900/40">
                    <td className="text-mist-300">
                      20-year life-cycle cost <span className="text-mist-400">(8 % discount)</span>
                    </td>
                    {optionComparisons.map((o) => (
                      <td key={o.id} className="num text-mist-200" data-commercial>
                        {money(o.lcc)}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-[10.5px] leading-relaxed text-mist-400">
          Land is quoted in square metres with the hectare equivalent in brackets. Plot U9 is {sqm(plotArea_m2)} (
          {haWithSqm(plotArea_m2 / 10_000)}), which is why the Option 2 pond cannot sit inside the battery limit.
          Product quality assumes 95 % ionic rejection across the RO and the stated recovery; the river limits are
          RFQ §8 and the reuse limits are RFQ §9.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* weighted decision                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">2 · Weighted decision matrix</h3>
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden">
            <div className="scroll-x">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Criterion</th>
                    <th className="text-right">Weight</th>
                    {optionComparisons.map((o) => (
                      <th key={o.id} className="text-right">
                        Opt {o.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {optionComparisons[0].scores.map((s, i) => (
                    <tr key={s.criterion}>
                      <td className="min-w-[210px] text-mist-300">
                        {s.criterion}
                        {s.criterion === "Capital cost" && (
                          <span className="ml-1 text-[9.5px] text-mist-400">(internal only)</span>
                        )}
                      </td>
                      <td className="num text-right text-mist-400">
                        {isInternal || s.criterion !== "Capital cost"
                          ? `${Math.round(s.weight * 100)} %`
                          : "dropped"}
                      </td>
                      {optionComparisons.map((o) => {
                        const hidden = !isInternal && s.criterion === "Capital cost";
                        return (
                          <td key={o.id} className="num text-right text-mist-200">
                            {hidden ? "—" : o.scores[i].score}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-ink-900/50">
                    <td className="font-semibold text-mist-200">Weighted total</td>
                    <td className="num text-right text-mist-400">{isInternal ? "100" : "90"} %</td>
                    {optionComparisons.map((o) => {
                      const total = weightedTotal(o.scores, isInternal);
                      return (
                        <td
                          key={o.id}
                          className={`num text-right font-semibold ${o.recommended ? "text-emerald-300" : "text-mist-200"}`}
                        >
                          {total.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Ranking</div>
            <div className="mt-2 space-y-2">
              {order.map((r, i) => (
                <div key={r.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11.5px] text-mist-200">
                      <span className="mr-1.5 font-mono text-mist-400">{i + 1}.</span>
                      Option {r.code} — {r.short}
                    </span>
                    <span className="font-mono text-[11.5px] text-teal-300">{r.total.toFixed(2)}</span>
                  </div>
                  <div className="mt-1">
                    <Bar value={r.total} max={5} tone={i === 0 ? "teal" : "amber"} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-mist-400">
              Scores are 1–5 with the reasoning shown per option below. {isInternal
                ? "The capital-cost row is included at 10 % weight."
                : "The capital-cost row is not shown in the client view; the remaining weights are renormalised, so the ranking reflects technical merit only."}
            </p>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* per option detail                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">3 · Option detail</h3>
        <div className="flex flex-wrap gap-1">
          {optionComparisons.map((o) => (
            <button
              key={o.id}
              onClick={() => setDetail(o.id)}
              className={`rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                detail === o.id
                  ? "border-teal-500 bg-teal-500/15 text-teal-300"
                  : "border-line bg-ink-950/60 text-mist-400 hover:text-mist-200"
              }`}
            >
              Option {o.code} · {o.short}
            </button>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[current.id]}>Option {current.code}</Badge>
            {current.recommended && <Badge tone="green">Recommended</Badge>}
            {!current.river_compliant && <Badge tone="rust">River limits not met</Badge>}
            {current.reuse_compliant && <Badge tone="teal">Reuse limits met</Badge>}
          </div>
          <h4 className="mt-2 text-[14px] font-semibold text-mist-100">{current.name}</h4>
          <p className="mt-1 max-w-4xl text-[11.5px] leading-relaxed text-mist-400">{current.basis}</p>
          <p className="mt-1.5 max-w-4xl text-[11.5px] leading-relaxed text-mist-300">
            <span className="text-mist-400">Disposition: </span>
            {current.disposition}
          </p>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Treatment train</div>
              <ol className="mt-1.5 space-y-1.5">
                {current.train.map((s, i) => (
                  <li key={s.stage} className="flex gap-2">
                    <span className="mt-[1px] font-mono text-[10px] text-teal-400">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-[11.5px] text-mist-200">{s.stage}</div>
                      <div className="text-[10.5px] leading-relaxed text-mist-400">{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Performance</div>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[
                    ["Recovery", `${current.recovery_pct} %`],
                    ["Reused water", `${nf(current.reuse_m3h, 0)} m³/h`],
                    ["To the river", `${nf(current.discharge_m3h, 0)} m³/h`],
                    ["To the pond", `${nf(current.pond_m3h, 0)} m³/h`],
                    ["Brine to the refinery", `${nf(current.brine_m3h, 0)} m³/h`],
                    ["Chloride", current.chloride_mgL === null ? "—" : `${nf(current.chloride_mgL, 0)} mg/L`],
                    ["Sulphate", current.sulphate_mgL === null ? "—" : `${nf(current.sulphate_mgL, 0)} mg/L`],
                    ["Salt", current.salt_t_d > 0 ? `${nf(current.salt_t_d, 1)} t/d` : "None"],
                    ["Plant demand", fmtMW(current.power_kW)],
                    ["Land", fmtLand(current.land_m2)],
                    ["Plot basis", current.land_basis],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded border border-line bg-ink-900/50 px-2 py-1.5">
                      <div className="text-[9.5px] uppercase tracking-[0.1em] text-mist-400">{k}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-mist-200">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {isInternal ? (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Commercial</div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2" data-commercial>
                    {[
                      ["Capital cost", money(current.capex)],
                      ["Per m³/h of capacity", usd(current.perCapacity)],
                      ["Operating cost, per year", money(current.opex)],
                      ["20-year life-cycle", money(current.lcc)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded border border-line bg-ink-900/50 px-2 py-1.5">
                        <div className="text-[9.5px] uppercase tracking-[0.1em] text-mist-400">{k}</div>
                        <div className="mt-0.5 font-mono text-[12px] text-teal-300">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Callout title="Commercial" tone="teal">
                  Capital, operating and life-cycle cost for this option are in the internal view only.
                </Callout>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">
              Why it scores what it scores
            </div>
            <div className="mt-1.5 space-y-1">
              {current.scores
                .filter((s) => isInternal || s.criterion !== "Capital cost")
                .map((s) => (
                  <div key={s.criterion} className="flex gap-2 border-b border-line/50 pb-1 text-[10.5px]">
                    <span className="w-[210px] shrink-0 text-mist-300">{s.criterion}</span>
                    <span className="w-8 shrink-0 font-mono text-teal-300">{s.score}/5</span>
                    <span className="text-mist-400">{s.note}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Risks and open items</div>
            <ul className="mt-1.5 space-y-1">
              {current.risks.map((r) => (
                <li key={r} className="flex gap-1.5 text-[10.5px] leading-relaxed text-mist-400">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-amber-l" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* commercial comparison                                             */}
      {/* ---------------------------------------------------------------- */}
      {isInternal ? (
        <section className="space-y-2" data-commercial>
          <h3 className="text-[12.5px] font-semibold text-mist-200">4 · Commercial comparison — internal view</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">
                Capital cost, AACE Class 4 (±25 %)
              </div>
              <div className="mt-2 space-y-2">
                {optionComparisons.map((o) => (
                  <div key={o.id}>
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className={o.recommended ? "text-emerald-300" : "text-mist-300"}>
                        Option {o.code} — {o.short}
                      </span>
                      <span className="font-mono text-mist-200">
                        {money(o.capex)}{" "}
                        <span className="text-[10px] text-mist-400">({usd(o.perCapacity)} per m³/h)</span>
                      </span>
                    </div>
                    <div className="mt-1">
                      <Bar value={o.capex} max={maxCapex} tone={o.id === "opt1" ? "amber" : "teal"} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">
                Operating cost per year and 20-year life-cycle
              </div>
              <div className="mt-2 space-y-2">
                {optionComparisons.map((o) => (
                  <div key={o.id}>
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className={o.recommended ? "text-emerald-300" : "text-mist-300"}>
                        Option {o.code} — {o.short}
                      </span>
                      <span className="font-mono text-mist-200">
                        {money(o.opex)}/yr <span className="text-[10px] text-mist-400">· LCC {money(o.lcc)}</span>
                      </span>
                    </div>
                    <div className="mt-1">
                      <Bar value={o.opex} max={maxOpex} tone={o.id === "opt3" ? "rust" : "amber"} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-mist-400">
                Life-cycle uses a {PV_FACTOR.toFixed(2)} present-value factor (20 years at 8 %). Option 1 is the
                cheapest and cannot be permitted as designed.
              </p>
            </Card>
          </div>

          <Card className="p-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">
              Option 2R against the alternatives
            </div>
            <div className="scroll-x mt-2">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Comparison</th>
                    <th className="text-right">Capital</th>
                    <th className="text-right">Operating, per year</th>
                    <th className="text-right">20-year life-cycle</th>
                    <th>Reading</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "2R vs Option 2 (pond)",
                      capex: commercialDelta.capexVsPond,
                      opex: commercialDelta.opexVsPond,
                      lcc: commercialDelta.lccVsPond,
                      note: `Drops the ${P.evaporation.areaWithFreeboard_ha} ha pond and the land it occupies; the life-cycle is ${commercialDelta.lccVsPond < 0 ? "lower" : "higher"} even before the land is valued.`,
                    },
                    {
                      label: "2R vs Option 3 (ZLD)",
                      capex: commercialDelta.capexVsZld,
                      opex: commercialDelta.opexVsZld,
                      lcc: commercialDelta.lccVsZld,
                      note: "Avoids the crystalliser and the salt-handling plant; the brine leaves the plot instead of becoming solid waste.",
                    },
                  ].map((r) => (
                    <tr key={r.label}>
                      <td className="min-w-[170px] text-mist-300">{r.label}</td>
                      <td className={`num text-right ${r.capex <= 0 ? "text-emerald-300" : "text-rust"}`}>
                        {r.capex <= 0 ? "−" : "+"}
                        {money(Math.abs(r.capex))}
                      </td>
                      <td className={`num text-right ${r.opex <= 0 ? "text-emerald-300" : "text-rust"}`}>
                        {r.opex <= 0 ? "−" : "+"}
                        {money(Math.abs(r.opex))}
                      </td>
                      <td className={`num text-right ${r.lcc <= 0 ? "text-emerald-300" : "text-rust"}`}>
                        {r.lcc <= 0 ? "−" : "+"}
                        {money(Math.abs(r.lcc))}
                      </td>
                      <td className="min-w-[260px] text-[10.5px] leading-relaxed text-mist-400">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ) : (
        <section className="space-y-2">
          <h3 className="text-[12.5px] font-semibold text-mist-200">4 · Commercial comparison</h3>
          <Callout title="Commercial content withheld" tone="teal">
            Capital cost, operating cost, life-cycle cost and the comparison against the alternatives are part of the
            internal dossier. The technical comparison above is complete and is what the option decision is based on.
          </Callout>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* recommendation                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">5 · Recommendation</h3>
        <Card className="border-emerald-500/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">Option 2R</Badge>
            <span className="text-[13px] font-semibold text-mist-100">RO reuse with an MVR brine concentrator</span>
          </div>
          <div className="mt-2 space-y-2 text-[11.5px] leading-relaxed text-mist-400">
            <p>
              Option 1 cannot be permitted: the blended feed carries {nf(optionComparisons[0].chloride_mgL ?? 0, 0)} mg/L
              chloride and {nf(optionComparisons[0].sulphate_mgL ?? 0, 0)} mg/L sulphate against river limits of 600 and
              400 mg/L, and no biological train removes them. Option 2 meets
              the limits but needs {P.evaporation.areaWithFreeboard_ha} ha of lined pond against a plot U9 of{" "}
              {haWithSqm(plotArea_m2 / 10_000)} — it cannot be built inside the battery limit, and the pond remains a
              permanent seepage liability. Option 3 meets every limit and removes the pond, but it carries the
              crystalliser, the salt-disposal route and the largest electrical load in the package.
            </p>
            <p>
              Option 2R keeps the RO reuse of Option 2 and replaces the pond with an MVR concentrator that recovers{" "}
              {nf(P.evaporation.reject_m3h * 0.8, 0)} m³/h of the {nf(P.evaporation.reject_m3h, 0)} m³/h reject as
              distillate, leaving about {nf(P.evaporation.reject_m3h * 0.2, 0)} m³/h of brine to the refinery brine
              system. Water recovery is {recommendedOption.recovery_pct} %, the disposal plot falls from{" "}
              {P.evaporation.areaWithFreeboard_ha} ha to {fmtLand(recommendedOption.land_m2)}, and the electrical
              addition is {nf(recommendedOption.incremental_kW / 1000, 2)} MW against{" "}
              {nf((optionComparisons.find((o) => o.id === "opt3")!.incremental_kW) / 1000, 2)} MW for ZLD.
            </p>
            <p className="text-mist-300">
              The recommendation is conditional on three things, all of them commercial or interface items rather than
              process risk:
            </p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>
                MRC accepts the brine transfer interface — {nf(P.evaporation.reject_m3h * 0.2, 0)} m³/h at about 25 %
                TDS into the refinery brine system, with the composition and materials agreed.
              </li>
              <li>
                The concentrator antiscalant regime is proven on this water in the pilot, because sulphate and silica
                set the achievable concentration factor.
              </li>
              <li>
                The reuse limits in RFQ §9 are confirmed against the raw-water RO inlet, so the permeate and distillate
                can actually be taken.
              </li>
            </ol>
            {isInternal && (
              <p data-commercial>
                On the current estimate the recommended option is {money(recommendedOption.capex)} of capital and{" "}
                {money(recommendedOption.opex)} per year of operating cost, with a {money(recommendedOption.lcc)}{" "}
                20-year life-cycle — the lowest of the two routes that meet the limits without a pond.
              </p>
            )}
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* basis & cautions                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">How this comparison is built</div>
          <ul className="mt-2 space-y-1.5 text-[10.5px] leading-relaxed text-mist-400">
            <li>
              Flows and qualities come from the process sheets (P-01 to P-19): {P.membrane.roRecovery * 100} % RO
              recovery, {nf(P.membrane.roPermeate, 0)} m³/h permeate, {nf(P.membrane.roReject, 0)} m³/h reject at{" "}
              {nf(P.membrane.concentrateTDS, 0)} mg/L.
            </li>
            <li>
              Pond area comes from the evaporation sheet: net evaporation {P.evaporation.netEvap_m_yr} m/yr on{" "}
              {nf(P.evaporation.annual_m3, 0)} m³/yr of reject, with 20 % freeboard.
            </li>
            <li>
              Thermal load comes from the ZLD sheet: {nf(P.zld.concentrator_kW, 0)} kW concentrator at 22 kWh/m³ and{" "}
              {nf(P.zld.crystalliser_kW, 0)} kW crystalliser; Option 2R carries 35 % of the concentrator load.
            </li>
            <li>
              Land is quoted in m² with the hectare equivalent in brackets; the thermal island allowance is 20 m² per
              m³/h of feed, the same basis used for the plot layout.
            </li>
            <li>
              Capital and operating cost come from the estimate model at AACE Class 4, fourth-quarter 2026 Gulf basis,
              and are only shown in the internal view.
            </li>
          </ul>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Open items that move the answer</div>
          <ul className="mt-2 space-y-1.5 text-[10.5px] leading-relaxed text-mist-400">
            <li>
              <span className="text-mist-300">Silica in the feed is not stated in the RFQ</span> (CL-009). It sets the RO
              recovery ceiling, and therefore the reject flow every option above is sized on.
            </li>
            <li>
              <span className="text-mist-300">River limits versus the blended feed</span> — chloride and sulphate cannot be
              met without desalination, so Option 1 stands only with an MRC deviation (CL-006).
            </li>
            <li>
              <span className="text-mist-300">Plot U9 allocation</span> — the pond needs {P.evaporation.areaWithFreeboard_ha} ha
              against {haWithSqm(plotArea_m2 / 10_000)} available; a pond site outside the plot would be a separate land
              action.
            </li>
            <li>
              <span className="text-mist-300">Salt classification and disposal</span> for Option 3 is still open with MRC;
              Option 2R avoids it entirely by keeping the brine liquid.
            </li>
            <li>
              <span className="text-mist-300">Brine system capacity</span> — MRC to confirm that the refinery brine system can
              take {nf(P.evaporation.reject_m3h * 0.2, 0)} m³/h before the recommendation is frozen.
            </li>
          </ul>
        </Card>
      </section>

      <p className="text-[10px] leading-relaxed text-mist-400">
        {project.rfqNo} · document set BOD-0001 Rev 1, BOD-0002 Rev 0, PP-BOD-0001 Rev A. Weighted scoring is an
        engineering judgement recorded so it can be challenged criterion by criterion, not a contractual ranking.
        Commercial figures are AACE Class 4 (±25 %) and are held to the internal view.
      </p>
    </div>
  );
}
