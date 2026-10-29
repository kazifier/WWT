/**
 * Plot U9 layout geometry.
 *
 * One source of truth for the 3D plant model, the 2D plan and elevation
 * drawings and the area schedule — a dimension change here moves every
 * drawing at once, which is the only way drawings stay consistent with the
 * calculation-driven equipment register.
 *
 * Coordinates are metres, measured from the centre of plot U9:
 *   +x runs along the 150 m plot length (west → east)
 *   +z runs along the 90 m plot depth (south → north)
 *
 * Equipment comes from the register; piping, valves, instruments and motors are
 * placed from their own schedules so the drawing and the take-off agree.
 */

import { outsideDiameter, pipeLines } from "@/lib/piping";
import { instruments } from "@/lib/instruments";
import { motors } from "@/lib/electrical";
import { insulationItems } from "@/lib/insulation";

export type PartKind =
  | "tank"
  | "basin"
  | "clarifier"
  | "rack"
  | "rack-frame"
  | "pump"
  | "mixer"
  | "heat-exchanger"
  | "motor"
  | "electrical"
  | "pipe-rack"
  | "cable-tray"
  | "lightning"
  | "control-panel"
  | "local-control-panel"
  | "instrument-panel"
  | "pipe"
  | "valve"
  | "instrument"
  | "pipe-frame"
  | "insulation"
  | "painting"
  | "building";
export type Zone = "Zone 0" | "Zone 1" | "Zone 2" | "Unclassified";

export interface PlantPart {
  /** Equipment tag, as used in the register. */
  id: string;
  label: string;
  kind: PartKind;
  /** Register area code — 10, 20, 30 … 99. */
  area: string;
  /** Centre of the item, metres. */
  x: number;
  z: number;
  /** Elevation of the underside, metres above grade. Pipes run on racks. */
  y0?: number;
  /** Footprint and height, metres. */
  w: number;
  d: number;
  h: number;
  zone: Zone;
  color: string;
  /** Design code from BOD (for display in tooltip / data strip). */
  designCode?: string;
  /** Make (Ramsis Bahrain) or buy (vendor)? */
  makeBuy?: 'make' | 'buy';
}

export const zoneColor: Record<Zone, string> = {
  "Zone 0": "#d2703f",
  "Zone 1": "#e0a94a",
  "Zone 2": "#2ccbb8",
  Unclassified: "#7f9aa6",
};

/** Color per equipment kind — used for 3D rendering and legend. */
export const partColors: Record<PartKind, string> = {
  tank: "#6fe0d1",
  basin: "#7b9aa8",
  clarifier: "#9db6bd",
  rack: "#2ccbb8",
  building: "#425e6a",
  "rack-frame": "#2ccbb8",
  pump: "#e0a94a",
  mixer: "#e0a94a",
  "heat-exchanger": "#d2703f",
  motor: "#6fe0d1",
  electrical: "#8b7fd4",
  "pipe-rack": "#7f9aa6",
  "cable-tray": "#7f9aa6",
  lightning: "#d2703f",
  "control-panel": "#2d5a70",
  "local-control-panel": "#2d5a70",
  "instrument-panel": "#2d5a70",
  "pipe-frame": "#425e6a",
  pipe: "#5a8fa6",
  valve: "#e0a94a",
  instrument: "#8b7fd4",
  insulation: "#a0a0a0",
  painting: "#f5f5f5",
};

/** Plot U9 envelope: 150 m × 90 m. */
export const plot = {
  w: 150,
  d: 90,
  xMin: -75,
  xMax: 75,
  zMin: -45,
  zMax: 45,
};

/** Plot area in square metres — the primary area unit for this package. */
export const plotArea_m2 = plot.w * plot.d;

/** Equipment placement, derived from the dimensions used in the register.
 *
 * New equipment added per design basis documents:
 *   ME-BOD-0001 Rev-1: static equipment (heat exchangers, separators)
 *   ME-BOD-0002 Rev-0: rotating equipment (pumps, mixers, centrifuges)
 *   EL-BOD-0001 Rev-0: electrical equipment (transformers, switchgear, MCC, motors)
 */
