/**
 * Material take-off for the RAMSIS make scope.
 * Geometry-driven plate weights, weld lengths and manhours so the fabrication
 * estimate moves with the design instead of being a fixed allowance.
 */
import { process as P } from "@/lib/calc/process";
import { r0 } from "@/lib/calc/types";

export type Grade = "CS A516-70" | "CS A36 / A283-C" | "SS 316L" | "Duplex 2205" | "FRP / PP" | "Structural steel";

export interface MtoRow {
  tag: string;
  description: string;
  grade: Grade;
  qty: number;
  shell_t: number;
  bottom_t: number;
  roof_t: number;
  heads_t: number;
  nozzles_t: number;
  structure_t: number;
  total_t: number;
  coating_m2: number;
  weld_m: number;
  manhours: number;
}

const RHO = 7.85; // t/m3

/** Cylindrical shell + flat bottom + cone roof. */
function cylinder(D: number, H: number, t: number, tb: number, tr: number, qty = 1) {
  const shell = Math.PI * D * H * (t / 1000) * RHO;
  const bottom = (Math.PI * (D / 2) ** 2) * (tb / 1000) * RHO;
  const roof = (Math.PI * (D / 2) ** 2) * 1.15 * (tr / 1000) * RHO;
  const coat = Math.PI * D * H + (Math.PI * (D / 2) ** 2) * 2;
  const weld = (2 * Math.PI * D * (H / 2.4) + Math.PI * D * 2) * 1.0; // girth + bottom/roof
  return { shell: shell * qty, bottom: bottom * qty, roof: roof * qty, coat: coat * qty, weld: weld * qty };
}

/** Open rectangular basin: floor + 4 walls + freeboard. */
function basin(L: number, W: number, D: number, t: number, qty = 1) {
  const floor = L * W * (t / 1000) * RHO;
  const walls = 2 * (L + W) * D * (t / 1000) * RHO * 1.15;
  const coat = L * W + 2 * (L + W) * D;
  const weld = 2 * (L + W) + 4 * L + 4 * W + 6 * D;
  return { shell: (floor + walls) * qty, coat: coat * qty, weld: weld * qty };
}

/** Pressure vessel: shell + 2:1 ellipsoidal heads + nozzles + internals. */
function vessel(D: number, H: number, t: number, qty = 1) {
  const shell = Math.PI * D * H * (t / 1000) * RHO;
  const head = 1.084 * (Math.PI * (D / 2) ** 2) * (t / 1000) * RHO * 2;
  const nozzles = shell * 0.14;
  const internals = shell * 0.09;
  const coat = Math.PI * D * H + Math.PI * D * 0.5;
  const weld = Math.PI * D * (H / 1.8 + 2);
  return { shell: (shell + nozzles + internals) * qty, heads: head * qty, coat: coat * qty, weld: weld * qty };
}

interface MakeSpec {
  tag: string;
  description: string;
  grade: Grade;
  qty: number;
  fn: () => { shell: number; bottom?: number; roof?: number; heads?: number; coat: number; weld: number };
  /** fabrication hours per tonne, by complexity */
  hpt: number;
}

const specs: MakeSpec[] = [
  {
    tag: "V-1001A/B",
    description: "Neutralisation tank, Ø4.0 × 5.5 m, 8 mm 316L",
    grade: "SS 316L",
    qty: 2,
    fn: () => vessel(4.0, 5.5, 8),
    hpt: 34,
  },
  {
    tag: "T-2001A/B",
    description: `Equalisation tank, Ø${P.equalisation.diameter_m} × ${P.equalisation.height_m.toFixed(1)} m, API 650`,
    grade: "CS A516-70",
    qty: 2,
    fn: () => cylinder(P.equalisation.diameter_m, P.equalisation.height_m, 8, 8, 6),
    hpt: 11,
  },
  {
    tag: "T-9002/9003",
    description: "Caustic and acid storage tanks, Ø3.0 × 4.5 m, lined",
    grade: "CS A36 / A283-C",
    qty: 2,
    fn: () => cylinder(3.0, 4.5, 6, 6, 5),
    hpt: 14,
  },
  {
    tag: "B-3001A/B",
    description: `API separator basin, ${P.oilRemoval.length_m} × ${P.oilRemoval.width_m} × ${P.oilRemoval.depth_m} m`,
    grade: "CS A36 / A283-C",
    qty: 2,
    fn: () => basin(P.oilRemoval.length_m, P.oilRemoval.width_m, P.oilRemoval.depth_m + 0.6, 8),
    hpt: 13,
  },
  {
    tag: "DAF-3001A/B",
    description: "DAF basin and scraper bridge, 11 × 7 m",
    grade: "CS A516-70",
    qty: 2,
    fn: () => basin(11, 7, 3.5, 8),
    hpt: 15,
  },
  {
    tag: "V-6001A-D",
    description: "Multimedia filter shell, Ø4.5 × 5.2 m, 6 barg, U-stamp",
    grade: "CS A516-70",
    qty: P.filtration.units,
    fn: () => vessel(4.5, 5.2, 14),
    hpt: 26,
  },
  {
    tag: "V-6010A/B",
    description: "GAC adsorber shell, Ø4.5 m, rubber lined, U-stamp",
    grade: "CS A516-70",
    qty: 2,
    fn: () => vessel(4.5, 6.0, 16),
    hpt: 28,
  },
  {
    tag: "T-8001",
    description: "Sludge thickener tank, Ø8.0 × 5.0 m",
    grade: "CS A516-70",
    qty: 1,
    fn: () => cylinder(8.0, 5.0, 8, 8, 6),
    hpt: 13,
  },
  {
    tag: "CIP-7001",
    description: "CIP tank and skid frame, 10 m³",
    grade: "SS 316L",
    qty: 1,
    fn: () => cylinder(2.4, 2.4, 6, 6, 5),
    hpt: 30,
  },
  {
    tag: "SK-9001..9008",
    description: "Dosing skid frames and solution tanks, 8 packages",
    grade: "SS 316L",
    qty: 8,
    fn: () => cylinder(1.5, 2.0, 5, 5, 0),
    hpt: 26,
  },
  {
    tag: "V-1010",
    description: "Odour control scrubber, FRP, Ø1.8 × 4.5 m",
    grade: "FRP / PP",
    qty: 1,
    fn: () => ({ shell: 1.6, coat: 20, weld: 0 }),
    hpt: 40,
  },
  {
    tag: "PS-9901",
    description: "Pipe spools, supports and platforms, 4,800 m",
    grade: "Structural steel",
    qty: 1,
    fn: () => ({ shell: 320, coat: 1_450, weld: 3_200 }),
    hpt: 9,
  },
];

