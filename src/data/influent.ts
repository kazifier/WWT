/**
 * Inlet waste water characterisation — RFQ §7.
 * Four sources, 23 parameters, flow-weighted blending computed (not typed in).
 */

export interface WasteStream {
  id: string;
  name: string;
  flow_m3h: number;
  source: string;
}

export const streams: WasteStream[] = [
  { id: "s1", name: "CDU unit", flow_m3h: 50, source: "RFQ §7 col. Value 1" },
  { id: "s2", name: "Oil storage area", flow_m3h: 80, source: "RFQ §7 col. Value 2" },
  { id: "s3", name: "Process drain", flow_m3h: 250, source: "RFQ §7 col. Value 3" },
  { id: "s4", name: "Chemical drain (acid/alkaline/foam)", flow_m3h: 120, source: "RFQ §7 col. Value 4" },
];

export interface Parameter {
  key: string;
  label: string;
  unit: string;
  /** per-stream values in the order CDU, Oil storage, Process drain, Chemical drain */
  values: [number, number, number, number];
  /** true when a flow-weighted arithmetic mean is meaningless (e.g. pH) */
  nonAdditive?: boolean;
}

export const inletParameters: Parameter[] = [
  { key: "flow", label: "Flow", unit: "m³/h", values: [50, 80, 250, 120] },
  { key: "ss", label: "Suspended solids", unit: "mg/L", values: [700, 500, 350, 150] },
  { key: "og", label: "Oil & grease", unit: "mg/L", values: [1500, 800, 500, 50] },
  { key: "tds", label: "Total dissolved solids", unit: "mg/L", values: [4500, 2500, 3500, 6000] },
  { key: "s2", label: "S²⁻ / H₂S", unit: "mg/L", values: [60, 5, 25, 100] },
  { key: "cod", label: "COD", unit: "mg/L", values: [2000, 1500, 1000, 3000] },
  { key: "bod", label: "BOD", unit: "mg/L", values: [500, 450, 400, 600] },
  { key: "so4", label: "Sulphate SO₄²⁻", unit: "mg/L", values: [350, 300, 500, 2000] },
  { key: "cl", label: "Chlorides", unit: "mg/L", values: [2200, 1000, 1400, 2000] },
  { key: "ph", label: "pH", unit: "—", values: [7.5, 7.5, 7.5, 7.5], nonAdditive: true },
  { key: "phenol", label: "Phenol C₆H₅OH", unit: "mg/L", values: [50, 5, 50, 50] },
  { key: "cond", label: "Conductivity", unit: "µS/cm", values: [6500, 4000, 5200, 12000] },
  { key: "nh3", label: "NH₃", unit: "mg/L", values: [80, 10, 50, 50] },
  { key: "no2", label: "NO₂", unit: "mg/L", values: [0.5, 0.2, 0.5, 0.5] },
  { key: "no3", label: "NO₃", unit: "mg/L", values: [2, 1, 3, 3] },
  { key: "so3", label: "SO₃", unit: "mg/L", values: [20, 5, 15, 15] },
  { key: "pb", label: "Lead (Pb)", unit: "mg/L", values: [0.05, 0.1, 0.08, 0.1] },
  { key: "cr", label: "Chromium (Cr)", unit: "mg/L", values: [0.1, 0.05, 0.1, 0.1] },
  { key: "ca", label: "Calcium as CaCO₃", unit: "mg/L", values: [350, 250, 300, 300] },
  { key: "mg", label: "Magnesium as CaCO₃", unit: "mg/L", values: [180, 100, 150, 150] },
  { key: "na", label: "Sodium as CaCO₃", unit: "mg/L", values: [1800, 700, 1100, 1100] },
  { key: "hco", label: "Bicarbonate as CaCO₃", unit: "mg/L", values: [250, 200, 250, 250] },
  { key: "fe", label: "Iron as CaCO₃", unit: "mg/L", values: [3, 5, 4, 5] },
];

/** Flow-weighted blend of the four sources. */
export function blendedConcentration(p: Parameter): number {
  const totalFlow = streams.reduce((a, s) => a + s.flow_m3h, 0);
  if (p.nonAdditive) return p.values.reduce((a, v) => a + v, 0) / p.values.length;
  return p.values.reduce((a, v, i) => a + v * streams[i].flow_m3h, 0) / totalFlow;
}

export function blendedAll(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of inletParameters) out[p.key] = blendedConcentration(p);
  return out;
}

export const totalInletFlow = streams.reduce((a, s) => a + s.flow_m3h, 0);

/** Mass load in kg/h for a given blended concentration (mg/L × m³/h / 1000). */
export function massLoad(mgPerL: number, flow_m3h: number): number {
  return (mgPerL * flow_m3h) / 1000;
}

/** River discharge standards — RFQ §8 (Option 1). */
export interface LimitRow {
  no: number;
  parameter: string;
  unit: string;
  limit: string;
  numeric: number | null;
  note?: string;
}

