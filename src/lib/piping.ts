/**
 * Piping line list for the B047 WWT package.
 *
 * Every line carries its class from PP-SPE-0002 Rev-2, its design conditions
 * from PP-BOD-0001 Rev-A, and the geometry needed to produce the bulk
 * take-off (pipe mass, fittings, flanges, gaskets, bolts, supports, insulation
 * and paint area). The line list is the single source for the piping rows in
 * the MTO, the piping calculations and the pipe runs drawn on the 3D model —
 * change a length or a size here and all three follow.
 */

import type { Zone } from "@/lib/plantLayout";
import type { PipeClassKey } from "@/lib/equipment-register";

export type Schedule = "10" | "40" | "80" | "160" | "STD" | "XS";

export type ValveType =
  | "gate"
  | "globe"
  | "check"
  | "ball"
  | "butterfly"
  | "plug"
  | "diaphragm"
  | "knife-gate"
  | "control"
  | "PSV";

export type Tracing = "none" | "steam" | "electric";

export interface LineValve {
  type: ValveType;
  qty: number;
  /** Actuation, where the valve is not hand-operated. */
  actuator?: "manual" | "pneumatic" | "electric" | "self-acting";
}

export interface PipeLine {
  /** Line number as issued on the P&ID: size-service-sequence-insulation. */
  lineNo: string;
  service: string;
  from: string;
  to: string;
  /** Nominal size, inches. */
  nps: number;
  pipeClass: PipeClassKey;
  schedule: Schedule;
  material: string;
  length_m: number;
  designT_C: number;
  designP_barg: number;
  /** Insulation thickness, mm. 0 = bare. */
  insulation_mm: number;
  tracing: Tracing;
  valves: LineValve[];
  area: string;
  zone: Zone;
}

/** ASME B36.10M outside diameter and wall thickness, mm. */
const NPS_TABLE: Record<number, { od: number; t: Record<"10" | "40" | "80" | "160", number> }> = {
  1: { od: 33.4, t: { "10": 2.77, "40": 3.38, "80": 4.55, "160": 6.35 } },
  1.5: { od: 48.3, t: { "10": 2.77, "40": 3.68, "80": 5.08, "160": 7.14 } },
  2: { od: 60.3, t: { "10": 2.77, "40": 3.91, "80": 5.54, "160": 8.74 } },
  3: { od: 88.9, t: { "10": 3.05, "40": 5.49, "80": 7.62, "160": 11.13 } },
  4: { od: 114.3, t: { "10": 3.05, "40": 6.02, "80": 8.56, "160": 13.49 } },
  6: { od: 168.3, t: { "10": 3.4, "40": 7.11, "80": 10.97, "160": 18.26 } },
  8: { od: 219.1, t: { "10": 3.76, "40": 8.18, "80": 12.7, "160": 23.01 } },
  10: { od: 273.0, t: { "10": 4.19, "40": 9.27, "80": 15.09, "160": 28.58 } },
  12: { od: 323.8, t: { "10": 4.57, "40": 10.31, "80": 17.48, "160": 33.32 } },
  14: { od: 355.6, t: { "10": 6.35, "40": 11.13, "80": 19.05, "160": 35.71 } },
  16: { od: 406.4, t: { "10": 6.35, "40": 12.7, "80": 21.44, "160": 40.49 } },
  18: { od: 457.0, t: { "10": 6.35, "40": 14.27, "80": 23.83, "160": 45.24 } },
  20: { od: 508.0, t: { "10": 6.35, "40": 15.09, "80": 26.19, "160": 50.01 } },
  24: { od: 610.0, t: { "10": 6.35, "40": 17.48, "80": 30.96, "160": 59.54 } },
};

export function scheduleThickness(nps: number, schedule: Schedule): number {
  const row = NPS_TABLE[nps];
  if (!row) return 0;
  const key = schedule === "STD" ? "40" : schedule === "XS" ? "80" : schedule;
  return row.t[key as "10" | "40" | "80" | "160"];
}