const baseParts: PlantPart[] = [
  // --- Area 10: Chemical Drain Neutralisation ---
  { id: "V-1001", label: "Neutralisation", kind: "tank", area: "10", x: -52, z: 26, w: 4, d: 4, h: 5.5, zone: "Zone 2", color: partColors.tank, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "T-9002/3", label: "Chemical storage", kind: "tank", area: "10", x: -52, z: 14, w: 3, d: 3, h: 4.5, zone: "Zone 2", color: partColors.tank, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "SK-9001", label: "Dosing skid (API 675)", kind: "rack", area: "90", x: -52, z: 5, w: 8, d: 6, h: 2.5, zone: "Zone 2", color: partColors.rack, designCode: "API 675", makeBuy: "make" },

  // --- Area 20: Equalisation & Feed ---
  { id: "T-2001A", label: "Equalisation tank A", kind: "tank", area: "20", x: -36, z: 22, w: 20, d: 20, h: 7, zone: "Zone 0", color: partColors.tank, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "T-2001B", label: "Equalisation tank B", kind: "tank", area: "20", x: -36, z: 0, w: 20, d: 20, h: 7, zone: "Zone 0", color: partColors.tank, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "AG-2001", label: "Agitator / mixer", kind: "mixer", area: "20", x: -22, z: 22, w: 3, d: 3, h: 9, zone: "Zone 0", color: partColors.mixer, designCode: "API 650/671", makeBuy: "buy" },
  { id: "P-2001A", label: "Feed pump A (API 610)", kind: "pump", area: "20", x: -33, z: 16, w: 1.2, d: 1.2, h: 3.2, zone: "Zone 0", color: partColors.pump, designCode: "API 610/682", makeBuy: "buy" },
  { id: "P-2001B", label: "Feed pump B standby (API 610)", kind: "pump", area: "20", x: -33, z: 13, w: 1.2, d: 1.2, h: 3.2, zone: "Zone 0", color: partColors.pump, designCode: "API 610/682", makeBuy: "buy" },

  // --- Area 30: Oil Removal ---
  { id: "B-3001", label: "API oil-water separator", kind: "basin", area: "30", x: -14, z: -22, w: 28, d: 4.5, h: 3.1, zone: "Zone 0", color: partColors.basin, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "CPI-3001", label: "CPI plate interceptor", kind: "basin", area: "30", x: 0, z: -14, w: 10, d: 4, h: 2.5, zone: "Zone 0", color: partColors.basin, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "DAF-3001", label: "DAF unit", kind: "basin", area: "30", x: 16, z: -20, w: 11, d: 7, h: 3.5, zone: "Zone 0", color: partColors.basin, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "HX-3001/1", label: "lube oil shell & tube HX (TEMA R)", kind: "heat-exchanger", area: "30", x: -6, z: -28, w: 4.5, d: 2.5, h: 4.2, zone: "Zone 0", color: partColors["heat-exchanger"], designCode: "TEMA R / API 660", makeBuy: "buy" },
  { id: "HX-3001/2", label: "cooling water shell & tube HX (TEMA R)", kind: "heat-exchanger", area: "30", x: -6, z: -32, w: 5, d: 2.5, h: 4.5, zone: "Zone 0", color: partColors["heat-exchanger"], designCode: "TEMA R / API 660", makeBuy: "buy" },

  // --- Area 40: Biological Treatment ---
  { id: "TK-4001", label: "Aeration tanks", kind: "basin", area: "40", x: 34, z: -2, w: 26, d: 20, h: 6, zone: "Zone 2", color: partColors.basin, designCode: "ASME VIII Div.1", makeBuy: "make" },

  // --- Area 50: Clarification ---
  { id: "CL-5001", label: "Secondary clarifiers", kind: "clarifier", area: "50", x: 42, z: 26, w: 24, d: 24, h: 4.5, zone: "Zone 2", color: partColors.clarifier, designCode: "ASME VIII Div.1", makeBuy: "make" },

  // --- Area 60: Tertiary Filtration ---
  { id: "V-6001", label: "Multimedia filter", kind: "tank", area: "60", x: 4, z: 12, w: 4.5, d: 4.5, h: 5.2, zone: "Zone 2", color: partColors.tank, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "V-6010", label: "GAC adsorber", kind: "tank", area: "60", x: 12, z: 12, w: 4.5, d: 4.5, h: 6, zone: "Zone 2", color: partColors.tank, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "P-6001", label: "Backwash pump (API 610)", kind: "pump", area: "60", x: 8, z: 17, w: 1.2, d: 1.2, h: 3, zone: "Zone 2", color: partColors.pump, designCode: "API 610", makeBuy: "buy" },

  // --- Area 70: Ultrafiltration & RO ---
  { id: "UF-7001", label: "UF skids (purchased)", kind: "rack-frame", area: "70", x: 22, z: 16, w: 16, d: 5, h: 3, zone: "Zone 2", color: partColors["rack-frame"], designCode: "ASME B31.3", makeBuy: "buy" },
  { id: "RO-7001", label: "RO racks (purchased)", kind: "rack-frame", area: "70", x: 22, z: 26, w: 20, d: 5, h: 3.2, zone: "Zone 2", color: partColors["rack-frame"], designCode: "ASME B31.3 / ROFA", makeBuy: "buy" },
  { id: "P-7001", label: "RO HP pump (API 610)", kind: "pump", area: "70", x: 26, z: 20, w: 1.5, d: 1.5, h: 4, zone: "Zone 2", color: partColors.pump, designCode: "API 610", makeBuy: "buy" },
  { id: "CIP-7001", label: "CIP cleaning skid", kind: "rack", area: "70", x: 12, z: 32, w: 5, d: 4, h: 2.5, zone: "Zone 2", color: partColors.rack, designCode: "API 675", makeBuy: "make" },

  // --- Area 80: Sludge Handling ---
  { id: "T-8001", label: "Sludge thickener", kind: "tank", area: "80", x: -8, z: 32, w: 8, d: 8, h: 5, zone: "Zone 2", color: partColors.tank, designCode: "ASME VIII Div.1", makeBuy: "make" },
  { id: "CF-8001", label: "Decanter centrifuge (purchased)", kind: "pump", area: "80", x: 0, z: 32, w: 3.5, d: 2.5, h: 3.2, zone: "Zone 2", color: partColors.pump, designCode: "API 610 family", makeBuy: "buy" },

  // --- Area 90: Chemical Dosing ---
  // (Pumps in area 20 feed area 10; area 90 is the dosing skid location)

  // --- Area 99: Utilities & Electrical ---
  { id: "CP-9901", label: "Air / utility compressor", kind: "rack", area: "99", x: 58, z: 22, w: 8, d: 5, h: 2.5, zone: "Unclassified", color: partColors.rack, designCode: "API 673", makeBuy: "buy" },
  { id: "PCS-9901", label: "Control room building", kind: "building", area: "99", x: 58, z: 4, w: 14, d: 10, h: 5, zone: "Unclassified", color: partColors.building, makeBuy: "make" },
  { id: "MCC-9901", label: "MCC panel (80kA)", kind: "electrical", area: "99", x: 58, z: -10, w: 8, d: 4, h: 3.5, zone: "Unclassified", color: partColors.electrical, designCode: "IEC 61439", makeBuy: "buy" },
  { id: "TR-9901", label: "MV/LV transformer (ONAN)", kind: "electrical", area: "99", x: 48, z: -10, w: 5, d: 4, h: 4.5, zone: "Unclassified", color: partColors.electrical, designCode: "IEC 60076", makeBuy: "buy" },
  { id: "SW-9901", label: "MV switchgear (31.5kA)", kind: "electrical", area: "99", x: 51, z: -16, w: 4, d: 2, h: 3.5, zone: "Unclassified", color: partColors.electrical, designCode: "IEC 62271", makeBuy: "buy" },
  { id: "PCC-9901", label: "Power distribution centre", kind: "electrical", area: "99", x: 66, z: -10, w: 6, d: 4, h: 3, zone: "Unclassified", color: partColors.electrical, designCode: "IEC 61439", makeBuy: "buy" },
  { id: "UPS-9901", label: "UPS system", kind: "electrical", area: "99", x: 66, z: -16, w: 3, d: 2, h: 2.2, zone: "Unclassified", color: partColors.electrical, designCode: "IEC 62040", makeBuy: "buy" },
  { id: "CL-9901", label: "Cable ladder / tray route", kind: "cable-tray", area: "99", x: 58, z: 0, w: 55, d: 0.4, h: 2.5, zone: "Unclassified", color: partColors["cable-tray"], designCode: "IEC 60364", makeBuy: "make" },
  { id: "LA-9901", label: "Lightning arrestor tower", kind: "lightning", area: "99", x: 65, z: 38, w: 1, d: 1, h: 22, zone: "Unclassified", color: partColors.lightning, designCode: "IEC 62305", makeBuy: "buy" },

  // --- Area 95: ZLD (Option 3) ---
  { id: "ZLD-9501", label: "ZLD (Option 3)", kind: "rack-frame", area: "95", x: 72, z: 30, w: 22, d: 10, h: 8, zone: "Unclassified", color: partColors["rack-frame"], designCode: "ASME VIII Div.1", makeBuy: "buy" },
];

