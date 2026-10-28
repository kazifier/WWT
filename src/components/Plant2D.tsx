"use client";

/**
 * 2D layout drawings for plot U9 — a dimensioned plan and a dimensioned
 * elevation, both generated from the same geometry as the 3D model.
 *
 * SVG in metres, scaled by S px/m. Every dimension line, extension line and
 * callout is computed from the part coordinates, so the drawing cannot drift
 * from the model or the register.
 */

import { parts, plot, areaBlocks, foot, zoneColor, type PlantPart } from "@/lib/plantLayout";

/* ------------------------------------------------------------------ */
/* drawing scales and sheet geometry                                   */
/* ------------------------------------------------------------------ */

const S = 7.6; // px per metre
const ML = 110;
const MT = 60;

const sx = (x: number) => ML + (x - plot.xMin) * S;
const sy = (z: number) => MT + (z - plot.zMin) * S;

const PW = plot.w * S;
const PH = plot.d * S;
const PLAN_VW = ML + PW + 60;
const PLAN_VH = MT + PH + 196;

const GROUND = MT + PH + 156; // ground line for the elevation, in sheet coords
const ELEV_VH = 470;

const DIM = "#e0a94a";
const LINE = "#2a4049";

const REV_DATE = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/* shared svg styling                                                  */
/* ------------------------------------------------------------------ */

const sheetStyle = `
  .tag   { font: 600 10.5px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #6fe0d1;
           paint-order: stroke; stroke: #070d10; stroke-width: 3px; stroke-linejoin: round; }
  .dimt  { font: 10px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #7f9aa6;
           paint-order: stroke; stroke: #070d10; stroke-width: 3px; stroke-linejoin: round; }
  .gridt { font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #4d6b78; }
  .blk   { font: 600 9.5px ui-sans-serif, system-ui, sans-serif; fill: #a5bcc6;
           letter-spacing: .08em; paint-order: stroke; stroke: #070d10; stroke-width: 3px; }
  .blk2  { font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #7f9aa6;
           paint-order: stroke; stroke: #070d10; stroke-width: 3px; }
  .tbh   { font: 600 9px ui-sans-serif, system-ui, sans-serif; fill: #7f9aa6; letter-spacing: .12em; }
  .tbv   { font: 10.5px ui-sans-serif, system-ui, sans-serif; fill: #cfdde3; }
  .tbm   { font: 9.5px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #a5bcc6; }
  .h1    { font: 600 12px ui-sans-serif, system-ui, sans-serif; fill: #cfdde3; letter-spacing: .06em; }
`;

function Defs() {
  return (
    <defs>
      <marker id="ar" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill={DIM} />
      </marker>
      <pattern id="ground" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke={LINE} strokeWidth="2" />
      </pattern>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* dimension primitives                                                */
/* ------------------------------------------------------------------ */

function HDim({ x1, x2, y, label, ticks = true }: { x1: number; x2: number; y: number; label?: string; ticks?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={DIM} strokeWidth={1} markerStart="url(#ar)" markerEnd="url(#ar)" />
      {ticks && (
        <>
          <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} stroke={DIM} strokeWidth={1} />
          <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} stroke={DIM} strokeWidth={1} />
        </>
      )}
      {label && (
        <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" className="dimt">
          {label}
        </text>
      )}
    </g>
  );
}