export function outsideDiameter(nps: number): number {
  return NPS_TABLE[nps]?.od ?? 0;
}

/** Steel mass per metre, kg/m — 0.02466·t·(OD−t), corrected for alloy density. */
export function massPerMetre(nps: number, schedule: Schedule, material: string): number {
  const od = outsideDiameter(nps);
  const t = scheduleThickness(nps, schedule);
  const densityFactor = material.includes("Monel") ? 0.0277 : material.includes("316") || material.includes("SS") ? 0.0248 : 0.02466;
  return densityFactor * t * (od - t);
}

/** Design pressure at the pipe class rating, barg — from PP-SPE-0002 pressure/temperature tables. */
export const CLASS_RATING_BARG: Record<PipeClassKey, number> = {
  COFA: 19.6, // class 150 CS, derated for 90 °C service
  COFB: 19.6,
  CPFA: 99.3, // class 600 CS/alloy
  ROFA: 19.6, // class 150 316L
  NOAA: 19.6,
  BOAA: 19.6,
  NOAB: 19.6,
  CRFC: 99.3,
};

export const pipeLines: PipeLine[] = [
  {
    lineNo: '24"-P-2001-A1A',
    service: "Equalised raw effluent to oil removal",
    from: "T-2001A/B",
    to: "B-3001",
    nps: 24,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 96,
    designT_C: 60,
    designP_barg: 6,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      // One of the pair is air-operated for remote isolation from the PCS: the
      // line is the only feed to oil removal, so it cannot be left to a field
      // handwheel during an upset (IC-BOD-0001 §6.4).
      { type: "gate", qty: 1, actuator: "manual" },
      { type: "gate", qty: 1, actuator: "pneumatic" },
      { type: "check", qty: 1 },
      { type: "control", qty: 1, actuator: "pneumatic" },
    ],
    area: "20",
    zone: "Zone 0",
  },
  {
    lineNo: '16"-P-3001-A1A',
    service: "De-oiled effluent to biological treatment",
    from: "DAF-3001",
    to: "TK-4001",
    nps: 16,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 78,
    designT_C: 55,
    designP_barg: 4,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "gate", qty: 2, actuator: "manual" },
      { type: "butterfly", qty: 2, actuator: "pneumatic" },
    ],
    area: "30",
    zone: "Zone 0",
  },
  {
    lineNo: '14"-P-4001-A1A',
    service: "Mixed liquor to secondary clarifiers",
    from: "TK-4001",
    to: "CL-5001",
    nps: 14,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 62,
    designT_C: 45,
    designP_barg: 3,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "gate", qty: 2, actuator: "manual" },
      { type: "control", qty: 1, actuator: "electric" },
    ],
    area: "40",
    zone: "Zone 2",
  },
  {
    lineNo: '12"-P-5001-A1A',
    service: "Clarified effluent to tertiary filtration",
    from: "CL-5001",
    to: "V-6001",
    nps: 12,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 58,
    designT_C: 40,
    designP_barg: 4,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "butterfly", qty: 2, actuator: "pneumatic" },
      { type: "check", qty: 1 },
    ],
    area: "50",
    zone: "Zone 2",
  },
  {
    lineNo: '10"-P-6001-A1A',
    service: "Filtered effluent to UF feed",
    from: "V-6001",
    to: "UF-7001",
    nps: 10,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 54,
    designT_C: 40,
    designP_barg: 6,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "butterfly", qty: 2, actuator: "pneumatic" },
      { type: "gate", qty: 1, actuator: "manual" },
    ],
    area: "60",
    zone: "Zone 2",
  },
  {
    lineNo: '8"-P-7001-B1A',
    service: "UF filtrate to RO feed tank",
    from: "UF-7001",
    to: "RO-7001",
    nps: 8,
    pipeClass: "NOAA",
    schedule: "10",
    material: "ASTM A312 TP316L",
    length_m: 46,
    designT_C: 40,
    designP_barg: 10,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "butterfly", qty: 2, actuator: "pneumatic" },
      { type: "check", qty: 1 },
    ],
    area: "70",
    zone: "Zone 2",
  },
  {
    lineNo: '4"-P-7002-B1A',
    service: "RO permeate to reuse header",
    from: "RO-7001",
    to: "Battery limit",
    nps: 4,
    pipeClass: "ROFA",
    schedule: "10",
    material: "ASTM A312 TP316L",
    length_m: 88,
    designT_C: 35,
    designP_barg: 16,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "ball", qty: 2, actuator: "manual" },
      // Remote isolation on the reuse battery limit, so the header can be shut
      // from the control room when the downstream user trips.
      { type: "ball", qty: 1, actuator: "pneumatic" },
      { type: "check", qty: 1 },
    ],
    area: "70",
    zone: "Zone 2",
  },
  {
    lineNo: '4"-P-7003-B1A',
    service: "RO concentrate to ZLD / pond",
    from: "RO-7001",
    to: "ZLD-9501",
    nps: 4,
    pipeClass: "ROFA",
    schedule: "40",
    material: "ASTM A312 TP316L",
    length_m: 72,
    designT_C: 45,
    designP_barg: 16,
    insulation_mm: 25,
    tracing: "none",
    valves: [
      { type: "globe", qty: 2, actuator: "manual" },
      { type: "PSV", qty: 1, actuator: "self-acting" },
    ],
    area: "70",
    zone: "Zone 2",
  },
  {
    lineNo: '6"-SL-8001-A1A',
    service: "Waste activated sludge to thickener",
    from: "CL-5001",
    to: "T-8001",
    nps: 6,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 64,
    designT_C: 40,
    designP_barg: 4,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "knife-gate", qty: 1, actuator: "manual" },
      { type: "knife-gate", qty: 1, actuator: "pneumatic" },
      { type: "control", qty: 1, actuator: "pneumatic" },
    ],
    area: "80",
    zone: "Zone 2",
  },
  {
    lineNo: '4"-SL-8002-A1A',
    service: "Thickened sludge to centrifuge",
    from: "T-8001",
    to: "CF-8001",
    nps: 4,
    pipeClass: "COFA",
    schedule: "80",
    material: "ASTM A106 Gr.B",
    length_m: 34,
    designT_C: 40,
    designP_barg: 8,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "knife-gate", qty: 1, actuator: "manual" },
      { type: "check", qty: 1 },
    ],
    area: "80",
    zone: "Zone 2",
  },
  {
    lineNo: '2"-AC-9001-B1A',
    service: "98 % sulphuric acid dosing",
    from: "T-9003",
    to: "Neutralisation",
    nps: 2,
    pipeClass: "NOAB",
    schedule: "80",
    material: "ASTM A312 TP316L",
    length_m: 42,
    designT_C: 40,
    designP_barg: 6,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "diaphragm", qty: 3, actuator: "manual" },
      { type: "check", qty: 2 },
    ],
    area: "10",
    zone: "Zone 2",
  },
  {
    lineNo: '2"-CA-9002-B1A',
    service: "45 % caustic dosing",
    from: "T-9002",
    to: "Neutralisation",
    nps: 2,
    pipeClass: "NOAB",
    schedule: "80",
    material: "ASTM A312 TP316L",
    length_m: 38,
    designT_C: 40,
    designP_barg: 6,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "diaphragm", qty: 3, actuator: "manual" },
      { type: "check", qty: 2 },
    ],
    area: "10",
    zone: "Zone 2",
  },
  {
    lineNo: '3"-LS-1001-A2A',
    service: "LP steam to tracing and CIP heater",
    from: "Steam header",
    to: "CIP-7001",
    nps: 3,
    pipeClass: "COFB",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 118,
    designT_C: 180,
    designP_barg: 10,
    insulation_mm: 60,
    tracing: "none",
    valves: [
      { type: "gate", qty: 3, actuator: "manual" },
      { type: "control", qty: 1, actuator: "pneumatic" },
      { type: "PSV", qty: 1, actuator: "self-acting" },
    ],
    area: "99",
    zone: "Unclassified",
  },
  {
    lineNo: '2"-SC-1002-A2A',
    service: "Steam condensate return",
    from: "CIP-7001",
    to: "Condensate pit",
    nps: 2,
    pipeClass: "COFB",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 96,
    designT_C: 120,
    designP_barg: 3,
    insulation_mm: 40,
    tracing: "none",
    valves: [
      { type: "gate", qty: 2, actuator: "manual" },
      { type: "check", qty: 1 },
    ],
    area: "99",
    zone: "Unclassified",
  },
  {
    lineNo: '6"-IA-9901-B1A',
    service: "Instrument air",
    from: "CP-9901",
    to: "Area 30/40/50 users",
    nps: 6,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B, galvanised",
    length_m: 210,
    designT_C: 50,
    designP_barg: 8,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "ball", qty: 8, actuator: "manual" },
      { type: "check", qty: 2 },
    ],
    area: "99",
    zone: "Unclassified",
  },
  {
    lineNo: '8"-CW-3002-A1A',
    service: "Cooling water supply / return to HX-3001",
    from: "Cooling water header",
    to: "HX-3001/2",
    nps: 8,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 84,
    designT_C: 50,
    designP_barg: 6,
    insulation_mm: 30,
    tracing: "none",
    valves: [
      { type: "butterfly", qty: 2, actuator: "manual" },
      { type: "control", qty: 1, actuator: "pneumatic" },
    ],
    area: "30",
    zone: "Zone 0",
  },
  {
    lineNo: '12"-FP-4002-A1A',
    service: "Aeration air header (blowers to diffusers)",
    from: "BL-4001",
    to: "TK-4001 diffusers",
    nps: 12,
    pipeClass: "COFA",
    schedule: "10",
    material: "ASTM A106 Gr.B, epoxy lined",
    length_m: 132,
    designT_C: 90,
    designP_barg: 1.2,
    // Blower discharge runs at 90 °C: insulated at 50 mm to keep the surface below
    // 60 °C where the header crosses walkways (ME-SPE-0014 §6.2).
    insulation_mm: 50,
    tracing: "none",
    valves: [
      { type: "butterfly", qty: 4, actuator: "manual" },
      { type: "check", qty: 2 },
      { type: "butterfly", qty: 2, actuator: "pneumatic" },
    ],
    area: "40",
    zone: "Zone 2",
  },
  {
    lineNo: '10"-BW-6002-A1A',
    service: "Filter backwash water and air scour",
    from: "P-6001",
    to: "V-6001/V-6010",
    nps: 10,
    pipeClass: "COFA",
    schedule: "40",
    material: "ASTM A106 Gr.B",
    length_m: 66,
    designT_C: 40,
    designP_barg: 6,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "butterfly", qty: 4, actuator: "pneumatic" },
      { type: "check", qty: 2 },
    ],
    area: "60",
    zone: "Zone 2",
  },
  {
    lineNo: '3"-CI-7004-B1A',
    service: "CIP caustic / acid circulation",
    from: "CIP-7001",
    to: "UF-7001 / RO-7001",
    nps: 3,
    pipeClass: "NOAA",
    schedule: "10",
    material: "ASTM A312 TP316L",
    length_m: 74,
    designT_C: 60,
    designP_barg: 6,
    insulation_mm: 0,
    tracing: "none",
    valves: [
      { type: "ball", qty: 6, actuator: "manual" },
      { type: "check", qty: 2 },
    ],
    area: "70",
    zone: "Zone 2",
  },
  {
    lineNo: '1"-DR-9902-B1A',
    service: "Chemical drain to neutralisation",
    from: "Area 10 sump",
    to: "V-1001",
    nps: 1,
    pipeClass: "NOAB",
    schedule: "80",
    material: "ASTM A312 TP316L",
    length_m: 58,
    designT_C: 60,
    designP_barg: 2,
    insulation_mm: 0,
    tracing: "none",
    valves: [{ type: "ball", qty: 4, actuator: "manual" }],
    area: "10",
    zone: "Zone 2",
  },
];