/* ------------------------------------------------------------------ */
/* Bulk disciplines on the layout                                      */
/* ------------------------------------------------------------------ */

/**
 * Piping, valves, instruments and motors are placed from their own schedules
 * rather than by hand, so the drawing carries the same population as the MTO.
 *
 * Pipe runs sit on the racks at their real elevations: the main rack at 4.2 m,
 * the area racks lower. Each run is one spool drawn to the line's own OD, and
 * every in-line valve type on that line gets one marker so the valve count is
 * visible on the model as well as in the schedule.
 */
const RACK_Z = 38;
const RACK_Y = 4.2;

const pipeParts: PlantPart[] = pipeLines.map((l, i) => {
  const od = outsideDiameter(l.nps) / 1000;
  const lane = i % 3;
  const level = Math.floor(i / 3) % 3;
  return {
    id: `${l.nps}"-${l.lineNo.split("-")[1]}-${l.lineNo.split("-")[2]}`,
    label: `${l.lineNo} · ${l.service}`,
    kind: "pipe",
    area: l.area,
    x: 0,
    z: RACK_Z + lane * 1.4 - 1.4,
    y0: RACK_Y + level * 0.7,
    w: 96,
    d: Math.max(od, 0.12),
    h: Math.max(od, 0.12),
    zone: l.zone,
    color: partColors.pipe,
    designCode: `PP-SPE-0002 ${l.pipeClass} · sch ${l.schedule}`,
    makeBuy: "make",
  };
});

