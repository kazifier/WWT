"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Card, SectionTitle, Badge, nf } from "@/components/ui";
import { process as P } from "@/lib/calc/process";
import {
  parts,
  plot,
  plotArea_m2,
  areaBlocks,
  equipmentFootprint_m2,
  blockAreaTotal_m2,
  foot,
  sqm,
  haWithSqm,
} from "@/lib/plantLayout";

const skeleton = (h: string) => (
  <div
    className="flex items-center justify-center rounded-lg border border-line bg-ink-900 text-[12px] text-mist-400"
    style={{ height: h }}
  >
    Loading drawing…
  </div>
);

const PlantModel = dynamic(() => import("@/components/PlantModel"), {
  ssr: false,
  loading: () => skeleton("620px"),
});

const PlanDrawing = dynamic(() => import("@/components/Plant2D").then((m) => m.PlanDrawing), {
  ssr: false,
  loading: () => skeleton("760px"),
});

const ElevationDrawing = dynamic(() => import("@/components/Plant2D").then((m) => m.ElevationDrawing), {
  ssr: false,
  loading: () => skeleton("470px"),
});

const EquipmentViewer = dynamic(() => import("@/components/EquipmentViewer"), {
  ssr: false,
  loading: () => skeleton("420px"),
});

function DrawingFrame({
  no,
  title,
  children,
}: {
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-mist-200">{title}</div>
        <div className="font-mono text-[10.5px] text-mist-400">
          {no} · Rev 0 · dimensions in metres · areas in square metres
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function ModelPage() {
  const [tag, setTag] = useState(parts[0].id);
  const item = useMemo(() => parts.find((p) => p.id === tag) ?? parts[0], [tag]);

  const groups = useMemo(() => {
    const codes = [...new Set(parts.map((p) => p.area))].sort();
    return codes.map((code) => ({ code, items: parts.filter((p) => p.area === code) }));
  }, []);

  const totalFootprint = parts.reduce((a, p) => a + foot(p), 0);
  const plotOccupancy = (totalFootprint / plotArea_m2) * 100;

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Section 8" title="Layout drawings and equipment models">
        The 3D plant model, the dimensioned 2D plan and elevation, and every individual equipment model are all
        generated from the same geometry, so a dimension change in one place moves every drawing at once. Areas
        are quoted in square metres throughout, with the hectare equivalent in brackets where the number is
        large enough to be read as land.
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="teal">
          Plot U9 · {plot.w} × {plot.d} m ({sqm(plotArea_m2)} = {haWithSqm(plotArea_m2 / 10_000, 2)})
        </Badge>
        <Badge tone="slate">Equipment footprint {sqm(totalFootprint, 1)}</Badge>
        <Badge tone="amber">{nf(plotOccupancy, 1)} % plot occupancy</Badge>
        <Badge tone="violet">{parts.length} items modelled · {parts.filter(p => p.makeBuy === 'make').length} make (RAMSIS) · {parts.filter(p => p.makeBuy === 'buy').length} buy (vendor) · Option 3 ZLD toggle</Badge>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* overall 3D                                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">
          1 · Overall 3D model — plot U9, {plot.w} × {plot.d} m ({sqm(plotArea_m2)})
        </h3>
        <p className="max-w-4xl text-[11.5px] leading-relaxed text-mist-400">
          Switch on <span className="text-amber-l">Dimensions</span> for per-item dimension lines (length, width,
          diameter and height in metres) plus the overall plot dimensions; <span className="text-teal-300">Tags</span>{" "}
          shows the equipment tag and description, and the zone overlay carries the hazardous-area class from drawing
          B047-ABG-03-PR-LAY-0001 Rev 4.
        </p>
        <PlantModel />
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 2D plan                                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">2 · Dimensioned plan — general arrangement</h3>
        <p className="max-w-4xl text-[11.5px] leading-relaxed text-mist-400">
          Overall and chained dimensions on a 25 m grid, every item called out with its dimensions and footprint in
          square metres in brackets, and dashed envelopes for each register area with its area in square metres.
        </p>
        <DrawingFrame no="B047-ABG-99-EX-DWG-0001" title="General arrangement — plan">
          <PlanDrawing />
        </DrawingFrame>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 2D elevation                                                 */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">3 · Dimensioned elevation — Section A—A</h3>
        <p className="max-w-4xl text-[11.5px] leading-relaxed text-mist-400">
          Looking north through the plot: each structure carries its overall height, the maximum height of{" "}
          {nf(Math.max(...parts.map((p) => p.h)), 1)} m is dimensioned, and the ground line is set at ±0.000 finished
          floor level.
        </p>
        <DrawingFrame no="B047-ABG-99-EX-DWG-0002" title="Section A—A — elevation">
          <ElevationDrawing />
        </DrawingFrame>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* area schedule                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">
          4 · Area schedule — all areas in square metres
        </h3>
        <Card className="p-4">
          <div className="scroll-x">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Description</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Equipment footprint (m²)</th>
                  <th className="text-right">Envelope (m²)</th>
                  <th className="text-right">% of plot</th>
                  <th className="text-right">Envelope (ha)</th>
                </tr>
              </thead>
              <tbody>
                {areaBlocks.map((b) => {
                  const eq = equipmentFootprint_m2(b.code);
                  return (
                    <tr key={b.code}>
                      <td className="font-mono text-teal-300">{b.code}</td>
                      <td>{b.name}</td>
                      <td className="num">{b.items}</td>
                      <td className="num">{nf(eq, 1)}</td>
                      <td className="num">{nf(b.area_m2, 1)}</td>
                      <td className="num">{nf((b.area_m2 / plotArea_m2) * 100, 1)} %</td>
                      <td className="num">{nf(b.area_m2 / 10_000, 2)} ha</td>
                    </tr>
                  );
                })}
                <tr className="bg-ink-850/70">
                  <td className="font-semibold">TOTAL</td>
                  <td>Envelopes, no double counting</td>
                  <td className="num font-semibold">{parts.length}</td>
                  <td className="num font-semibold">{nf(totalFootprint, 1)}</td>
                  <td className="num font-semibold">{nf(blockAreaTotal_m2, 1)}</td>
                  <td className="num font-semibold">{nf((blockAreaTotal_m2 / plotArea_m2) * 100, 1)} %</td>
                  <td className="num font-semibold">{nf(blockAreaTotal_m2 / 10_000, 1)} ha</td>
                </tr>
                <tr>
                  <td className="font-semibold">PLOT</td>
                  <td>Plot U9 envelope, {plot.w} × {plot.d} m</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td className="num font-semibold">{nf(plotArea_m2, 0)}</td>
                  <td className="num font-semibold">100.0 %</td>
                  <td className="num font-semibold">{nf(plotArea_m2 / 10_000, 2)} ha</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-mist-400">
            Envelopes are coordination bounding boxes grown by a 3 m clearance around each register area; the
            equipment footprint is the true occupied area of the items themselves. The evaporation pond for
            Option 2 sits outside this plot and is quoted separately:{" "}
            {haWithSqm(P.evaporation.areaWithFreeboard_ha)} of lined pond, reduced to{" "}
            {haWithSqm(P.evaporation.areaWithFreeboard_ha * 0.2)} under Option 2R.
          </p>
        </Card>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* per-equipment 3D                                            */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[12.5px] font-semibold text-mist-200">5 · Individual equipment models</h3>
        <p className="max-w-4xl text-[11.5px] leading-relaxed text-mist-400">
          Every modelled item, rebuilt parametrically from its own length, width, height and diameter, with
          dimension lines and text switched on. Select an item tag; the footprint in square metres is shown in the
          caption.
        </p>

        <div className="flex flex-col gap-3 lg:flex-row">
          <Card className="w-full shrink-0 p-3 lg:w-[300px]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-400">
              Equipment tags
            </div>
            <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {groups.map((g) => (
                <div key={g.code}>
                  <div className="mb-1 font-mono text-[10px] text-teal-400">
                    Area {g.code} · {sqm(g.items.reduce((a, p) => a + foot(p), 0), 1)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setTag(p.id)}
                        className={`rounded border px-1.5 py-[3px] font-mono text-[10px] transition-colors ${
                          p.id === tag
                            ? "border-teal-500 bg-teal-500/15 text-teal-300"
                            : "border-line bg-ink-950/60 text-mist-400 hover:text-mist-200"
                        }`}
                      >
                        {p.id}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="min-w-0 flex-1 space-y-2">
            <EquipmentViewer key={item.id} part={item} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Length", value: `${nf(item.w, 1)} m` },
                { label: "Width / Ø", value: `${nf(item.d, 1)} m` },
                { label: "Height", value: `${nf(item.h, 1)} m` },
                { label: "Footprint", value: `${nf(foot(item), 1)} m²` },
              ].map((r) => (
                <div key={r.label} className="rounded border border-line bg-ink-850/60 px-2.5 py-2">
                  <div className="text-[9.5px] uppercase tracking-[0.12em] text-mist-400">{r.label}</div>
                  <div className="font-mono text-[13px] text-mist-200">{r.value}</div>
                </div>
              ))}
            </div>
            <div className="text-[10.5px] text-mist-400">
              {item.label} · Area {item.area} · {item.zone} · register footprint{" "}
              {foot(item).toLocaleString("en-US")} m²
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* design basis & make-buy                                       */}
      {/* ---------------------------------------------------------- */}
      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">Design basis documents</h3>
        <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-400">
          <p>All 5 items on this plot carry the codes and requirements from the approved design basis:</p>
          <ul className="mt-1 space-y-1 text-[10.5px] text-mist-400">
            <li><span className="text-teal-300">B047-ABG-99-ME-BOD-0001 Rev-1</span> — Static equipment: ASME VIII Div.1, TEMA R, ASME B31.3, ASME B16.5, ASME B16.20, ASME II/IX/V. Wind: ASCE 7-2010 (180 km/hr, scale factor 0.6). Seismic: UBC 1997 (zone 1, Ca=0.12, Cv=0.18). Design life: 20 years. Min ambient: +1°C.</li>
            <li><span className="text-teal-300">B047-ABG-99-ME-BOD-0002 Rev-0</span> — Rotating equipment: API 610 (centrifugal pumps), API 675 (dosing pumps), API 618/617 (compressors), API 673 (blowers), API 661 (fans), API 650/671 (mixers), API 682 (mechanical seals), IEC 60034 (motors). Design life: 20 years. Min ambient: -5°C. Site elevation: 330.4 m.</li>
            <li><span className="text-teal-300">B047-ABG-99-PP-BOD-0001 Rev-A</span> — Piping design basis: ASME B31.3 process piping, NACE MR0103/ISO 17945 for sour service, ASME B16.5 flanges, ASME B16.20 gaskets. Pipe routing, clearances, valve selection, supports per MSS-SP-58/69/75.</li>
            <li><span className="text-teal-300">B047-ABG-99-PP-SPE-0002 Rev-2</span> — Piping material specification: 8 pipe classes (COFA, COFB, CPFA, COFT, ROFA, RPFA, RRFC, NOAA, BOAA, NOAB, CRFC, UOBA, BPAA). Materials: A106 Gr.B (CS), TP304/304L/316L (SS), P5 5Cr-1/2Mo (alloy), Monel 400. Spiral wound gaskets SPV2, A193 B7 / A194 2H bolts.</li>
            <li><span className="text-teal-300">B047-ABG-99-EL-BOD-0001 Rev-0</span> — Electrical design basis: IEC 62271 MV switchgear (31.5kA 3S), IEC 61439 LV/MCC (80kA 1S), IEC 60076 transformers ONAN, IEC 62040 UPS, IEC 60034 motors, IEC 60364 cables XLPE/SWA, IEC 60079 hazardous areas, IEC 62305 lightning protection, dedicated isolated lightning arrestor towers (NOT on tank/tower steel structures).</li>
          </ul>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">Make / buy split — Ramsis Engineering Bahrain</h3>
        <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-400">
          <p className="font-mono text-[10px] text-mist-400">{parts.filter(p => p.makeBuy === 'make').length} items made in Bahrain · {parts.filter(p => p.makeBuy === 'buy').length} items purchased from vendors</p>
          {parts.filter(p => p.makeBuy === 'make').length > 0 && (
            <div className="mt-1 space-y-0.5 text-[10.5px] text-mist-400">
              <p className="text-[10px] uppercase tracking-wide text-teal-400">Manufactured by Ramsis Engineering Bahrain (ME-BOD-0001 / 0002 scope)</p>
              <ul>
                {parts.filter(p => p.makeBuy === 'make').map(p => (
                  <li key={p.id}><span className="font-mono text-teal-300">{p.id}</span> — {p.label} — {p.designCode}</li>
                ))}
              </ul>
            </div>
          )}
          {parts.filter(p => p.makeBuy === 'buy').length > 0 && (
            <div className="mt-1 space-y-0.5 text-[10.5px] text-mist-400">
              <p className="text-[10px] uppercase tracking-wide text-violet-400">Purchased from approved vendors (vendor data retention min 25 years per API 610)</p>
              <ul>
                {parts.filter(p => p.makeBuy === 'buy').map(p => (
                  <li key={p.id}><span className="font-mono text-violet-300">{p.id}</span> — {p.label} — {p.designCode}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="text-[12.5px] font-semibold text-mist-200">What the 3D model shows</h3>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-400">
          <li>All 33 equipment items including pumps (API 610/675), mixers, heat exchangers (TEMA R), electrical panels (MV/LV, MCC, transformer, UPS), cable tray route and lightning arrestor tower.</li>
          <li>Hazardous area colour rings per IEC 60079 / drawing B047-ABG-03-PR-LAY-0001 Rev 4 Note 17: Zone 0 (red), Zone 1 (amber), Zone 2 (teal), Unclassified (grey).</li>
          <li>Each item tagged with its design code from the BOD documents (e.g. "ASME VIII Div.1", "API 610", "IEC 62271", "TEMA R / API 660").</li>
          <li>Make/buy indicator: green = Ramsis Bahrain manufacture, violet = purchased from approved vendor.</li>
        </ul>
        <h3 className="mt-3 text-[12.5px] font-semibold text-mist-200">What it deliberately omits</h3>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mist-400">
          <li>Detailed pipe routing, pipe stress analysis, pipe flexibilities (these come from the detailed piping model per PP-BOD-0001).</li>
          <li>Cable route schedules, cable sizing, cable tray fill calculations (EL-BOD-0001 section 10.29).</li>
          <li>Structural steel support frames, foundation design, anchor bolt layouts.</li>
          <li>Buried piping, cathodic protection (EL-BOD-0001 section 10.22), fire water piping.</li>
          <li>Buried drainage, sumps, below-grade Zone 1 network.</li>
          <li>Civil foundations, bund walls, and the evaporation pond for Option 2R (outside plot U9).</li>
        </ul>
      </Card>
    </div>
  );
}