export interface LineTakeoff {
  lineNo: string;
  service: string;
  nps: number;
  pipeClass: PipeClassKey;
  schedule: Schedule;
  material: string;
  length_m: number;
  wall_mm: number;
  kg_per_m: number;
  pipe_t: number;
  fittings_t: number;
  flanges: number;
  gaskets: number;
  bolts: number;
  valves: number;
  supports: number;
  paint_m2: number;
  insul_m2: number;
  insulation_mm: number;
  testP_barg: number;
}

/** Flange count: two line-end connections plus two per in-line valve. */
function flangesFor(l: PipeLine): number {
  const inLine = l.valves.reduce((a, v) => a + v.qty, 0);
  return 2 + 2 * inLine;
}

export const lineTakeoff: LineTakeoff[] = pipeLines.map((l) => {
  const wall = scheduleThickness(l.nps, l.schedule);
  const kgm = massPerMetre(l.nps, l.schedule, l.material);
  const pipe_t = (kgm * l.length_m) / 1000;
  const flanges = flangesFor(l);
  const od_m = outsideDiameter(l.nps) / 1000;
  const valveCount = l.valves.reduce((a, v) => a + v.qty, 0);
  return {
    lineNo: l.lineNo,
    service: l.service,
    nps: l.nps,
    pipeClass: l.pipeClass,
    schedule: l.schedule,
    material: l.material,
    length_m: l.length_m,
    wall_mm: wall,
    kg_per_m: +kgm.toFixed(1),
    pipe_t: +pipe_t.toFixed(2),
    fittings_t: +(pipe_t * 0.08).toFixed(2),
    flanges,
    gaskets: flanges,
    bolts: flanges * 8,
    valves: valveCount,
    supports: Math.ceil(l.length_m / 6) + 1,
    paint_m2: +(Math.PI * od_m * l.length_m).toFixed(1),
    insul_m2:
      l.insulation_mm > 0
        ? +(Math.PI * (od_m + (2 * l.insulation_mm) / 1000) * l.length_m).toFixed(1)
        : 0,
    insulation_mm: l.insulation_mm,
    testP_barg: +(l.designP_barg * 1.5).toFixed(1),
  };
});

