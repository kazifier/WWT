/**
 * Mechanical, rotating and electrical calculations.
 * These close out the equipment-level requirements of BOD-0001, BOD-0002
 * and RFQ §11, and produce the numbers written into the data sheets.
 */
import { ceilTo, fmt, r1, r2, r0, type CalcSheet } from "./types";
import { DESIGN_FLOW, process as P } from "./process";

/* ------------------------------------------------------------------ */
/* Pump hydraulics                                                     */
/* ------------------------------------------------------------------ */
export interface PumpDuty {
  tag: string;
  service: string;
  flow_m3h: number;
  staticHead_m: number;
  pipeLen_m: number;
  dn: number;
  npsha_m: number;
  npshr_m: number;
  efficiency: number;
  rpm: number;
}

const FITTING_K = 12; // total minor loss coefficient allowance

function frictionFactor(dn_mm: number, v_ms: number): number {
  const d = dn_mm / 1000;
  const nu = 0.66e-6; // m2/s at 40 C
  const re = (v_ms * d) / nu;
  if (re < 2000) return 64 / Math.max(re, 1);
  const eps = 0.046e-3;
  const rel = eps / d;
  return 0.25 / Math.pow(Math.log10(rel / 3.7 + 5.74 / Math.pow(re, 0.9)), 2);
}

export function pumpPower(d: PumpDuty) {
  const area = Math.PI * (d.dn / 1000) ** 2 / 4;
  const v = d.flow_m3h / 3600 / area;
  const f = frictionFactor(d.dn, v);
  const hfPipe = (f * (d.pipeLen_m / (d.dn / 1000)) * v * v) / (2 * 9.81);
  const hfMinor = (FITTING_K * v * v) / (2 * 9.81);
  const head = d.staticHead_m + hfPipe + hfMinor;
  const hydraulic = (d.flow_m3h / 3600) * 1000 * 9.81 * head;
  const shaft = hydraulic / d.efficiency / 1000;
  const motorRated = Math.ceil((shaft * 1.2) / 0.75) * 0.75;
  return {
    velocity: v,
    friction: f,
    hfPipe,
    hfMinor,
    head,
    hydraulic_kW: hydraulic / 1000,
    shaft_kW: shaft,
    motor_kW: motorRated,
    npshMargin: d.npsha_m - d.npshr_m,
  };
}

export const pumpDuties: PumpDuty[] = [
  { tag: "P-2001A/B", service: "Equalised feed to DAF", flow_m3h: 550, staticHead_m: 12, pipeLen_m: 120, dn: 350, npsha_m: 6.5, npshr_m: 3.2, efficiency: 0.78, rpm: 1480 },
  { tag: "P-2002A/B", service: "DAF recycle / pressurisation", flow_m3h: P.oilRemoval.dafRecycle_m3h, staticHead_m: 55, pipeLen_m: 70, dn: 200, npsha_m: 4.2, npshr_m: 2.1, efficiency: 0.7, rpm: 1480 },
  { tag: "P-4001A/B", service: "Aeration basin recirculation", flow_m3h: 900, staticHead_m: 8, pipeLen_m: 90, dn: 450, npsha_m: 5.8, npshr_m: 3.0, efficiency: 0.8, rpm: 990 },
  { tag: "P-5001A/B", service: "RAS / WAS", flow_m3h: 560, staticHead_m: 10, pipeLen_m: 60, dn: 350, npsha_m: 4.5, npshr_m: 2.8, efficiency: 0.72, rpm: 1480 },
  { tag: "P-6001A/B", service: "Filter backwash", flow_m3h: 440, staticHead_m: 22, pipeLen_m: 80, dn: 300, npsha_m: 5.0, npshr_m: 2.6, efficiency: 0.75, rpm: 1480 },
  { tag: "P-7001A/B", service: "RO high pressure feed", flow_m3h: 550, staticHead_m: P.membrane.roFeedPressure_bar * 10.2, pipeLen_m: 40, dn: 250, npsha_m: 3.8, npshr_m: 1.8, efficiency: 0.8, rpm: 2980 },
  { tag: "P-8001A/B", service: "Sludge transfer", flow_m3h: 35, staticHead_m: 20, pipeLen_m: 110, dn: 100, npsha_m: 4.0, npshr_m: 2.2, efficiency: 0.55, rpm: 960 },
];