function VDim({ y1, y2, x, label, ticks = true }: { y1: number; y2: number; x: number; label?: string; ticks?: boolean }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={DIM} strokeWidth={1} markerStart="url(#ar)" markerEnd="url(#ar)" />
      {ticks && (
        <>
          <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} stroke={DIM} strokeWidth={1} />
          <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} stroke={DIM} strokeWidth={1} />
        </>
      )}
      {label && (
        <text x={x - 7} y={(y1 + y2) / 2} textAnchor="middle" className="dimt" transform={`rotate(-90 ${x - 7} ${(y1 + y2) / 2})`}>
          {label}
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* legend, north arrow, scale bar, title block                         */
/* ------------------------------------------------------------------ */

function Legend({ x, y }: { x: number; y: number }) {
  const entries: [string, string][] = [
    ["Zone 0", zoneColor["Zone 0"]],
    ["Zone 1", zoneColor["Zone 1"]],
    ["Zone 2", zoneColor["Zone 2"]],
    ["Unclassified", zoneColor.Unclassified]];
  return (
    <g transform={`translate(${x} ${y})`}>
      {entries.map(([label, color], i) => (
        <g key={label} transform={`translate(${i * 108} 0)`}>
          <rect x="0" y="-7" width="9" height="9" fill={color} fillOpacity="0.75" />
          <text x="14" y="0" className="dimt">
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}

function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="17" fill="none" stroke={LINE} />
      <path d="M0,-14 L5,6 L0,2 L-5,6 Z" fill="#6fe0d1" />
      <text x="0" y="-20" textAnchor="middle" className="tag">
        N
      </text>
    </g>
  );
}

function ScaleBar({ x, y }: { x: number; y: number }) {
  const seg = 10 * S; // 10 m
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * seg} y="0" width={seg} height="7" fill={i % 2 ? "#0f1a20" : "#a5bcc6"} stroke={LINE} />
      ))}
      {[0, 2, 4].map((i) => (
        <text key={i} x={i * seg} y="20" textAnchor="middle" className="gridt">
          {i * 10} m
        </text>
      ))}
      <text x="0" y="-6" className="gridt">
        GRAPHIC SCALE
      </text>
    </g>
  );
}