export const pipingSummary = (() => {
  const length = pipeLines.reduce((a, l) => a + l.length_m, 0);
  const pipe_t = lineTakeoff.reduce((a, r) => a + r.pipe_t, 0);
  const fittings_t = lineTakeoff.reduce((a, r) => a + r.fittings_t, 0);
  const flanges = lineTakeoff.reduce((a, r) => a + r.flanges, 0);
  const valves = lineTakeoff.reduce((a, r) => a + r.valves, 0);
  const supports = lineTakeoff.reduce((a, r) => a + r.supports, 0);
  const paint = lineTakeoff.reduce((a, r) => a + r.paint_m2, 0);
  const insul = lineTakeoff.reduce((a, r) => a + r.insul_m2, 0);
  const largest = [...pipeLines].sort((a, b) => b.nps - a.nps)[0];
  const heaviest = [...lineTakeoff].sort((a, b) => b.pipe_t - a.pipe_t)[0];
  return {
    lines: pipeLines.length,
    length_m: +length.toFixed(0),
    pipe_t: +pipe_t.toFixed(1),
    fittings_t: +fittings_t.toFixed(1),
    flanges,
    gaskets: flanges,
    bolts: flanges * 8,
    valves,
    supports,
    paint_m2: +paint.toFixed(0),
    insulation_m2: +insul.toFixed(0),
    largest_line: largest.lineNo,
    heaviest_line: heaviest.lineNo,
    heaviest_t: heaviest.pipe_t,
  };
})();