export const mtoRows: MtoRow[] = specs.map((s) => {
  // The geometry helpers return a SINGLE unit. Multiply by the item quantity
  // before aggregating, otherwise multi-unit items under-count by their qty.
  const g = s.fn();
  const q = s.qty;
  const shell = g.shell * q;
  const bottom = (g.bottom ?? 0) * q;
  const roof = (g.roof ?? 0) * q;
  const heads = (g.heads ?? 0) * q;
  const total = shell + bottom + roof + heads;
  return {
    tag: s.tag,
    description: s.description,
    grade: s.grade,
    qty: q,
    shell_t: +shell.toFixed(2),
    bottom_t: +bottom.toFixed(2),
    roof_t: +roof.toFixed(2),
    heads_t: +heads.toFixed(2),
    nozzles_t: 0,
    structure_t: s.grade === "Structural steel" ? 0 : +(total * 0.08).toFixed(2),
    total_t: +(total * 1.08).toFixed(2),
    coating_m2: r0(g.coat * q),
    weld_m: r0(g.weld * q),
    manhours: r0(total * s.hpt),
  };
});

export const mtoTotals = (() => {
  const total_t = mtoRows.reduce((a, r) => a + r.total_t, 0);
  const manhours = mtoRows.reduce((a, r) => a + r.manhours, 0);
  const coating = mtoRows.reduce((a, r) => a + r.coating_m2, 0);
  const weld = mtoRows.reduce((a, r) => a + r.weld_m, 0);
  const byGrade = ["CS A516-70", "CS A36 / A283-C", "SS 316L", "Duplex 2205", "FRP / PP", "Structural steel"].map((g) => {
    const rows = mtoRows.filter((r) => r.grade === g);
    return {
      grade: g as Grade,
      tonnes: +rows.reduce((a, r) => a + r.total_t, 0).toFixed(1),
      hours: rows.reduce((a, r) => a + r.manhours, 0),
      value: +rows.reduce((a, r) => a + r.manhours * rateFor(g as Grade), 0).toFixed(0),
    };
  }).filter((g) => g.tonnes > 0);
  return { total_t: +total_t.toFixed(1), manhours, coating_m2: coating, weld_m: weld, byGrade };
})();

export function rateFor(g: Grade): number {
  switch (g) {
    case "SS 316L":
      return 38;
    case "Duplex 2205":
      return 52;
    case "FRP / PP":
      return 46;
    case "CS A516-70":
      return 28;
    case "Structural steel":
      return 19;
    default:
      return 22;
  }
}

/** Plate and section purchase cost, USD/t delivered Bahrain. */
export function materialRate(g: Grade): number {
  switch (g) {
    case "SS 316L":
      return 6200;
    case "Duplex 2205":
      return 11500;
    case "FRP / PP":
      return 8500;
    case "CS A516-70":
      return 1450;
    case "Structural steel":
      return 1250;
    default:
      return 1300;
  }
}

export const fabrication = (() => {
  const material = mtoTotals.byGrade.reduce((a, g) => a + g.tonnes * materialRate(g.grade), 0);
  const hours = mtoTotals.manhours;
  const labour = mtoTotals.byGrade.reduce((a, g) => a + g.value, 0);
  const coating = mtoTotals.coating_m2 * 22;
  const consumables = material * 0.06;
  const ndt = hours * 1.6;
  const overhead = (labour + material) * 0.12;
  return {
    material: +material.toFixed(0),
    labour: +labour.toFixed(0),
    coating: +coating.toFixed(0),
    consumables: +consumables.toFixed(0),
    ndt: +ndt.toFixed(0),
    overhead: +overhead.toFixed(0),
    total: +(material + labour + coating + consumables + ndt + overhead).toFixed(0),
    hours,
    avgRate: +(labour / hours).toFixed(2),
  };
})();