function TitleBlock({ x, y, w, title, drawingNo }: { x: number; y: number; w: number; title: string; drawingNo: string }) {
  const h = 74;
  const rows: [string, string][] = [
    ["DRAWING", drawingNo],
    ["SCALE / UNITS", "1:1000 @ A1 · metres"],
    ["PROJECT / REV", "2024B047 ABG · Rev 0"],
    ["DATE / BY", `${REV_DATE} · RAMSIS ENGINEERING`],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} fill="#0f1a20" stroke={LINE} />
      <line x1="0" y1="24" x2={w} y2="24" stroke={LINE} />
      <text x="10" y="16" className="h1">
        {title}
      </text>
      {rows.map(([k, v], i) => (
        <g key={k} transform={`translate(0 ${24 + i * 12.5})`}>
          <text x="10" y="10" className="tbh">
            {k}
          </text>
          <text x={w - 10} y="10" textAnchor="end" className="tbm">
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* equipment primitives (plan)                                         */
/* ------------------------------------------------------------------ */

function EquipmentPlan({ p }: { p: PlantPart }) {
  const cx = sx(p.x);
  const cy = sy(p.z);
  const w = p.w * S;
  const d = p.d * S;
  const circular = p.kind === "tank" || p.kind === "clarifier";
  const r = Math.max(w, d) / 2;
  const small = Math.min(w, d) < 46;
  const stroke = zoneColor[p.zone];

  const dims =
    circular
      ? `Ø ${p.w.toFixed(1)} m (${foot(p)} m²)`
      : `${p.w.toFixed(1)} × ${p.d.toFixed(1)} m (${foot(p)} m²)`;

  return (
    <g>
      {circular ? (
        <>
          <circle cx={cx} cy={cy} r={r} fill={p.color} fillOpacity="0.16" stroke={stroke} strokeWidth="1.6" />
          <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke={stroke} strokeOpacity="0.45" strokeWidth="1" />
          {p.kind === "clarifier" && (
            <line x1={cx - r * 0.9} y1={cy} x2={cx + r * 0.9} y2={cy} stroke={stroke} strokeOpacity="0.7" strokeWidth="1.4" />
          )}
        </>
      ) : (
        <>
          <rect x={cx - w / 2} y={cy - d / 2} width={w} height={d} fill={p.color} fillOpacity="0.16" stroke={stroke} strokeWidth="1.6" />
          {p.kind === "building" && (
            <rect x={cx - w / 2 + 4} y={cy - d / 2 + 4} width={w - 8} height={d - 8} fill="none" stroke={stroke} strokeOpacity="0.4" strokeWidth="1" />
          )}
        </>
      )}

      {/* corner coordinate tick: position of the item's south-west corner */}
      <line x1={cx - w / 2} y1={cy + d / 2} x2={cx - w / 2 + 6} y2={cy + d / 2 + 6} stroke={stroke} strokeOpacity="0.6" />

      {small ? (
        /* leader out to the right for items too small to hold their own text */
        <g>
          <line
            x1={cx + r}
            y1={cy}
            x2={cx + r + 14}
            y2={cy - 12}
            stroke={stroke}
            strokeOpacity="0.7"
            strokeWidth="1"
          />
          <text x={cx + r + 17} y={cy - 14} className="tag">
            {p.id}
          </text>
          <text x={cx + r + 17} y={cy - 3} className="dimt">
            {dims}
          </text>
        </g>
      ) : (
        <g>
          <text x={cx} y={cy - 1} textAnchor="middle" className="tag">
            {p.id}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="dimt">
            {dims}
          </text>
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* PLAN                                                                */
/* ------------------------------------------------------------------ */

export function PlanDrawing() {
  const xGrid: number[] = [];
  for (let v = 0; v <= plot.w; v += 10) xGrid.push(v);
  const zGrid: number[] = [];
  for (let v = 0; v <= plot.d; v += 10) zGrid.push(v);

  const xChain = [0, 25, 50, 75, 100, 125, 150];
  const zChain = [0, 25, 50, 75, 90];

  return (
    <div className="scroll-x">
      <svg
        viewBox={`0 0 ${PLAN_VW} ${PLAN_VH}`}
        className="h-auto w-full min-w-[980px]"
        role="img"
        aria-label="Plot U9 equipment layout plan with dimensions"
      >
        <style>{sheetStyle}</style>
        <Defs />
        <rect width={PLAN_VW} height={PLAN_VH} fill="#070d10" />

        {/* --- grid --- */}
        {xGrid.map((v) => (
          <line key={`x${v}`} x1={sx(plot.xMin + v)} y1={MT} x2={sx(plot.xMin + v)} y2={MT + PH} stroke="#16252c" strokeWidth="1" />
        ))}
        {zGrid.map((v) => (
          <line key={`z${v}`} x1={ML} y1={sy(plot.zMin + v)} x2={ML + PW} y2={sy(plot.zMin + v)} stroke="#16252c" strokeWidth="1" />
        ))}

        {/* --- area blocks --- */}
        {areaBlocks.map((b) => (
          <g key={b.code}>
            <rect
              x={sx(b.x)}
              y={sy(b.z)}
              width={b.w * S}
              height={b.d * S}
              fill="none"
              stroke="#3d5a66"
              strokeWidth="1"
              strokeDasharray="7 4"
            />
            <text x={sx(b.x)} y={sy(b.z) - 16} className="blk">
              AREA {b.code} · {b.name.toUpperCase()}
            </text>
            <text x={sx(b.x)} y={sy(b.z) - 5} className="blk2">
              {b.area_m2.toLocaleString("en-US")} m² envelope ({b.items} items)
            </text>
          </g>
        ))}

        {/* --- plot boundary --- */}
        <rect x={ML} y={MT} width={PW} height={PH} fill="none" stroke="#5d7d8a" strokeWidth="2.5" />

        {/* --- equipment --- */}
        {parts.map((p) => (
          <EquipmentPlan key={p.id} p={p} />
        ))}

        {/* --- grid reference labels along the edges --- */}
        {xChain.map((v) => (
          <text key={`xl${v}`} x={sx(plot.xMin + v)} y={MT + PH + 18} textAnchor="middle" className="gridt">
            {v}
          </text>
        ))}
        {zChain.map((v) => (
          <text key={`zl${v}`} x={ML - 8} y={sy(plot.zMin + v) + 3} textAnchor="end" className="gridt">
            {v}
          </text>
        ))}

        {/* --- horizontal dimensions --- */}
        <HDim x1={ML} x2={ML + PW} y={MT + PH + 62} label={`${plot.w.toFixed(2)} m overall`} />
        {xChain.slice(0, -1).map((v, i) => (
          <HDim
            key={`hc${v}`}
            x1={sx(plot.xMin + v)}
            x2={sx(plot.xMin + xChain[i + 1])}
            y={MT + PH + 40}
            label={(xChain[i + 1] - v).toFixed(2)}
          />
        ))}

        {/* --- vertical dimensions --- */}
        <VDim y1={MT} y2={MT + PH} x={46} label={`${plot.d.toFixed(2)} m overall`} />
        {zChain.slice(0, -1).map((v, i) => (
          <VDim
            key={`vc${v}`}
            y1={sy(plot.zMin + v)}
            y2={sy(plot.zMin + zChain[i + 1])}
            x={86}
            label={(zChain[i + 1] - v).toFixed(2)}
          />
        ))}

        {/* --- sheet furniture --- */}
        <Legend x={ML} y={34} />
        <NorthArrow x={PLAN_VW - 44} y={44} />
        <ScaleBar x={ML} y={PLAN_VH - 44} />
        <TitleBlock
          x={PLAN_VW - 470}
          y={PLAN_VH - 96}
          w={460}
          title="GENERAL ARRANGEMENT — PLOT U9 EQUIPMENT LAYOUT (PLAN)"
          drawingNo="B047-ABG-99-EX-DWG-0001"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ELEVATION                                                           */
/* ------------------------------------------------------------------ */

const ex = (x: number) => ML + (x - plot.xMin) * S;
const ey = (h: number) => GROUND - h * S;

export function ElevationDrawing() {
  // south end first in the model; in a north-looking elevation the northern
  // items sit behind, so draw them first and let the near ones overlay.
  const sorted = [...parts].sort((a, b) => b.z - a.z);
  const maxH = Math.max(...parts.map((p) => p.h));
  const xChain = [0, 25, 50, 75, 100, 125, 150];

  return (
    <div className="scroll-x">
      <svg
        viewBox={`0 0 ${PLAN_VW} ${ELEV_VH}`}
        className="h-auto w-full min-w-[980px]"
        role="img"
        aria-label="Section A-A elevation through plot U9 with dimensions"
      >
        <style>{sheetStyle}</style>
        <Defs />
        <rect width={PLAN_VW} height={ELEV_VH} fill="#070d10" />

        {/* section title */}
        <text x={ML} y={30} className="h1">
          SECTION A—A · LOOKING NORTH (ELEVATION THROUGH PLOT U9)
        </text>

        {/* terrain */}
        <rect x={ML} y={GROUND} width={PW} height="12" fill="url(#ground)" />
        <line x1={ML} y1={GROUND} x2={ML + PW} y2={GROUND} stroke="#5d7d8a" strokeWidth="2" />

        {/* equipment, north items drawn behind */}
        {sorted.map((p) => {
          const w = p.w * S;
          const top = ey(p.h);
          const h = GROUND - top;
          const circular = p.kind === "tank" || p.kind === "clarifier";
          const stroke = zoneColor[p.zone];
          return (
            <g key={p.id}>
              {circular ? (
                <rect
                  x={ex(p.x) - w / 2}
                  y={top}
                  width={w}
                  height={h}
                  fill={p.color}
                  fillOpacity="0.3"
                  stroke={stroke}
                  strokeWidth="1.4"
                  rx={w / 8}
                />
              ) : (
                <rect
                  x={ex(p.x) - w / 2}
                  y={top}
                  width={w}
                  height={h}
                  fill={p.color}
                  fillOpacity="0.3"
                  stroke={stroke}
                  strokeWidth="1.4"
                />
              )}
              <text x={ex(p.x)} y={top - 5} textAnchor="middle" className="tag">
                {p.id}
              </text>
              <text x={ex(p.x)} y={top + 13} textAnchor="middle" className="dimt">
                {p.h.toFixed(1)} m
              </text>
            </g>
          );
        })}

        {/* vertical dimensions */}
        <VDim y1={GROUND} y2={ey(maxH)} x={62} label={`max ${maxH.toFixed(2)} m`} />
        <VDim y1={GROUND} y2={ey(0)} x={100} label="0.00" ticks={false} />

        {/* horizontal dimensions */}
        <HDim x1={ML} x2={ML + PW} y={GROUND + 66} label={`${plot.w.toFixed(2)} m overall`} />
        {xChain.slice(0, -1).map((v, i) => (
          <HDim
            key={`ec${v}`}
            x1={ex(plot.xMin + v)}
            x2={ex(plot.xMin + xChain[i + 1])}
            y={GROUND + 42}
            label={(xChain[i + 1] - v).toFixed(2)}
          />
        ))}

        {/* level marks */}
        <text x={ML + PW + 6} y={GROUND + 3} className="gridt">
          ±0.000 FF
        </text>

        <TitleBlock
          x={PLAN_VW - 470}
          y={ELEV_VH - 84}
          w={460}
          title="GENERAL ARRANGEMENT — SECTION A—A (ELEVATION)"
          drawingNo="B047-ABG-99-EX-DWG-0002"
        />
      </svg>
    </div>
  );
}