/** Bulk pipe by size — the table the mill and the spool shop quote against. */
export const pipeBySize = (() => {
  const sizes = [...new Set(pipeLines.map((l) => l.nps))].sort((a, b) => a - b);
  return sizes.map((nps) => {
    const rows = lineTakeoff.filter((r) => r.nps === nps);
    return {
      nps,
      od_mm: outsideDiameter(nps),
      length_m: rows.reduce((a, r) => a + r.length_m, 0),
      lines: rows.length,
      pipe_t: +rows.reduce((a, r) => a + r.pipe_t, 0).toFixed(2),
      supports: rows.reduce((a, r) => a + r.supports, 0),
      flanges: rows.reduce((a, r) => a + r.flanges, 0),
    };
  });
})();

/** Bulk pipe by material specification / class. */
export const pipeByClass = (() => {
  const classes = [...new Set(pipeLines.map((l) => l.pipeClass))] as PipeClassKey[];
  return classes.map((cls) => {
    const rows = lineTakeoff.filter((r) => r.pipeClass === cls);
    return {
      pipeClass: cls,
      lines: rows.length,
      length_m: rows.reduce((a, r) => a + r.length_m, 0),
      pipe_t: +rows.reduce((a, r) => a + r.pipe_t, 0).toFixed(2),
      valves: rows.reduce((a, r) => a + r.valves, 0),
      insulation_m2: +rows.reduce((a, r) => a + r.insul_m2, 0).toFixed(1),
    };
  });
})();