const valveParts: PlantPart[] = pipeLines.flatMap((l, i) => {
  const od = outsideDiameter(l.nps) / 1000;
  const lane = i % 3;
  const level = Math.floor(i / 3) % 3;
  const types = [...new Set(l.valves.map((v) => v.type))];
  return types.map((type, k) => ({
    id: `${type.toUpperCase().slice(0, 3)}-${l.lineNo.split("-")[1]}-${l.lineNo.split("-")[2]}${k || ""}`,
    label: `${type} valve on ${l.lineNo} · ${l.nps}" ${l.pipeClass}`,
    kind: "valve" as const,
    area: l.area,
    x: 10 + k * 7 + (i % 4) * 6,
    z: RACK_Z + lane * 1.4 - 1.4,
    y0: RACK_Y + level * 0.7 + od / 2,
    w: Math.max(0.75, od * 1.6),
    d: Math.max(0.6, od * 1.2),
    h: Math.max(0.7, od * 1.6),
    zone: l.zone,
    color: partColors.valve,
    designCode: "PP-BOD-0001 · ASME B16.34",
    makeBuy: "buy" as const,
  }));
});

/** Instrument positions ring their register area, offset from the equipment. */
const areaCentre = (area: string) => {
  const rows = baseParts.filter((p) => p.area === area);
  if (!rows.length) return { x: 0, z: 0 };
  return {
    x: rows.reduce((a, p) => a + p.x, 0) / rows.length,
    z: rows.reduce((a, p) => a + p.z, 0) / rows.length,
  };
};

