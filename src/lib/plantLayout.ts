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
 */

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
  | "pipe-rack"
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
export const parts: PlantPart[] = [
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
  const codes = [...new Set(parts.map((p) => p.area))].sort();
  return codes.map((code) => {
    const items = parts.filter((p) => p.area === code);
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
  +parts
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