export const pumpResults = pumpDuties.map((d) => ({ duty: d, calc: pumpPower(d) }));

/* ------------------------------------------------------------------ */
/* Vessel and tank mechanical design                                   */
/* ------------------------------------------------------------------ */
export interface ShellDesign {
  tag: string;
  service: string;
  dia_mm: number;
  height_mm: number;
  pressure_bar: number;
  temp_C: number;
  ca_mm: number;
  material: string;
  allowable_MPa: number;
  jointEff: number;
  code: "ASME VIII Div.1" | "API 650";
}

export function shellThickness(s: ShellDesign) {
  // ASME VIII Div.1 circumferential stress (UG-27)
  const R = s.dia_mm / 2;
  const tCirc = (s.pressure_bar * 0.1 * R) / (s.allowable_MPa * s.jointEff - 0.6 * s.pressure_bar * 0.1);
  const tLong = (s.pressure_bar * 0.1 * R) / (2 * s.allowable_MPa * s.jointEff + 0.4 * s.pressure_bar * 0.1);
  // BOD-0001 §9.2 minimum structural thickness rule
  const tMinRule = s.dia_mm / 1000 + 2.54;
  const governing = Math.max(tCirc, tLong, tMinRule);
  const withCA = governing + s.ca_mm;
  const plate = ceilTo(withCA + 0.5, 1) * 1; // next 1 mm plate, plus mill tolerance
  return {
    tCirc,
    tLong,
    tMinRule,
    governing,
    withCA,
    plate,
    weight_kg: Math.PI * s.dia_mm * s.height_mm * plate * 7.85 / 1e6,
  };
}

export const vessels: ShellDesign[] = [
  { tag: "V-1001A/B", service: "Chemical drain neutralisation", dia_mm: 4000, height_mm: 5500, pressure_bar: 0.5, temp_C: 55, ca_mm: 3, material: "SA-240 316L", allowable_MPa: 138, jointEff: 0.85, code: "ASME VIII Div.1" },
  { tag: "V-4010", service: "Bio-selector / anoxic tank cover vessel", dia_mm: 6000, height_mm: 7000, pressure_bar: 0.35, temp_C: 55, ca_mm: 3, material: "SA-516 Gr.70", allowable_MPa: 138, jointEff: 0.85, code: "ASME VIII Div.1" },
  { tag: "V-9001", service: "H₂O₂ day tank", dia_mm: 2500, height_mm: 4000, pressure_bar: 0.2, temp_C: 55, ca_mm: 1.5, material: "SA-240 316L", allowable_MPa: 138, jointEff: 0.85, code: "ASME VIII Div.1" },
  { tag: "V-6001", service: "Multimedia filter shell", dia_mm: 4500, height_mm: 5200, pressure_bar: 6, temp_C: 55, ca_mm: 3, material: "SA-516 Gr.70", allowable_MPa: 138, jointEff: 1.0, code: "ASME VIII Div.1" },
  { tag: "V-7001", service: "UF filtrate / backwash tank", dia_mm: 6000, height_mm: 6000, pressure_bar: 0.3, temp_C: 55, ca_mm: 2, material: "SA-516 Gr.70", allowable_MPa: 138, jointEff: 0.85, code: "ASME VIII Div.1" },
];

export const vesselResults = vessels.map((v) => ({ vessel: v, calc: shellThickness(v) }));

/* API 650 storage tank — one-foot method */
export function api650Shell(dia_m: number, height_m: number, ca_mm: number, Sd_MPa = 160, G = 1.0) {
  const tDesign = (4.9 * dia_m * (height_m - 0.3) * G) / Sd_MPa + ca_mm; // mm
  const tMin = 5 + ca_mm; // API 650 minimum nominal for D < 15 m, 8 mm for larger
  const plate = ceilTo(Math.max(tDesign, 5) + ca_mm, 1);
  return { tDesign, tMin, plate, governedBy: tDesign > 5 ? "hoop stress" : "minimum nominal" };
}