export interface ValveRow {
  type: ValveType;
  qty: number;
  actuated: number;
  manual: number;
  sizes: number[];
  classes: PipeClassKey[];
  services: string[];
}

export const valveSchedule: ValveRow[] = (() => {
  const types = [...new Set(pipeLines.flatMap((l) => l.valves.map((v) => v.type)))];
  return types
    .map((type) => {
      const rows = pipeLines.filter((l) => l.valves.some((v) => v.type === type));
      const qty = rows.reduce(
        (a, l) => a + l.valves.filter((v) => v.type === type).reduce((b, v) => b + v.qty, 0),
        0,
      );
      const actuated = rows.reduce(
        (a, l) =>
          a +
          l.valves
            .filter((v) => v.type === type && v.actuator && v.actuator !== "manual")
            .reduce((b, v) => b + v.qty, 0),
        0,
      );
      return {
        type,
        qty,
        actuated,
        manual: qty - actuated,
        sizes: [...new Set(rows.map((l) => l.nps))].sort((a, b) => a - b),
        classes: [...new Set(rows.map((l) => l.pipeClass))] as PipeClassKey[],
        services: rows.slice(0, 3).map((l) => l.service),
      };
    })
    .sort((a, b) => b.qty - a.qty);
})();

export const valveTotals = {
  qty: valveSchedule.reduce((a, v) => a + v.qty, 0),
  actuated: valveSchedule.reduce((a, v) => a + v.actuated, 0),
  manual: valveSchedule.reduce((a, v) => a + v.manual, 0),
  types: valveSchedule.length,
  psv: valveSchedule.find((v) => v.type === "PSV")?.qty ?? 0,
  control: valveSchedule.find((v) => v.type === "control")?.qty ?? 0,
};

/** Longest single spool between field joints, used for the hydrotest pack sizes. */
export const hydrotestPacks = (() => {
  const byArea = [...new Set(pipeLines.map((l) => l.area))].sort();
  return byArea.map((area) => {
    const rows = lineTakeoff.filter((r) => pipeLines.find((l) => l.lineNo === r.lineNo)?.area === area);
    const l = pipeLines.filter((x) => x.area === area);
    return {
      area,
      lines: l.length,
      length_m: l.reduce((a, x) => a + x.length_m, 0),
      testP_barg: +Math.max(...l.map((x) => x.designP_barg * 1.5)).toFixed(1),
      volume_m3: +(
        l.reduce((a, x) => {
          const id = (outsideDiameter(x.nps) - 2 * scheduleThickness(x.nps, x.schedule)) / 1000;
          return a + (Math.PI * id * id * x.length_m) / 4;
        }, 0)
      ).toFixed(2),
      flanges: rows.reduce((a, r) => a + r.flanges, 0),
    };
  });
})();