export const riverLimits: LimitRow[] = [
  { no: 1, parameter: "Colour", unit: "—", limit: "Not objectionable", numeric: null },
  { no: 2, parameter: "Temperature", unit: "°C", limit: "< 35", numeric: 35 },
  { no: 3, parameter: "Suspended solids", unit: "mg/L", limit: "60", numeric: 60 },
  { no: 4, parameter: "pH", unit: "—", limit: "6.0 – 9.5", numeric: 9.5 },
  { no: 5, parameter: "Dissolved oxygen", unit: "mg/L", limit: "Report", numeric: null },
  { no: 6, parameter: "BOD₅", unit: "mg/L", limit: "< 40", numeric: 40 },
  { no: 7, parameter: "COD (Cr₂O₇)", unit: "mg/L", limit: "< 100", numeric: 100 },
  { no: 8, parameter: "Cyanide (CN⁻)", unit: "mg/L", limit: "0.05", numeric: 0.05 },
  { no: 9, parameter: "Fluoride (F⁻)", unit: "mg/L", limit: "5.0", numeric: 5.0 },
  { no: 10, parameter: "Free chlorine (Cl₂)", unit: "mg/L", limit: "Trace", numeric: 0.5 },
  { no: 11, parameter: "Chloride (Cl⁻)", unit: "mg/L", limit: "600", numeric: 600, note: "Inlet 1,560 mg/L — not met biologically" },
  { no: 12, parameter: "Phenol", unit: "mg/L", limit: "0.01 – 0.05", numeric: 0.05, note: "Inlet 42.8 mg/L" },
  { no: 13, parameter: "Sulphate (SO₄²⁻)", unit: "mg/L", limit: "400", numeric: 400, note: "Inlet 813 mg/L — not met biologically" },
  { no: 14, parameter: "Nitrate (NO₃⁻)", unit: "mg/L", limit: "50", numeric: 50 },
  { no: 15, parameter: "Phosphate (PO₄³⁻)", unit: "mg/L", limit: "3", numeric: 3 },
  { no: 16, parameter: "Ammonium (NH₄⁺)", unit: "mg/L", limit: "Report", numeric: null },
  { no: 17, parameter: "Pesticide (DDT)", unit: "mg/L", limit: "Zero", numeric: 0 },
  { no: 18, parameter: "Lead (Pb)", unit: "mg/L", limit: "0.1", numeric: 0.1 },
  { no: 19, parameter: "Arsenic (As)", unit: "mg/L", limit: "0.05", numeric: 0.05 },
  { no: 20, parameter: "Copper (Cu)", unit: "mg/L", limit: "0.2", numeric: 0.2 },
  { no: 21, parameter: "Nickel (Ni)", unit: "mg/L", limit: "0.2", numeric: 0.2 },
  { no: 22, parameter: "Selenium (Se)", unit: "mg/L", limit: "0.05", numeric: 0.05 },
  { no: 23, parameter: "Mercury (Hg)", unit: "mg/L", limit: "0.005", numeric: 0.005 },
  { no: 24, parameter: "Cadmium (Cd)", unit: "mg/L", limit: "0.01", numeric: 0.01 },
  { no: 25, parameter: "Zinc (Zn)", unit: "mg/L", limit: "0.2", numeric: 0.2 },
  { no: 26, parameter: "Chromium (Cr)", unit: "mg/L", limit: "0.1", numeric: 0.1 },
  { no: 27, parameter: "Aluminium (Al)", unit: "mg/L", limit: "5", numeric: 5 },
  { no: 28, parameter: "Barium (Ba)", unit: "mg/L", limit: "4", numeric: 4 },
  { no: 29, parameter: "Boron (B)", unit: "mg/L", limit: "1", numeric: 1 },
  { no: 30, parameter: "Cobalt (Co)", unit: "mg/L", limit: "0.5", numeric: 0.5 },
  { no: 31, parameter: "Iron (Fe)", unit: "mg/L", limit: "2", numeric: 2 },
  { no: 32, parameter: "Manganese (Mn)", unit: "mg/L", limit: "0.5", numeric: 0.5 },
  { no: 33, parameter: "Silver (Ag)", unit: "mg/L", limit: "0.05", numeric: 0.05 },
  { no: 34, parameter: "Total hydrocarbons", unit: "mg/L", limit: "10", numeric: 10 },
  { no: 35, parameter: "Sulphide", unit: "mg/L", limit: "Not stated", numeric: null, note: "Blank in RFQ — see CL-004" },
];

/** Reuse standard — RFQ §9 (Option 2, RO feed). */
export const reuseLimits: { parameter: string; unit: string; limit: string; design: number }[] = [
  { parameter: "pH", unit: "—", limit: "6.5 – 8.5", design: 7.5 },
  { parameter: "Turbidity", unit: "NTU", limit: "VTA", design: 1 },
  { parameter: "Conductivity", unit: "µS/cm", limit: "≤ 1000", design: 1000 },
  { parameter: "Total hardness", unit: "mg/L as CaCO₃", limit: "≤ 450", design: 450 },
  { parameter: "Chloride", unit: "mg/L", limit: "≤ 250", design: 250 },
  { parameter: "Sulphate", unit: "mg/L", limit: "≤ 250", design: 250 },
  { parameter: "Reactive silica (SiO₂)", unit: "mg/L", limit: "≤ 30", design: 30 },
  { parameter: "Iron", unit: "mg/L", limit: "≤ 0.3", design: 0.3 },
  { parameter: "Sulphide", unit: "mg/L", limit: "0", design: 0.1 },
  { parameter: "Ammonium (NH₄)", unit: "mg/L", limit: "≤ 0.5", design: 0.5 },
  { parameter: "Residual chlorine", unit: "mg/L", limit: "≤ 2", design: 2 },
  { parameter: "Acid consumption (pH 4.8)", unit: "mg/L as CaCO₃", limit: "≤ 3", design: 3 },
];