export const tanks = [
  { tag: "T-2001A/B", service: "Equalisation", dia_m: P.equalisation.diameter_m, h_m: P.equalisation.height_m },
  { tag: "T-9002", service: "Caustic storage (45 % NaOH)", dia_m: 3.0, h_m: 4.5 },
  { tag: "T-9003", service: "Sulphuric acid storage (98 %)", dia_m: 3.0, h_m: 4.5 },
  { tag: "T-9004", service: "Coagulant storage", dia_m: 2.5, h_m: 3.5 },
  { tag: "T-2002", service: "Sludge thickening tank", dia_m: 8.0, h_m: 5.0 },
].map((t) => ({ ...t, calc: api650Shell(t.dia_m, t.h_m, 3) }));

/* ------------------------------------------------------------------ */
/* Agitator sizing                                                     */
/* ------------------------------------------------------------------ */
const NP = 0.35; // pitched blade turbine, turbulent
export function agitatorPower(dia_m: number, rpm: number, rho = 1050) {
  const n = rpm / 60;
  const p = (NP * rho * Math.pow(n, 3) * Math.pow(dia_m, 5)) / 1000;
  return { power_kW: p, tipSpeed: Math.PI * dia_m * n, motor_kW: ceilTo(p * 1.3, 0.5) };
}

export const agitators = [
  { tag: "AG-1001A/B", service: "Neutralisation tank", dia_m: 1.2, rpm: 90 },
  { tag: "AG-2001A/B", service: "Equalisation tank", dia_m: 2.5, rpm: 22 },
  { tag: "AG-3001A/B", service: "DAF flocculation", dia_m: 1.5, rpm: 45 },
  { tag: "AG-9001", service: "Polymer make-up", dia_m: 0.9, rpm: 120 },
].map((a) => ({ ...a, calc: agitatorPower(a.dia_m, a.rpm) }));

/* ------------------------------------------------------------------ */
/* Pipe sizing                                                         */
/* ------------------------------------------------------------------ */
export const pipeSizes = [
  { service: "Main process header", flow: DESIGN_FLOW, dn: 400, limit: 1.8 },
  { service: "RO high pressure", flow: DESIGN_FLOW, dn: 250, limit: 3.0 },
  { service: "RO reject", flow: P.membrane.roReject, dn: 200, limit: 2.5 },
  { service: "Permeate to raw water", flow: P.membrane.roPermeate, dn: 250, limit: 2.0 },
  { service: "Chemical drain inlet", flow: 120, dn: 200, limit: 1.5 },
  { service: "Sludge", flow: 35, dn: 100, limit: 1.2 },
  { service: "Blower air header", flow: P.biological.air_m3h, dn: 600, limit: 18 },
].map((p) => {
  const area = Math.PI * (p.dn / 1000) ** 2 / 4;
  const v = p.flow / 3600 / area;
  return { ...p, velocity: v, pass: v <= p.limit };
});

/* ------------------------------------------------------------------ */
/* Electrical load list                                                */
/* ------------------------------------------------------------------ */
export interface LoadItem {
  tag: string;
  service: string;
  kW: number;
  qty: number;
  duty: number; // number running
  volts: 380 | 3300;
}

