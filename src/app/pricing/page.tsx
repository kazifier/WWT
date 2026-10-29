"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge, Callout, Card, SectionTitle, nf, usd } from "@/components/ui";
import { ExternalNote, useViewMode } from "@/components/view-mode";
import {
  ACTUATORS,
  DEFAULT_RATES,
  INSULATION_MATERIALS,
  RATE_SIZES,
  VALVE_TYPES,
  mergeRates,
  priceProject,
  type RateCard,
} from "@/lib/calc/manual-pricing";
import { pipingSummary, valveTotals } from "@/lib/piping";
import { insulationSummary } from "@/lib/insulation";

const KEY = "b047-manual-pricing-v1";

type NumKey =
  | "fittings_per_t"
  | "gasket_pct"
  | "bolt_pct"
  | "class600_factor"
  | "paint_per_m2"
  | "support_each"
  | "buy_freight_pct"
  | "buy_insurance_pct"
  | "buy_duty_pct"
  | "buy_handling_pct"
  | "make_transport_per_t"
  | "make_insurance_pct"
  | "make_handling_pct";

type MapKey = "pipe_per_m" | "flange_each" | "valve_each" | "actuator_adder" | "insulation_per_m2";

function RateInput({
  value,
  onChange,
  width = "w-[74px]",
}: {
  value: number;
  onChange: (v: number) => void;
  width?: string;
}) {
  return (
    <input
      type="number"
      min={0}
      step="any"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      className={`${width} rounded border border-line bg-ink-900 px-1.5 py-1 text-right font-mono text-[11px] text-mist-200 focus:border-teal-500 focus:outline-none`}
    />
  );
}

const TH = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <th data-commercial className={className}>
    {children}
  </th>
);