const instrumentParts: PlantPart[] = instruments.flatMap((inst, i) => {
  const c = areaCentre(inst.area);
  const angle = (i % 8) * (Math.PI / 4);
  const r = 11 + (i % 3) * 1.6;
  return Array.from({ length: Math.min(inst.qty, 6) }, (_, n) => ({
    id: inst.qty > 1 ? `${inst.tag}-${n + 1}` : inst.tag,
    label: `${inst.tag} · ${inst.type} · ${inst.service}`,
    kind: "instrument" as const,
    area: inst.area,
    x: +(c.x + Math.cos(angle) * (r + n * 0.9)).toFixed(1),
    z: +(c.z + Math.sin(angle) * (r + n * 0.9)).toFixed(1),
    w: 0.5,
    d: 0.5,
    h: 1.4,
    zone: inst.zone,
    color: partColors.instrument,
    designCode: `IC-BOD-0001 · ${inst.io} · ${inst.signal}`,
    makeBuy: "buy" as const,
  }));
});

/**
 * A motor marker sits beside the driven item it belongs to.
 *
 * The motor schedule uses the register equipment tag (`P-2001A/B`) while the
 * drawing holds one part per physical unit (`P-2001A`, `P-2001B`), so the match
 * is made on the equipment code rather than the full tag. Where the driven item
 * is a skid or a package with no individual part on the plot — the dosing skids,
 * the odour fan — the marker is placed in its area instead of being dropped, so
 * the motor count in the drawing equals the motor count in the schedule.
 */
const equipmentCode = (tag: string) => (tag.match(/^[A-Z]{1,3}-\d{3,4}/) ?? [tag])[0];

const motorParts: PlantPart[] = motors.flatMap((m) => {
  const code = equipmentCode(m.tag);
  const hosts = baseParts.filter((p) => equipmentCode(p.id) === code);

  if (!hosts.length) {
    const c = areaCentre(m.area);
    return [
      {
        id: `M-${m.tag}`,
        label: `${m.kw} kW motor (${m.tag.replace(/^M-/, "")}) · ${m.starter} · ${m.cable}`,
        kind: "motor" as const,
        area: m.area,
        x: +(c.x + 6).toFixed(1),
        z: +(c.z + 6).toFixed(1),
        w: 1.2,
        d: 1.2,
        h: 1.0,
        zone: (m.zone ?? "Zone 2") as Zone,
        color: partColors.motor,
        designCode: `IEC 60034 · ${m.volts} V · ${m.breaker} A`,
        makeBuy: "buy" as const,
      },
    ];
  }

  return hosts.slice(0, Math.max(1, Math.min(m.qty, 2))).map((host, n) => ({
    id: hosts.length > 1 ? `M-${host.id}` : `M-${m.tag}`,
    label: `${m.kw} kW motor on ${host.id} · ${m.starter} · ${m.cable}`,
    kind: "motor" as const,
    area: host.area,
    x: +(host.x + host.w / 2 + 1.6 + n * 1.4).toFixed(1),
    z: host.z,
    w: 1.2,
    d: 1.2,
    h: 1.0,
    zone: (host.zone ?? "Zone 2") as Zone,
    color: partColors.motor,
    designCode: `IEC 60034 · ${m.volts} V · ${m.breaker} A`,
    makeBuy: "buy" as const,
  }));
});

/** Insulation is a translucent sleeve over the insulated run or shell. */
const insulationParts: PlantPart[] = pipeLines
  .filter((l) => l.insulation_mm > 0)
  .map((l, i) => {
    const od = outsideDiameter(l.nps) / 1000;
    const t = (2 * l.insulation_mm) / 1000;
    const lane = pipeLines.findIndex((x) => x.lineNo === l.lineNo) % 3;
    const level = Math.floor(pipeLines.findIndex((x) => x.lineNo === l.lineNo) / 3) % 3;
    return {
      id: `INS-${l.lineNo.split("-")[1]}-${i + 1}`,
      label: `Insulation ${l.insulation_mm} mm on ${l.lineNo}`,
      kind: "insulation" as const,
      area: l.area,
      x: 0,
      z: RACK_Z + lane * 1.4 - 1.4,
      y0: RACK_Y + level * 0.7,
      w: 96,
      d: od + t,
      h: od + t,
      zone: l.zone,
      color: partColors.insulation,
      designCode: "ME-SPE-0014 · rock wool + Al jacketing",
      makeBuy: "make" as const,
    };
  });