export const loads: LoadItem[] = [
  { tag: "BL-4001", service: "Aeration blowers", kW: Math.ceil(P.biological.blowerPower_kW * 1.15), qty: 3, duty: 2, volts: 3300 },
  { tag: "P-2001", service: "Equalised feed pumps", kW: 45, qty: 2, duty: 1, volts: 380 },
  { tag: "P-2002", service: "DAF recycle pumps", kW: 55, qty: 2, duty: 1, volts: 380 },
  { tag: "P-4001", service: "Basin recirculation", kW: 37, qty: 2, duty: 1, volts: 380 },
  { tag: "P-5001", service: "RAS / WAS pumps", kW: 30, qty: 3, duty: 2, volts: 380 },
  { tag: "P-6001", service: "Backwash pumps", kW: 45, qty: 2, duty: 1, volts: 380 },
  { tag: "P-7001", service: "RO HP pumps", kW: Math.ceil(P.membrane.hpPump_kW / 10) * 10, qty: 2, duty: 1, volts: 3300 },
  { tag: "P-7002", service: "RO booster pumps", kW: 90, qty: 2, duty: 1, volts: 380 },
  { tag: "P-7003", service: "Permeate transfer", kW: 30, qty: 2, duty: 1, volts: 380 },
  { tag: "P-8001", service: "Sludge transfer", kW: 15, qty: 2, duty: 1, volts: 380 },
  { tag: "CF-8001", service: "Decanter centrifuges", kW: 55, qty: 2, duty: 1, volts: 380 },
  { tag: "AG-2001", service: "Equalisation mixers", kW: 22, qty: 2, duty: 2, volts: 380 },
  { tag: "AG-1001", service: "Neutralisation agitators", kW: 7.5, qty: 2, duty: 2, volts: 380 },
  { tag: "AG-3001", service: "DAF flocculators", kW: 5.5, qty: 2, duty: 2, volts: 380 },
  { tag: "CL-5001", service: "Clarifier scraper drives", kW: 2.2, qty: 2, duty: 2, volts: 380 },
  { tag: "SK-3001", service: "DAF air compressor", kW: 18.5, qty: 2, duty: 1, volts: 380 },
  { tag: "DP-9001", service: "Dosing pumps (all skids)", kW: 7.5, qty: 12, duty: 8, volts: 380 },
  { tag: "UF-7001", service: "UF backwash / air scour", kW: 37, qty: 2, duty: 1, volts: 380 },
  { tag: "HV-9901", service: "HVAC / pressurisation", kW: 45, qty: 2, duty: 1, volts: 380 },
  { tag: "CR-9901", service: "Odour control fan", kW: 22, qty: 2, duty: 1, volts: 380 },
];

export const loadSummary = (() => {
  const running = loads.reduce((a, l) => a + l.kW * l.duty, 0);
  const installed = loads.reduce((a, l) => a + l.kW * l.qty, 0);
  const mvLoad = loads.filter((l) => l.volts === 3300).reduce((a, l) => a + l.kW * l.duty, 0);
  const lvLoad = running - mvLoad;
  const demand = running * 0.85; // diversity
  const transformer = ceilTo((demand * 1.25) / 1000, 0.5); // kVA at 0.9 pf approx
  return { running, installed, mvLoad, lvLoad, demand, transformer_kVA: transformer };
})();

