import { Card, Badge, SectionTitle, usd, Callout } from "@/components/ui";
import { avlCategories, avlRules, unlistedCategories } from "@/data/vendors";
import { equipment } from "@/data/equipment";

export const metadata = { title: "Procurement recommendations — B047 WWT" };

export default function ProcurementPage() {
  const governing = equipment.filter((e) => e.avl === "Governing");
  const nonGov = equipment.filter((e) => e.avl === "Non-governing");
  const unlisted = equipment.filter((e) => e.avl === "Not listed");

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Section 6" title="Seller recommendations">
        Two groups. The first is fixed: items the MRC approved vendor list marks as governing must be bought from
        the named vendors. The second is where engineering judgement is needed — every category the list does not
        cover, with a recommendation, a reason and the clause that permits it.
      </SectionTitle>

      {/* Rules */}
      <section>
        <SectionTitle eyebrow="Rules of the list" title="What the vendor list actually allows" />
        <div className="grid gap-3 lg:grid-cols-2">
          {avlRules.map((r) => (
            <Card key={r.rule} className="p-4">
              <div className="text-[12px] font-semibold text-mist-200">{r.rule}</div>
              <p className="mt-1.5 border-l-2 border-teal-500/40 pl-2 font-mono text-[10.5px] leading-relaxed text-teal-300/90">
                “{r.quote}”
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-mist-400">{r.application}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Governing list */}
      <section>
        <SectionTitle eyebrow="Locked" title="Governing vendors carried into the package" />
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Status</th>
                  <th>Approved vendors (head office)</th>
                  <th>Application note</th>
                </tr>
              </thead>
              <tbody>
                {avlCategories.map((c) => (
                  <tr key={c.equipment}>
                    <td className="min-w-[200px] text-mist-200">{c.equipment}</td>
                    <td>
                      <Badge tone={c.governing ? "amber" : "slate"}>{c.governing ? "Governing" : "Non-governing"}</Badge>
                      {c.confidence === "inferred" && (
                        <div className="mt-0.5 text-[9px] text-mist-400">mapping inferred</div>
                      )}
                    </td>
                    <td className="min-w-[380px]">
                      <div className="flex flex-wrap gap-1">
                        {c.vendors.map((v) => (
                          <span key={v.name} className="rounded border border-line bg-ink-850 px-1.5 py-0.5 text-[10px] text-mist-300">
                            {v.name} <span className="text-mist-400">· {v.hq}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="min-w-[260px] text-[10.5px] leading-relaxed text-mist-400">{c.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-2 text-[10.5px] leading-relaxed text-mist-400">
          The source table is a multi-column PDF that flattened into a single text run on extraction. Vendor-to-item
          attribution is certain where the item name is adjacent to the vendor block (marked “high” confidence) and
          must be re-verified against the native spreadsheet before a purchase order is placed (marked “inferred”).
        </p>
      </section>

      {/* Unlisted */}
      <section>
        <SectionTitle eyebrow="Engineering judgement" title="Categories the approved vendor list does not cover">
          {unlistedCategories.length} categories in this package have no vendor on the MRC list. Under the list&apos;s
          own non-listed clause the contractor selects these, and where a governing category has fewer than three
          approved vendors ABG may add vendors with MRC approval. Each recommendation below is written to be
          submitted for that approval.
        </SectionTitle>
        <div className="space-y-3">
          {unlistedCategories.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-teal-300">{u.id}</span>
                <span className="text-[13px] font-semibold text-mist-200">{u.equipment}</span>
                <Badge tone={u.avlStatus === "not listed" ? "rust" : "amber"}>{u.avlStatus}</Badge>
              </div>
              <p className="mt-2 max-w-4xl text-[11.5px] leading-relaxed text-mist-400">{u.why}</p>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-mist-400">Candidate vendors</div>
                  <div className="mt-1 space-y-1">
                    {u.proposed.map((p) => (
                      <div
                        key={p.name}
                        className={`flex flex-wrap items-baseline justify-between gap-2 rounded border px-2 py-1 ${
                          u.recommendation.includes(p.name.split(" ")[0])
                            ? "border-teal-500/40 bg-teal-500/5"
                            : "border-line/70 bg-ink-900/40"
                        }`}
                      >
                        <span className="text-[11px] text-mist-200">
                          {p.name} <span className="text-mist-400">· {p.hq}</span>
                        </span>
                        <span className="max-w-[62%] text-right text-[10px] text-mist-400">{p.strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded border border-teal-500/30 bg-teal-500/5 p-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-teal-300">Recommendation</div>
                    <div className="mt-0.5 text-[11.5px] font-semibold text-mist-200">{u.recommendation}</div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-mist-400">{u.reasoning}</p>
                  <p className="font-mono text-[10px] leading-relaxed text-mist-400">{u.approvalRoute}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Matrix */}
      <section>
        <SectionTitle eyebrow="Package matrix" title="Vendor position for every tag" />
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Item</th>
                  <th>AVL status</th>
                  <th>Recommended vendor</th>
                  <th className="text-right">Lead time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...governing, ...nonGov, ...unlisted].map((e) => (
                  <tr key={e.tag}>
                    <td className="whitespace-nowrap font-mono text-[10.5px] text-teal-300">{e.tag}</td>
                    <td className="min-w-[180px] text-mist-300">{e.description}</td>
                    <td>
                      <Badge tone={e.avl === "Governing" ? "amber" : e.avl === "Non-governing" ? "teal" : "slate"}>{e.avl}</Badge>
                    </td>
                    <td className="min-w-[220px] text-[10.5px] text-mist-300">{e.vendor}</td>
                    <td className="num">{e.leadWeeks} w</td>
                    <td className="min-w-[220px] text-[10.5px] text-mist-400">
                      {e.avl === "Governing"
                        ? "Issue enquiry to all governing vendors"
                        : e.avl === "Non-governing"
                          ? "Contractor selection — no MRC approval needed"
                          : "Seek MRC approval or record under the non-listed clause"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Callout title="Lead-time critical path" tone="rust">
          Four items set the package delivery date: RO racks (38 weeks), RO high-pressure pumps (40 weeks), aeration
          blowers (34 weeks) and — in Option 3 — the MVR concentrator (56 weeks) and crystalliser (60 weeks). In
          Option 3 the thermal package alone exceeds the rest of the schedule by five months and must be awarded at
          the same time as the process design, not after.
        </Callout>
        <Callout title="Local content" tone="teal">
          Imjamal is the only Iraq-based governing valve vendor and Al-Rookal the only inside-Iraq TPI option.
          Using both, plus RAMSIS fabrication in Bahrain, is the most defensible local-content position available
          within the governing list.
        </Callout>
      </section>

      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">Spend by vendor status</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {[
            { k: "Governing", rows: governing, tone: "amber" as const },
            { k: "Non-governing", rows: nonGov, tone: "teal" as const },
            { k: "Not listed", rows: unlisted, tone: "slate" as const },
          ].map((g) => {
            const v = g.rows.reduce((s, e) => s + e.cost_usd * e.qty, 0);
            return (
              <div key={g.k} className="rounded border border-line bg-ink-900/50 p-3">
                <div className="flex items-center justify-between">
                  <Badge tone={g.tone}>{g.k}</Badge>
                  <span className="font-mono text-[12px] text-mist-200">{usd(v)}</span>
                </div>
                <div className="mt-1 text-[10.5px] text-mist-400">{g.rows.length} tags</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