const TD = ({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) => (
  <td data-commercial className={`num ${className}`}>
    {children}
  </td>
);

export default function PricingPage() {
  const { isInternal } = useViewMode();
  const [rates, setRates] = useState<RateCard>(DEFAULT_RATES);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setRates(mergeRates(parsed.rates));
        if (parsed.overrides && typeof parsed.overrides === "object") setOverrides(parsed.overrides);
        if (typeof parsed.enabled === "boolean") setEnabled(parsed.enabled);
      }
    } catch {
      /* first visit — defaults stand */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ rates, overrides, enabled }));
    } catch {
      /* storage unavailable — the sheet still works for this session */
    }
  }, [rates, overrides, enabled, ready]);

  const numericOverrides = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(overrides)) {
      const n = parseFloat(v);
      if (Number.isFinite(n) && n > 0) out[k] = n;
    }
    return out;
  }, [overrides]);

  const p = useMemo(() => priceProject(rates, numericOverrides), [rates, numericOverrides]);

  const setNum = (k: NumKey, v: number) => setRates((prev) => ({ ...prev, [k]: v }));
  const setMap = (k: MapKey, key: string, v: number) =>
    setRates((prev) => ({ ...prev, [k]: { ...prev[k], [key]: v } }));

  const lineSum = (f: (l: (typeof p.lines)[number]) => number) => p.lines.reduce((a, l) => a + f(l), 0);

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Section 5A" title="Optional manual pricing">
        Every line item priced from the design quantity, at rates you can overwrite — pipe by the metre,
        fittings and pipe by the tonne, flanges, gaskets and bolts by the piece, valves by type and size,
        insulation and painting by the square metre. Purchases carry freight, insurance, customs duty and
        handling to Diwanya; Ramsis-made items carry the transport out of the Bahrain workshop.
        Rates live in this browser only, so a number you change here never alters the design or the AACE
        estimate — it is an independent check on them.
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`rounded border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${
            enabled
              ? "border-teal-500/50 bg-teal-500/15 text-teal-300"
              : "border-line bg-ink-900 text-mist-400 hover:text-mist-200"
          }`}
          aria-pressed={enabled}
        >
          Manual pricing: {enabled ? "on" : "off"}
        </button>
        <button
          type="button"
          data-commercial
          onClick={() => {
            setRates(DEFAULT_RATES);
            setOverrides({});
          }}
          className="rounded border border-line bg-ink-900 px-3 py-1.5 text-[11px] text-mist-400 transition-colors hover:text-mist-200"
        >
          Reset rates and overrides
        </button>
        <span className="font-mono text-[10.5px] text-mist-400">
          {p.lines.length} pipe lines · {valveTotals.qty} valves · {insulationSummary.items} insulated items
        </span>
      </div>

      {!isInternal && (
        <ExternalNote>
          This section prices the package. The client view keeps the quantities off it — switch to the
          internal view in the header to read the rate card and the priced schedules.
        </ExternalNote>
      )}

      <div data-view={enabled ? "internal" : "external"}>
        {/* ---------------------------------------------------------- */}
        {/* Rate card                                                   */}
        {/* ---------------------------------------------------------- */}
        <section data-commercial className="space-y-4">
          <SectionTitle eyebrow="Rate card" title="Unit rates — edit any cell">
            Supply basis, ex works or FCA, 4Q-2026 Gulf, USD. Pipe and fittings escalate with material;
            flanges and valves escalate with pressure class and material; valve price scales with size from
            the 4 in reference.
          </SectionTitle>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Pipe — USD/m (class 150, sch 40)</h3>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {RATE_SIZES.map((s) => (
                  <label key={s} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-mist-400">{s}&quot;</span>
                    <RateInput
                      value={rates.pipe_per_m[String(s)] ?? 0}
                      onChange={(v) => setMap("pipe_per_m", String(s), v)}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/70 pt-3">
                <label className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400">Fittings USD/t</span>
                  <RateInput value={rates.fittings_per_t} onChange={(v) => setNum("fittings_per_t", v)} />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400">Supports USD/ea</span>
                  <RateInput value={rates.support_each} onChange={(v) => setNum("support_each", v)} />
                </label>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Flanges — USD/ea (class 150, WN CS)</h3>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {RATE_SIZES.map((s) => (
                  <label key={s} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-mist-400">{s}&quot;</span>
                    <RateInput
                      value={rates.flange_each[String(s)] ?? 0}
                      onChange={(v) => setMap("flange_each", String(s), v)}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 border-t border-line/70 pt-3">
                <label className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400">Gasket %</span>
                  <RateInput value={rates.gasket_pct} onChange={(v) => setNum("gasket_pct", v)} />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400">Bolts %</span>
                  <RateInput value={rates.bolt_pct} onChange={(v) => setNum("bolt_pct", v)} />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400">Cls 600 ×</span>
                  <RateInput value={rates.class600_factor} onChange={(v) => setNum("class600_factor", v)} />
                </label>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Valves — USD/ea at 4 in, class 150</h3>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {VALVE_TYPES.map((t) => (
                  <label key={t} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] capitalize text-mist-400">{t}</span>
                    <RateInput
                      value={rates.valve_each[t] ?? 0}
                      onChange={(v) => setMap("valve_each", t, v)}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 border-t border-line/70 pt-3">
                <div className="mb-2 text-[10px] uppercase tracking-wide text-mist-400">Actuation adder</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {ACTUATORS.map((a) => (
                    <label key={a} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] capitalize text-mist-400">{a}</span>
                      <RateInput
                        value={rates.actuator_adder[a] ?? 0}
                        onChange={(v) => setMap("actuator_adder", a, v)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Services — USD/m²</h3>
              <div className="mt-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wide text-mist-400">
                  Insulation, supply and install with jacketing
                </div>
                {INSULATION_MATERIALS.map((m) => (
                  <label key={m} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-mist-400">{m}</span>
                    <RateInput
                      value={rates.insulation_per_m2[m] ?? 0}
                      onChange={(v) => setMap("insulation_per_m2", m, v)}
                    />
                  </label>
                ))}
                <label className="flex items-center justify-between gap-2 border-t border-line/70 pt-2">
                  <span className="text-[11px] text-mist-400">Painting — Sa 2.5 + QC-SPC-001</span>
                  <RateInput value={rates.paint_per_m2} onChange={(v) => setNum("paint_per_m2", v)} />
                </label>
              </div>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">
                Bought-out items — vendor works to site
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {(
                  [
                    ["Sea freight %", "buy_freight_pct"],
                    ["Insurance %", "buy_insurance_pct"],
                    ["Customs duty %", "buy_duty_pct"],
                    ["Handling %", "buy_handling_pct"],
                  ] as [string, NumKey][]
                ).map(([label, k]) => (
                  <label key={k} className="flex flex-col gap-1">
                    <span className="text-[10.5px] text-mist-400">{label}</span>
                    <RateInput width="w-full" value={rates[k]} onChange={(v) => setNum(k, v)} />
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">
                Ramsis-made items — Bahrain workshop to Diwanya
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2">
                {(
                  [
                    ["Transport USD/t", "make_transport_per_t"],
                    ["Insurance %", "make_insurance_pct"],
                    ["Site handling %", "make_handling_pct"],
                  ] as [string, NumKey][]
                ).map(([label, k]) => (
                  <label key={k} className="flex flex-col gap-1">
                    <span className="text-[10.5px] text-mist-400">{label}</span>
                    <RateInput width="w-full" value={rates[k]} onChange={(v) => setNum(k, v)} />
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[10.5px] leading-relaxed text-mist-400">
                Transport covers sea freight Bahrain → Umm Qasr and the inland leg to Diwanya, by weight of
                fabricated steel. Customs duty on Ramsis supply is assumed nil as contractor-furnished plant
                under the RFQ delivery terms.
              </p>
            </Card>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Piping — line by line                                       */}
        {/* ---------------------------------------------------------- */}
        <section className="space-y-4">
          <SectionTitle eyebrow="Piping" title="Priced line list">
            Each line is priced from its own wall thickness, material and pressure class. Enter a figure in
            the override column to price a line as a whole — the manual total then travels through the same
            freight, insurance, duty and handling chain as any bought material.
          </SectionTitle>

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
                    <TH className="text-right">Pipe $/m</TH>
                    <TH className="text-right">Pipe</TH>
                    <TH className="text-right">Fittings</TH>
                    <TH className="text-right">Flanges</TH>
                    <TH className="text-right">Gaskets &amp; bolts</TH>
                    <TH className="text-right">Valves</TH>
                    <TH className="text-right">Insulation</TH>
                    <TH className="text-right">Painting</TH>
                    <TH className="text-right">Supports</TH>
                    <TH className="text-right">Calculated</TH>
                    <TH className="text-right">Manual override</TH>
                    <TH className="text-right">Line total</TH>
                  </tr>
                </thead>
                <tbody>
                  {p.lines.map((l) => (
                    <tr key={l.lineNo}>
                      <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{l.lineNo}</td>
                      <td className="min-w-[180px] text-mist-300">{l.service}</td>
                      <td>
                        <Badge tone="slate">{l.pipeClass}</Badge>
                      </td>
                      <td className="num">{l.nps}&quot;</td>
                      <td className="num">{nf(l.length_m, 0)}</td>
                      <TD>{usd(l.pipe_rate)}</TD>
                      <TD>{usd(l.amounts.pipe)}</TD>
                      <TD>{usd(l.amounts.fittings)}</TD>
                      <TD>{usd(l.amounts.flanges)}</TD>
                      <TD>{usd(l.amounts.joints)}</TD>
                      <TD>{usd(l.amounts.valves)}</TD>
                      <TD>{usd(l.amounts.insulation)}</TD>
                      <TD>{usd(l.amounts.paint)}</TD>
                      <TD>{usd(l.amounts.supports)}</TD>
                      <TD className="text-mist-400">{usd(l.supply)}</TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="auto"
                            value={overrides[l.lineNo] ?? ""}
                            onChange={(e) =>
                              setOverrides((prev) => ({ ...prev, [l.lineNo]: e.target.value }))
                            }
                            className="w-[92px] rounded border border-line bg-ink-900 px-1.5 py-1 text-right font-mono text-[11px] text-amber-l placeholder:text-mist-400/60 focus:border-teal-500 focus:outline-none"
                          />
                          {overrides[l.lineNo] && (
                            <button
                              type="button"
                              title="Clear override and return to the calculated price"
                              onClick={() =>
                                setOverrides((prev) => {
                                  const next = { ...prev };
                                  delete next[l.lineNo];
                                  return next;
                                })
                              }
                              className="rounded border border-line px-1 text-[11px] text-mist-400 hover:text-rust"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </TD>
                      <TD className="font-semibold text-teal-300">
                        {usd(l.total)}
                        {l.override != null && (
                          <span className="ml-1 rounded bg-amber-l/15 px-1 text-[9px] text-amber-l">manual</span>
                        )}
                      </TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right text-[11px] text-mist-400">
                      Total
                    </td>
                    <td className="num text-mist-200">{nf(pipingSummary.length_m, 0)}</td>
                    <td />
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.pipe))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.fittings))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.flanges))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.joints))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.valves))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.insulation))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.paint))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(lineSum((l) => l.amounts.supports))}</TD>
                    <TD className="text-mist-400">{usd(lineSum((l) => l.supply))}</TD>
                    <td />
                    <TD className="font-semibold text-teal-300">{usd(p.bulk.supply)}</TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-line px-4 py-2.5">
                <h3 className="text-[12.5px] font-semibold text-mist-200">Valve schedule priced</h3>
              </div>
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Actuated</th>
                    <TH className="text-right">Avg USD/ea</TH>
                    <TH className="text-right">Value</TH>
                  </tr>
                </thead>
                <tbody>
                  {p.valveRows.map((v) => (
                    <tr key={v.type}>
                      <td className="capitalize text-mist-300">{v.type}</td>
                      <td className="num font-semibold text-mist-200">{v.qty}</td>
                      <td className="num">{v.actuated}</td>
                      <TD>{usd(v.unit_avg)}</TD>
                      <TD className="font-semibold text-mist-200">{usd(v.amount)}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="text-[11px] text-mist-400">Total</td>
                    <td className="num font-semibold text-teal-300">{valveTotals.qty}</td>
                    <td className="num text-mist-200">{valveTotals.actuated}</td>
                    <td />
                    <TD className="font-semibold text-teal-300">
                      {usd(p.valveRows.reduce((a, v) => a + v.amount, 0))}
                    </TD>
                  </tr>
                </tfoot>
              </table>
            </Card>

            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Bulk material landed at Diwanya</h3>
              <div className="mt-3 space-y-1.5">
                {[
                  ["Pipe, fittings, flanges, joints, valves, supports", p.bulk.supply],
                  [`Sea freight (${nf(rates.buy_freight_pct, 2)} %)`, p.bulk.freight],
                  [`Marine insurance (${nf(rates.buy_insurance_pct, 2)} %)`, p.bulk.insurance],
                  [`Customs duty (${nf(rates.buy_duty_pct, 2)} %)`, p.bulk.duty],
                  [`Inland handling (${nf(rates.buy_handling_pct, 2)} %)`, p.bulk.handling],
                ].map(([k, v]) => (
                  <div
                    key={String(k)}
                    data-commercial
                    className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5"
                  >
                    <span className="text-[11px] text-mist-400">{k}</span>
                    <span className="font-mono text-[11px] text-mist-200">{usd(Number(v))}</span>
                  </div>
                ))}
                <div data-commercial className="flex items-baseline justify-between gap-3 pt-1.5">
                  <span className="text-[11.5px] font-semibold text-mist-200">Delivered bulk materials</span>
                  <span className="font-mono text-[13px] font-semibold text-teal-300">{usd(p.bulk.landed)}</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Services                                                    */}
        {/* ---------------------------------------------------------- */}
        <section className="space-y-4">
          <SectionTitle eyebrow="Services" title="Insulation and painting, priced per m²" />

          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
                <h3 className="text-[12.5px] font-semibold text-mist-200">Insulation service</h3>
                <span className="font-mono text-[10px] text-mist-400">
                  {nf(insulationSummary.area_m2, 0)} m² bare area
                </span>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th>Tag</th>
                      <th>Host</th>
                      <th>Material</th>
                      <th className="text-right">Temp °C</th>
                      <th className="text-right">Thk mm</th>
                      <th className="text-right">Area m²</th>
                      <TH className="text-right">USD/m²</TH>
                      <TH className="text-right">Amount</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {p.insulation.map((r) => (
                      <tr key={r.tag}>
                        <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{r.tag}</td>
                        <td className="font-mono text-[10px] text-mist-400">{r.host}</td>
                        <td className="text-mist-300">{r.material}</td>
                        <td className="num">{r.temp_C}</td>
                        <td className="num">{r.thickness_mm}</td>
                        <td className="num text-mist-200">{nf(r.area_m2, 1)}</td>
                        <TD>{usd(r.rate)}</TD>
                        <TD className="font-semibold text-mist-200">{usd(r.amount)}</TD>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-right text-[11px] text-mist-400">
                        Total
                      </td>
                      <td className="num text-mist-200">{nf(insulationSummary.area_m2, 1)}</td>
                      <td />
                      <TD className="font-semibold text-teal-300">{usd(p.totals.insulation)}</TD>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-[12.5px] font-semibold text-mist-200">Painting service — QC-SPC-001</h3>
              <div className="mt-3 space-y-1.5">
                {p.paintGroups.map((g) => (
                  <div
                    key={g.label}
                    data-commercial
                    className="border-b border-line/60 pb-1.5 last:border-0"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={`text-[11px] ${g.memo ? "text-mist-400/70" : "text-mist-400"}`}>
                        {g.label}
                        {g.memo && <span className="ml-1 text-[9px] uppercase text-amber-l">memo</span>}
                      </span>
                      <span className="font-mono text-[11px] text-mist-200">{usd(g.amount)}</span>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between gap-3">
                      <span className="text-[10px] text-mist-400/80">{g.basis}</span>
                      <span className="font-mono text-[10px] text-mist-400">{nf(g.area_m2, 0)} m²</span>
                    </div>
                  </div>
                ))}
              </div>
              <div data-commercial className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-2">
                <span className="text-[11.5px] font-semibold text-mist-200">Painting service total</span>
                <span className="font-mono text-[13px] font-semibold text-teal-300">{usd(p.totals.paint)}</span>
              </div>
              <p className="mt-3 text-[10.5px] leading-relaxed text-mist-400">
                Equipment and structural coating is shown as a memo: it is already inside the direct workshop
                cost on the MTO sheet, and pricing it again here would double count it. Jacketed surfaces are
                painted on the jacketing only.
              </p>
            </Card>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Equipment: bought vs made                                   */}
        {/* ---------------------------------------------------------- */}
        <section className="space-y-4">
          <SectionTitle eyebrow="Equipment" title="Bought-out items and Bahrain-made items, carried to site" />

          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-2.5">
              <h3 className="text-[12.5px] font-semibold text-mist-200">
                Bought-out — supply, shipping and customs
              </h3>
            </div>
            <div className="scroll-x">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">t</th>
                    <TH className="text-right">Supply</TH>
                    <TH className="text-right">Freight</TH>
                    <TH className="text-right">Insurance</TH>
                    <TH className="text-right">Duty</TH>
                    <TH className="text-right">Handling</TH>
                    <TH className="text-right">Delivered</TH>
                  </tr>
                </thead>
                <tbody>
                  {p.bought.map((b) => (
                    <tr key={b.tag}>
                      <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{b.tag}</td>
                      <td className="min-w-[210px] text-mist-300">{b.description}</td>
                      <td className="text-[10.5px] text-mist-400">{b.vendor}</td>
                      <td className="num">{b.qty}</td>
                      <td className="num">{nf(b.tonnes, 1)}</td>
                      <TD>{usd(b.landers.supply)}</TD>
                      <TD className="text-mist-400">{usd(b.landers.freight)}</TD>
                      <TD className="text-mist-400">{usd(b.landers.insurance)}</TD>
                      <TD className="text-mist-400">{usd(b.landers.duty)}</TD>
                      <TD className="text-mist-400">{usd(b.landers.handling)}</TD>
                      <TD className="font-semibold text-teal-300">{usd(b.landers.landed)}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="text-right text-[11px] text-mist-400">
                      {p.bought.length} bought-out items
                    </td>
                    <TD className="font-semibold text-mist-200">
                      {usd(p.bought.reduce((a, b) => a + b.landers.supply, 0))}
                    </TD>
                    <TD className="text-mist-200">{usd(p.bought.reduce((a, b) => a + b.landers.freight, 0))}</TD>
                    <TD className="text-mist-200">
                      {usd(p.bought.reduce((a, b) => a + b.landers.insurance, 0))}
                    </TD>
                    <TD className="text-mist-200">{usd(p.bought.reduce((a, b) => a + b.landers.duty, 0))}</TD>
                    <TD className="text-mist-200">{usd(p.bought.reduce((a, b) => a + b.landers.handling, 0))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(p.totals.bought)}</TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-2.5">
              <h3 className="text-[12.5px] font-semibold text-mist-200">
                Made in Bahrain — workshop cost plus transport to Diwanya
              </h3>
            </div>
            <div className="scroll-x">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Description</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">t</th>
                    <TH className="text-right">Workshop</TH>
                    <TH className="text-right">Transport</TH>
                    <TH className="text-right">Insurance</TH>
                    <TH className="text-right">Handling</TH>
                    <TH className="text-right">Delivered</TH>
                  </tr>
                </thead>
                <tbody>
                  {p.made.map((m) => (
                    <tr key={m.tag}>
                      <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{m.tag}</td>
                      <td className="min-w-[210px] text-mist-300">{m.description}</td>
                      <td className="num">{m.qty}</td>
                      <td className="num">{nf(m.tonnes, 1)}</td>
                      <TD>{usd(m.landed.workshop)}</TD>
                      <TD className="text-mist-400">{usd(m.landed.transport)}</TD>
                      <TD className="text-mist-400">{usd(m.landed.insurance)}</TD>
                      <TD className="text-mist-400">{usd(m.landed.handling)}</TD>
                      <TD className="font-semibold text-teal-300">{usd(m.landed.delivered)}</TD>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right text-[11px] text-mist-400">
                      {p.made.length} fabricated items
                    </td>
                    <td className="num text-mist-200">{nf(p.made.reduce((a, m) => a + m.tonnes, 0), 1)}</td>
                    <TD className="font-semibold text-mist-200">
                      {usd(p.made.reduce((a, m) => a + m.landed.workshop, 0))}
                    </TD>
                    <TD className="text-mist-200">{usd(p.made.reduce((a, m) => a + m.landed.transport, 0))}</TD>
                    <TD className="text-mist-200">{usd(p.made.reduce((a, m) => a + m.landed.insurance, 0))}</TD>
                    <TD className="text-mist-200">{usd(p.made.reduce((a, m) => a + m.landed.handling, 0))}</TD>
                    <TD className="font-semibold text-teal-300">{usd(p.totals.made)}</TD>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Summary                                                     */}
        {/* ---------------------------------------------------------- */}
        <section className="space-y-4">
          <SectionTitle eyebrow="Summary" title="Manual pricing roll-up" />
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card className="p-4">
              <div className="space-y-1.5">
                {[
                  ["Bulk piping materials, delivered", p.totals.bulkSupply],
                  ["Insulation service", p.totals.insulation],
                  ["Painting service", p.totals.paint],
                  ["Bought-out equipment, delivered", p.totals.bought],
                  ["Bahrain-made equipment, delivered", p.totals.made],
                ].map(([k, v]) => (
                  <div
                    key={String(k)}
                    data-commercial
                    className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5"
                  >
                    <span className="text-[11.5px] text-mist-400">{k}</span>
                    <span className="font-mono text-[12px] text-mist-200">{usd(Number(v))}</span>
                  </div>
                ))}
                <div data-commercial className="flex items-baseline justify-between gap-3 pt-2">
                  <span className="text-[12.5px] font-semibold text-mist-200">Total, manual pricing</span>
                  <span className="font-mono text-[16px] font-semibold text-teal-300">
                    {usd(p.totals.grand)}
                  </span>
                </div>
              </div>
            </Card>

            <Callout title="How to read this sheet" tone="teal">
              The manual pricing sheet is deliberately kept out of the AACE estimate. The estimate prices the
              package from percentage factors at ±25 %; this sheet prices it from quantities at whatever rates
              you enter. It covers materials, services and equipment transport only — civil works, erection,
              engineering and contingency live in the estimate, so the two totals are not comparable line for
              line. Where the two agree, the estimate is safe; where they diverge, the line item that diverged
              is the one to re-quote. Overridden lines are marked <b>manual</b> and keep their own total through
              the freight, duty and handling chain.
            </Callout>
          </div>
        </section>
      </div>
    </div>
  );
}