/** Pipe racks, sized to carry the runs above. */
export const rackParts: PlantPart[] = [
  { id: "PR-1001", label: "Main pipe rack — 96 m, 3 tiers", kind: "pipe-rack", area: "99", x: 0, z: RACK_Z, w: 98, d: 6, h: 6, zone: "Unclassified", color: partColors["pipe-rack"], designCode: "MSS SP-58 · AISC 360", makeBuy: "make" },
  { id: "PR-1002", label: "Area 30 pipe rack — 34 m", kind: "pipe-rack", area: "30", x: -18, z: -38, w: 34, d: 4, h: 4.5, zone: "Zone 0", color: partColors["pipe-rack"], designCode: "MSS SP-58", makeBuy: "make" },
  { id: "PR-1003", label: "Area 70 pipe rack — 22 m", kind: "pipe-rack", area: "70", x: 24, z: 33, w: 22, d: 3.5, h: 4, zone: "Zone 2", color: partColors["pipe-rack"], designCode: "MSS SP-58", makeBuy: "make" },
];

/**
 * Insulation on equipment shells, from the same ME-SPE-0014 schedule the
 * insulation page and the MTO read. The sleeve sits 100 mm proud of the shell
 * on each side so it reads as cladding in 3D, and it is wrapped at the item's
 * own footprint so the cladded surface in the drawing matches the area in the
 * schedule.
 */
const equipmentInsulationParts: PlantPart[] = insulationItems
  .filter((i) => i.hostType === "equipment")
  .flatMap((i) => {
    const host = baseParts.find((p) => p.id === i.host);
    if (!host) return [];
    const t = (2 * i.thickness_mm) / 1000;
    return [
      {
        id: i.tag,
        label: `${i.thickness_mm} mm ${i.material} on ${host.id} · ${i.area_m2} m²`,
        kind: "insulation" as const,
        area: host.area,
        x: host.x,
        z: host.z,
        w: +(host.w + t).toFixed(2),
        d: +(host.d + t).toFixed(2),
        h: host.h,
        zone: host.zone,
        color: partColors.insulation,
        designCode: `ME-SPE-0014 · ${i.jacketing} jacketing`,
        makeBuy: "make" as const,
      },
    ];
  });

/** Electrical field items that are not already in the register. */
const fieldElectrical: PlantPart[] = [
  { id: "JB-9901", label: "Junction box — areas 30/40", kind: "electrical", area: "99", x: 44, z: 14, w: 1.2, d: 0.8, h: 1.6, zone: "Unclassified", color: partColors.electrical, designCode: "IEC 60079-7 · Ex e", makeBuy: "buy" },
  { id: "JB-9902", label: "Junction box — areas 70/80", kind: "electrical", area: "99", x: 38, z: 30, w: 1.2, d: 0.8, h: 1.6, zone: "Zone 2", color: partColors.electrical, designCode: "IEC 60079-7 · Ex e", makeBuy: "buy" },
  { id: "LP-9901", label: "Lighting pole — 12 m high mast", kind: "lightning", area: "99", x: -28, z: -40, w: 1, d: 1, h: 12, zone: "Unclassified", color: partColors.lightning, designCode: "IEC 60598-2-5", makeBuy: "buy" },
  { id: "LP-9902", label: "Lighting pole — 12 m high mast", kind: "lightning", area: "99", x: 36, z: 40, w: 1, d: 1, h: 12, zone: "Unclassified", color: partColors.lightning, designCode: "IEC 60598-2-5", makeBuy: "buy" },
];

/** Everything on the plot: register items plus the bulk disciplines. */
export const parts: PlantPart[] = [
  ...baseParts,
  ...rackParts,
  ...pipeParts,
  ...insulationParts,
  ...equipmentInsulationParts,
  ...valveParts,
  ...instrumentParts,
  ...motorParts,
  ...fieldElectrical,
];

/**
 * Linear and surface items do not consume area: a 96 m pipe run or an
 * instrument stand would otherwise swamp the envelope schedule and make the
 * area blocks overlap. Area envelopes are built from the physical equipment only.
 */
const AREA_ITEMS_EXCLUDED = new Set<PartKind>(["pipe", "insulation", "valve", "instrument"]);
export const areaItems = parts.filter((p) => !AREA_ITEMS_EXCLUDED.has(p.kind));