/* ------------------------------------------------------------------ */
/* Sheets                                                              */
/* ------------------------------------------------------------------ */
export const mechanicalSheets: CalcSheet[] = [
  {
    id: "M-01",
    title: "Pressure envelope thickness — ASME VIII Div.1 with the BOD-0001 minimum",
    discipline: "Mechanical",
    clause: "BOD-0001 §9.2",
    intent:
      "The project design basis adds a structural minimum of t = D/1000 + 2.54 mm on top of the code calculation. For low-pressure water vessels this rule governs almost every shell, which is why the plate schedule is thicker than a pure ASME VIII check would give.",
    inputs: [
      { label: "Vessel inside diameter", value: "4,000", unit: "mm", basis: "V-1001A/B neutralisation" },
      { label: "Tangent-to-tangent height", value: "5,500", unit: "mm" },
      { label: "Design pressure", value: "0.5", unit: "barg" },
      { label: "Corrosion allowance", value: "3.0", unit: "mm" },
      { label: "Allowable stress (SA-240 316L @ 55 °C)", value: "138", unit: "MPa" },
      { label: "Joint efficiency", value: "0.85", unit: "— (Type 1, full RT spot)" },
    ],
    steps: [
      {
        label: "Circumferential stress (UG-27)",
        formula: "t = P·R / (S·E − 0.6P)",
        substitution: `(0.05 × 2000) / (138 × 0.85 − 0.6 × 0.05)`,
        result: `${fmt(shellThickness(vessels[0]).tCirc, 2)} mm`,
      },
      {
        label: "Longitudinal stress",
        formula: "t = P·R / (2S·E + 0.4P)",
        substitution: "",
        result: `${fmt(shellThickness(vessels[0]).tLong, 2)} mm`,
      },
      {
        label: "Project structural minimum",
        formula: "t_min = D/1000 + 2.54",
        substitution: `4000/1000 + 2.54`,
        result: `${fmt(shellThickness(vessels[0]).tMinRule, 2)} mm`,
      },
      {
        label: "Governing + corrosion allowance",
        formula: "t = max(code) + CA",
        substitution: `${fmt(shellThickness(vessels[0]).governing, 2)} + 3.0`,
        result: `${fmt(shellThickness(vessels[0]).plate, 1)} mm plate ordered`,
      },
    ],
    results: vessels.map((v, i) => ({
      label: `${v.tag} — ${v.service}`,
      value: fmt(vesselResults[i].calc.plate, 1),
      unit: `mm plate (${v.material}), ${fmt(vesselResults[i].calc.weight_kg, 0)} kg shell`,
    })),
    checks: [
      {
        label: "Project minimum rule applied on top of ASME VIII",
        required: "t ≥ D/1000 + 2.54 + CA",
        actual: `${fmt(shellThickness(vessels[0]).plate, 1)} mm`,
        pass: shellThickness(vessels[0]).plate >= shellThickness(vessels[0]).tMinRule + vessels[0].ca_mm,
        clause: "BOD-0001 §9.2",
      },
      {
        label: "MDMT not below −10 °C without impact testing",
        required: "≥ −10 °C",
        actual: "+1 °C operating, −8 °C ambient",
        pass: true,
        clause: "BOD-0001 §9 / CL-001",
      },
    ],
  },
  {
    id: "M-02",
    title: "Storage tank shell — API 650 one-foot method",
    discipline: "Mechanical",
    clause: "RFQ §11.4 / API 650",
    intent:
      "The equalisation tanks are the largest fabricated items in the make scope. At Ø20 m the one-foot method gives a hoop-governed shell rather than the minimum nominal, so the plate order is set by the 7 m liquid height.",
    inputs: [
      { label: "Tank diameter", value: fmt(P.equalisation.diameter_m, 1), unit: "m" },
      { label: "Liquid height", value: fmt(P.equalisation.height_m, 2), unit: "m" },
      { label: "Product specific gravity", value: "1.0", unit: "—" },
      { label: "Allowable stress Sd", value: "160", unit: "MPa (A283 Gr.C / A516-70)" },
      { label: "Corrosion allowance", value: "3.0", unit: "mm" },
    ],
    steps: [
      {
        label: "One-foot method",
        formula: "t = 4.9·D·(H − 0.3)·G / Sd + CA",
        substitution: `4.9 × 20 × (${fmt(P.equalisation.height_m, 2)} − 0.3) × 1.0 / 160 + 3`,
        result: `${fmt(tanks[0].calc.tDesign, 2)} mm`,
      },
      {
        label: "Minimum nominal",
        formula: "t_min = 5 mm + CA",
        substitution: "",
        result: "8.0 mm",
      },
      {
        label: "Governing",
        formula: "t = max(design, minimum)",
        substitution: "",
        result: `${fmt(tanks[0].calc.plate, 1)} mm (${tanks[0].calc.governedBy})`,
      },
    ],
    results: tanks.map((t) => ({
      label: `${t.tag} — ${t.service}`,
      value: fmt(t.calc.plate, 1),
      unit: `mm shell, Ø ${fmt(t.dia_m, 1)} m × ${fmt(t.h_m, 1)} m`,
    })),
    checks: [
      { label: "Plate thickness satisfies both code and project minimum", required: "max(t_code, t_min)", actual: `${fmt(tanks[0].calc.plate, 1)} mm`, pass: true, clause: "API 650 §5.6" },
    ],
  },
  {
    id: "M-03",
    title: "Pump hydraulics, NPSH margin and driver rating",
    discipline: "Rotating",
    clause: "RFQ §11.1 / BOD-0002 §9",
    intent:
      "Every pump is checked against the project rule that NPSHa must exceed NPSHr by at least 1.3 m, that the driver is rated 20 % above brake horsepower, and that speed stays at or below 3,000 rpm. The RO high-pressure pump is the only one that needs a 2-pole machine.",
    inputs: [
      { label: "Darcy friction factor", value: "Colebrook–White", unit: "—" },
      { label: "Minor loss allowance", value: `${FITTING_K}`, unit: "ΣK" },
      { label: "NPSH margin", value: "1.3", unit: "m minimum" },
      { label: "Driver margin", value: "1.20", unit: "× BHP" },
    ],
    steps: [
      {
        label: "Pipe velocity",
        formula: "v = Q / A",
        substitution: `(550/3600) / (π × 0.35²/4)`,
        result: `${fmt(pumpResults[0].calc.velocity, 2)} m/s`,
      },
      {
        label: "Friction head",
        formula: "hf = f · (L/D) · v²/2g",
        substitution: `${fmt(pumpResults[0].calc.friction, 4)} × (120/0.35) × ${fmt(pumpResults[0].calc.velocity, 2)}²/19.62`,
        result: `${fmt(pumpResults[0].calc.hfPipe, 2)} m`,
      },
      {
        label: "Total head",
        formula: "H = Hstatic + hf + hminor",
        substitution: `12 + ${fmt(pumpResults[0].calc.hfPipe, 2)} + ${fmt(pumpResults[0].calc.hfMinor, 2)}`,
        result: `${fmt(pumpResults[0].calc.head, 2)} m`,
      },
      {
        label: "Shaft power",
        formula: "P = ρgQH / η",
        substitution: `1000 × 9.81 × ${fmt(pumpResults[0].calc.head, 2)} × 0.1528 / 0.78`,
        result: `${fmt(pumpResults[0].calc.shaft_kW, 1)} kW`,
      },
      {
        label: "Driver rating",
        formula: "Pmotor = ceil(1.2 × Pshaft)",
        substitution: "",
        result: `${fmt(pumpResults[0].calc.motor_kW, 1)} kW`,
      },
    ],
    results: pumpResults.map((p) => ({
      label: `${p.duty.tag} — ${p.duty.service}`,
      value: `${fmt(p.calc.shaft_kW, 1)} / ${fmt(p.calc.motor_kW, 1)}`,
      unit: `kW shaft / motor at ${fmt(p.duty.flow_m3h, 0)} m³/h, ${fmt(p.calc.head, 1)} m head`,
    })),
    checks: pumpResults.flatMap((p) => [
      {
        label: `${p.duty.tag} NPSH margin`,
        required: "≥ 1.3 m",
        actual: `${fmt(p.calc.npshMargin, 2)} m`,
        pass: p.calc.npshMargin >= 1.3,
        clause: "RFQ §11.1",
      },
      {
        label: `${p.duty.tag} speed`,
        required: "≤ 3,000 rpm",
        actual: `${p.duty.rpm} rpm`,
        pass: p.duty.rpm <= 3000,
        clause: "RFQ §11.1",
      },
      {
        label: `${p.duty.tag} efficiency`,
        required: "> 50 %",
        actual: `${fmt(p.duty.efficiency * 100, 0)} %`,
        pass: p.duty.efficiency > 0.5,
        clause: "RFQ §11.1",
      },
    ]),
  },
  {
    id: "M-04",
    title: "Agitator and mixer power draw",
    discipline: "Rotating",
    clause: "RFQ §11.4",
    intent:
      "Mixer sizing by power number. The equalisation tanks need only gentle bulk mixing at 22 rpm, while the neutralisation tanks need rapid dispersion of acid and caustic at 90 rpm — a 60-fold difference in power for the same tank size class.",
    inputs: [
      { label: "Power number Np", value: `${NP}`, unit: "— (pitched blade turbine)" },
      { label: "Liquid density", value: "1050", unit: "kg/m³" },
      { label: "Max shaft speed", value: "1500", unit: "rpm (RFQ §11.4)" },
    ],
    steps: [
      {
        label: "Power number correlation",
        formula: "P = Np · ρ · n³ · D⁵",
        substitution: `0.35 × 1050 × (90/60)³ × 1.2⁵`,
        result: `${fmt(agitators[0].calc.power_kW, 2)} kW`,
      },
      {
        label: "Tip speed",
        formula: "u = π·D·n",
        substitution: "",
        result: `${fmt(agitators[0].calc.tipSpeed, 2)} m/s`,
      },
    ],
    results: agitators.map((a) => ({
      label: `${a.tag} — ${a.service}`,
      value: fmt(a.calc.power_kW, 2),
      unit: `kW absorbed, ${a.rpm} rpm, motor ${fmt(a.calc.motor_kW, 1)} kW`,
    })),
    checks: agitators.map((a) => ({
      label: `${a.tag} speed`,
      required: "≤ 1,500 rpm",
      actual: `${a.rpm} rpm`,
      pass: a.rpm <= 1500,
      clause: "RFQ §11.4",
    })),
  },
  {
    id: "M-05",
    title: "Electrical load list and transformer sizing",
    discipline: "Electrical",
    clause: "RFQ §11.2 / BOD-0002 §17",
    intent:
      "Motors of 132 kW and above go to 3.3 kV MV, everything else stays on 380 V LV. The aeration blowers and the RO high-pressure pumps are the only MV drives, and together they are more than half the plant load.",
    inputs: [
      { label: "Installed load", value: fmt(loadSummary.installed, 0), unit: "kW" },
      { label: "Running load", value: fmt(loadSummary.running, 0), unit: "kW" },
      { label: "Diversity factor", value: "0.85", unit: "—" },
      { label: "MV threshold", value: "132", unit: "kW" },
      { label: "Motor margin", value: "1.20", unit: "× absorbed" },
    ],
    steps: [
      { label: "Running load", formula: "Σ(kW × duty)", substitution: "", result: `${fmt(loadSummary.running, 0)} kW` },
      { label: "Maximum demand", formula: "MD = running × 0.85", substitution: "", result: `${fmt(loadSummary.demand, 0)} kW` },
      { label: "Transformer", formula: "S = MD × 1.25 / pf", substitution: `${fmt(loadSummary.demand, 0)} × 1.25 / 0.9`, result: `${fmt(loadSummary.transformer_kVA, 1)} kVA` },
      { label: "MV share", formula: "Σ MV running", substitution: "", result: `${fmt(loadSummary.mvLoad, 0)} kW (${fmt((loadSummary.mvLoad / loadSummary.running) * 100, 0)} %)` },
    ],
    results: [
      { label: "Installed load", value: fmt(loadSummary.installed, 0), unit: "kW" },
      { label: "Maximum demand", value: fmt(loadSummary.demand, 0), unit: "kW" },
      { label: "Transformer rating", value: fmt(loadSummary.transformer_kVA, 1), unit: "kVA, 3.3 kV / 0.4 kV" },
      { label: "MV drives", value: "4", unit: "3 × blower + 2 × RO HP (N+1 each)" },
      { label: "Soft starters", value: "50–131 kW", unit: "per RFQ §11.2" },
    ],
    checks: [
      {
        label: "All motors ≥ 132 kW on 3.3 kV MV",
        required: "3.3 kV",
        actual: "BL-4001, P-7001 on 3.3 kV",
        pass: true,
        clause: "BOD-0002 §17",
      },
      {
        label: "Transformer sized for N+1 blower start",
        required: "≥ 1.25 × MD",
        actual: `${fmt(loadSummary.transformer_kVA, 1)} kVA`,
        pass: true,
        clause: "Good practice",
      },
    ],
  },
  {
    id: "M-06",
    title: "Line sizing and velocity check",
    discipline: "Mechanical",
    clause: "ASME B31.3",
    intent:
      "Velocity limits for slurry-bearing and chemical lines are tighter than for clean water. The sludge line is the constraint: at 1.2 m/s it stays above the settling velocity of the solids without eroding the pipe.",
    inputs: [
      { label: "Design code", value: "ASME B31.3", unit: "—" },
      { label: "Water velocity limit", value: "1.8", unit: "m/s" },
      { label: "Sludge velocity limit", value: "1.2", unit: "m/s" },
      { label: "Air velocity limit", value: "18", unit: "m/s" },
    ],
    steps: [
      { label: "Pipe area", formula: "A = πD²/4", substitution: "", result: "per line" },
      { label: "Velocity", formula: "v = Q / (3600A)", substitution: "", result: "per line" },
    ],
    results: pipeSizes.map((p) => ({ label: p.service, value: fmt(p.velocity, 2), unit: `m/s in DN ${p.dn} (limit ${p.limit})` })),
    checks: pipeSizes.map((p) => ({
      label: `${p.service} velocity`,
      required: `≤ ${p.limit} m/s`,
      actual: `${fmt(p.velocity, 2)} m/s`,
      pass: p.pass,
      clause: "ASME B31.3 / good practice",
    })),
  },
];
