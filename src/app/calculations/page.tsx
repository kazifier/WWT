"use client";

import { useMemo, useState } from "react";
import { Card, Badge, SectionTitle, Check } from "@/components/ui";
import { process as P } from "@/lib/calc/process";
import { mechanicalSheets } from "@/lib/calc/mechanical";
import { bulkSheets } from "@/lib/calc/bulk";
import type { CalcSheet } from "@/lib/calc/types";

const allSheets: CalcSheet[] = [...P.sheets, ...mechanicalSheets, ...bulkSheets];
const disciplines = [
  "All",
  "Process",
  "Mechanical",
  "Rotating",
  "Piping",
  "Instruments",
  "Electrical",
  "Insulation",
  "Structural",
  "Civil",
];

export default function CalculationsPage() {
  const [discipline, setDiscipline] = useState("All");
  const [open, setOpen] = useState<string[]>([allSheets[0].id]);
  const [failedOnly, setFailedOnly] = useState(false);

  const sheets = useMemo(
    () =>
      allSheets
        .filter((s) => discipline === "All" || s.discipline === discipline)
        .filter((s) => !failedOnly || s.checks.some((c) => !c.pass)),
    [discipline, failedOnly],
  );

  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const totalChecks = allSheets.reduce((a, s) => a + s.checks.length, 0);
  const failed = allSheets.reduce((a, s) => a + s.checks.filter((c) => !c.pass).length, 0);

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Section 2" title="Design calculations">
        Every sheet shows the formula, the substitution and the result, then checks the result against the clause
        that requires it. {allSheets.length} sheets · {totalChecks} compliance checks · {failed} open item
        {failed === 1 ? "" : "s"}.
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        {disciplines.map((d) => (
          <button
            key={d}
            onClick={() => setDiscipline(d)}
            className={`rounded border px-2.5 py-1 text-[11px] transition-colors ${
              discipline === d
                ? "border-teal-500/60 bg-teal-500/10 text-teal-300"
                : "border-ink-600 text-mist-400 hover:text-mist-200"
            }`}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setFailedOnly((v) => !v)}
          className={`ml-auto rounded border px-2.5 py-1 text-[11px] transition-colors ${
            failedOnly ? "border-rust/60 bg-rust/10 text-rust" : "border-ink-600 text-mist-400 hover:text-mist-200"
          }`}
        >
          Show non-compliant only
        </button>
        <button
          onClick={() => setOpen(open.length === sheets.length ? [] : sheets.map((s) => s.id))}
          className="rounded border border-ink-600 px-2.5 py-1 text-[11px] text-mist-400 hover:text-mist-200"
        >
          {open.length === sheets.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] text-mist-400">
          <span className="uppercase tracking-[0.12em]">Coverage</span>
          {[
            ["Process", "treatment train"],
            ["Mechanical", "vessels, tanks, exchangers"],
            ["Rotating", "pumps, mixers, blowers, compressors"],
            ["Piping", "line sizing, wall thickness, valves, hydrotest"],
            ["Instruments", "I/O count and SIL"],
            ["Electrical", "motors, cables, trays, transformer"],
            ["Insulation", "heat loss and cladding"],
            ["Structural", "piperacks and supports"],
          ].map(([d, what]) => (
            <span key={d} className="flex items-baseline gap-1">
              <span className="font-mono text-teal-300">{allSheets.filter((s) => s.discipline === d).length}</span>
              <span className="text-mist-300">{d}</span>
              <span className="text-mist-400/80">({what})</span>
            </span>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {sheets.map((s) => {
          const isOpen = open.includes(s.id);
          const fails = s.checks.filter((c) => !c.pass).length;
          return (
            <Card key={s.id} className="overflow-hidden">
              <button onClick={() => toggle(s.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="font-mono text-[11px] text-teal-300">{s.id}</span>
                <span className="flex-1 text-[12.5px] font-medium text-mist-200">{s.title}</span>
                <Badge tone="slate">{s.discipline}</Badge>
                <Badge tone={fails ? "rust" : "green"}>{fails ? `${fails} open` : "compliant"}</Badge>
                <span className="font-mono text-[10px] text-mist-400">{s.clause}</span>
                <span className="text-mist-400">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-line px-4 py-4">
                  <p className="max-w-4xl text-[12px] leading-relaxed text-mist-400">{s.intent}</p>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.3fr_1fr]">
                    {/* Inputs */}
                    <div>
                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Inputs</div>
                      <div className="space-y-1">
                        {s.inputs.map((i) => (
                          <div key={i.label} className="flex items-baseline justify-between gap-2 border-b border-line/50 pb-1">
                            <span className="text-[10.5px] text-mist-400">{i.label}</span>
                            <span className="whitespace-nowrap font-mono text-[10.5px] text-mist-200">
                              {i.value} <span className="text-mist-400">{i.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div>
                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">
                        Calculation
                      </div>
                      <div className="space-y-2">
                        {s.steps.map((st, i) => (
                          <div key={i} className="rounded border border-line/70 bg-ink-900/60 px-2.5 py-1.5">
                            <div className="text-[10.5px] text-mist-300">{st.label}</div>
                            <div className="mt-0.5 font-mono text-[10.5px] text-teal-300/90">{st.formula}</div>
                            {st.substitution && (
                              <div className="font-mono text-[10px] text-mist-400">= {st.substitution}</div>
                            )}
                            <div className="mt-0.5 font-mono text-[11px] text-mist-200">= {st.result}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Results + checks */}
                    <div>
                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Results</div>
                      <div className="space-y-1">
                        {s.results.slice(0, 8).map((r) => (
                          <div key={r.label} className="flex items-baseline justify-between gap-2 border-b border-line/50 pb-1">
                            <span className="text-[10.5px] text-mist-400">{r.label}</span>
                            <span className="text-right font-mono text-[10.5px] text-mist-200">
                              {r.value} <span className="text-mist-400">{r.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                      {s.checks.length > 0 && (
                        <>
                          <div className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">
                            Compliance
                          </div>
                          <div className="space-y-1">
                            {s.checks.slice(0, 8).map((c, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10.5px]">
                                <Check pass={c.pass} />
                                <div className="flex-1">
                                  <div className="text-mist-300">{c.label}</div>
                                  <div className="font-mono text-[10px] text-mist-400">
                                    req {c.required} · act {c.actual}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