/** Counts per discipline, used by the model page and the make/buy summary. */
export const partCounts = (() => {
  const byKind: Record<string, number> = {};
  for (const p of parts) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
  return {
    total: parts.length,
    equipment: parts.filter((p) => !AREA_ITEMS_EXCLUDED.has(p.kind)).length,
    piping: pipeParts.length,
    valves: valveParts.length,
    instruments: instrumentParts.length,
    motors: motorParts.length,
    insulation: insulationParts.length + equipmentInsulationParts.length,
    racks: rackParts.length,
    rackLength_m: +rackParts.reduce((a, p) => a + p.w, 0).toFixed(0),
    byKind,
  };
})();

/** Footprint of a single item, m². */
export const foot = (p: { w: number; d: number }): number => +(p.w * p.d).toFixed(1);

export interface AreaBlock {
  code: string;
  name: string;
  /** Bounding box of everything belonging to this register area. */
  x: number;
  z: number;
  w: number;
  d: number;
  /** Bounding-box area, m². */
  area_m2: number;
  items: number;
}

const AREA_NAMES: Record<string, string> = {
  "10": "Chemical drain neutralisation",
  "20": "Equalisation & feed",
  "30": "Oil removal (API / CPI / DAF / HX)",
  "40": "Biological treatment",
  "50": "Clarification",
  "60": "Tertiary filtration",
  "70": "Ultrafiltration & RO & CIP",
  "80": "Sludge handling",
  "90": "Chemical dosing",
  "95": "Zero liquid discharge (Opt. 3)",
  "99": "Utilities, electrical & cabling",
};

/** Clearance added around each area bounding box, m. */
const BLOCK_PAD = 3;

/**
 * Bounding box per register area, grown by BLOCK_PAD and clamped to the plot.
 * These are coordination envelopes, not surveyed areas — which is why the
 * schedule labels them as such.
 */
export const areaBlocks: AreaBlock[] = (() => {
  const codes = [...new Set(areaItems.map((p) => p.area))].sort();
  return codes.map((code) => {
    const items = areaItems.filter((p) => p.area === code);
    const x0 = Math.min(...items.map((p) => p.x - p.w / 2)) - BLOCK_PAD;
    const x1 = Math.max(...items.map((p) => p.x + p.w / 2)) + BLOCK_PAD;
    const z0 = Math.min(...items.map((p) => p.z - p.d / 2)) - BLOCK_PAD;
    const z1 = Math.max(...items.map((p) => p.z + p.d / 2)) + BLOCK_PAD;
    const x = Math.max(plot.xMin, x0);
    const z = Math.max(plot.zMin, z0);
    const w = Math.min(plot.xMax, x1) - x;
    const d = Math.min(plot.zMax, z1) - z;
    return {
      code,
      name: AREA_NAMES[code] ?? `Area ${code}`,
      x,
      z,
      w,
      d,
      area_m2: +(w * d).toFixed(1),
      items: items.length,
    };
  });
})();

/** Total of all area bounding boxes, m² (blocks do not overlap by design). */
export const blockAreaTotal_m2 = +areaBlocks.reduce((a, b) => a + b.area_m2, 0).toFixed(1);

/** Area schedule row for a register area: what is physically built there. */
export const equipmentFootprint_m2 = (code: string): number =>
  +areaItems
    .filter((p) => p.area === code)
    .reduce((a, p) => a + p.w * p.d, 0)
    .toFixed(1);

/** 1 234 m² — square metres always shown so no area is quoted in one unit only. */
export const sqm = (m2: number, d = 0): string =>
  `${m2.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })} m²`;

/**
 * 1.35 ha (13,500 m²) — hectares are the historic unit for large plots, so
 * every hectare figure carries its square-metre equivalent in brackets.
 */
export const haWithSqm = (ha: number, d = 1): string =>
  `${ha.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })} ha (${sqm(+(ha * 10_000).toFixed(0))})`;

/** Square metres with the hectare equivalent in brackets, for large areas. */
export const sqmWithHa = (m2: number, d = 0): string =>
  `${sqm(m2, d)} (${(m2 / 10_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha)`;

/** Dimension text for a rectangular footprint: 28.0 × 4.5 m. */
export const planDim = (p: { w: number; d: number }): string => `${p.w.toFixed(1)} × ${p.d.toFixed(1)} m`;

/** Dimension text for a circular item: Ø 24.0 m. */
export const roundDim = (d: number): string => `Ø ${d.toFixed(1)} m`;