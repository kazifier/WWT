/**
 * Project estimate — AACE Class 4 (+/- 25 %), USD, 4Q-2026 Gulf basis.
 * The model is deliberately transparent: every factor is a named constant so
 * the client can challenge a number rather than a total.
 */
import { equipment } from "@/data/equipment";
import { process as P } from "@/lib/calc/process";
import { loadSummary } from "@/lib/calc/mechanical";
import { fabrication, mtoTotals } from "@/lib/calc/mto";

export interface CostLine {
  code: string;
  description: string;
  value: number;
  basis: string;
}

const eq = (areas: string[]) =>
  equipment.filter((e) => areas.includes(e.area)).reduce((s, e) => s + e.cost_usd * e.qty, 0);

const COMMON_AREAS = ["10", "20", "30", "40", "50", "60", "80", "90"];
const EI_AREAS = ["99"];

/* Civil quantities derived from the process sheets */
const civil = (() => {
  const concAeration = P.biological.volume_m3 * 0.30; // m3 concrete per m3 basin
  const concClarifier = P.clarifier.area_m2 * 0.55;
  const concNeut = 60;
  const buildings = 1_050; // m2 control room, chemical house, analyser house, workshop
  const tanks = concAeration + concClarifier + concNeut;
  return {
    concrete_m3: +tanks.toFixed(0),
    concrete: +(tanks * 350).toFixed(0),
    buildings_m2: buildings,
    buildings: +(buildings * 1_150).toFixed(0),
    foundations: 0, // computed as a factor below
  };
})();

const civilFoundationsFactor = 0.14;

export interface OptionEstimate {
  id: string;
  name: string;
  lines: CostLine[];
  subtotal: number;
  contingency: number;
  total: number;
  perCapacity: number;
}

function buildLines(optionId: string): CostLine[] {
  const lines: CostLine[] = [];

  // 1. Process equipment
  lines.push({
    code: "1.1",
    description: "Process equipment — common treatment train (Areas 10–90)",
    value: eq(COMMON_AREAS),
    basis: "Equipment register, supply only, FCA vendor works",
  });

  if (optionId !== "opt1") {
    lines.push({
      code: "1.2",
      description: "Ultrafiltration and reverse osmosis (Area 70)",
      value: eq(["70"]),
      basis: `${P.membrane.roElements} RO elements, ${P.membrane.ufModules} UF modules`,
    });
  } else {
    lines.push({
      code: "1.2",
      description: "Outfall, diffuser and river monitoring station",
      value: 640_000,
      basis: "Option 1 only — no desalination installed",
    });
  }

  lines.push({
    code: "1.3",
    description: "Zero liquid discharge (Area 95)",
    value: optionId === "opt3" ? eq(["95"]) : 0,
    basis: optionId === "opt3" ? "MVR concentrator + crystalliser + salt handling" : "Not in this option",
  });

  lines.push({
    code: "1.4",
    description: "Electrical, instrumentation and control (Area 99)",
    value: eq(EI_AREAS),
    basis: `${loadSummary.transformer_kVA.toFixed(0)} kVA, ${loadSummary.mvLoad.toFixed(0)} kW MV`,
  });

  // 2. Bulk materials
  const bulk = eq(EI_AREAS) * 0.55 + (eq(COMMON_AREAS) + eq(["70"])) * 0.22;
  lines.push({
    code: "2.0",
    description: "Bulk materials — piping, valves, cable, trays, supports",
    value: +bulk.toFixed(0),
    basis: "22 % of equipment value plus 55 % of E&I package value",
  });

  // 3. RAMSIS fabrication is the cost build-up INSIDE the make items in 1.1,
  //    not an additional line. Shown as a memo so nothing is double counted.
  lines.push({
    code: "3.0",
    description: "RAMSIS workshop content (memo — included in line 1.1)",
    value: 0,
    basis: `${mtoTotals.total_t} t of plate and sections, ${mtoTotals.manhours.toLocaleString()} h, direct workshop cost USD ${fabrication.total.toLocaleString()}`,
  });

  // 4. Civil
  const foundations = (eq(COMMON_AREAS) + eq(["70"]) + eq(["95"])) * civilFoundationsFactor;
  lines.push({
    code: "4.0",
    description: "Civil works — basins, foundations, buildings",
    value: +(civil.concrete + civil.buildings + foundations).toFixed(0),
    basis: `${civil.concrete_m3} m³ concrete, ${civil.buildings_m2} m² buildings, foundations at 14 % of equipment`,
  });

  // 5. Evaporation pond (Option 2 only)
  if (optionId === "opt2") {
    const area = P.evaporation.areaWithFreeboard_ha * 10_000;
    lines.push({
      code: "5.0",
      description: "Lined evaporation pond, 1.5 mm HDPE with perimeter bund",
      value: +(area * 18).toFixed(0),
      basis: `${P.evaporation.areaWithFreeboard_ha} ha (${(area).toLocaleString("en-US", { maximumFractionDigits: 0 })} m²) at USD 18/m² including earthworks`,
    });
  }
  if (optionId === "opt2r") {
    const reduced = P.evaporation.areaWithFreeboard_ha * 0.2;
    lines.push({
      code: "5.0",
      description: "Brine concentrator (MVR) ahead of a reduced evaporation pond",
      value: 2_450_000 + reduced * 10_000 * 18,
      basis: "Concentrates reject 4:1, pond reduced to 20 % of the Option 2 area",
    });
  }
  if (optionId === "opt1") lines.push({ code: "5.0", description: "No evaporation pond", value: 0, basis: "Not applicable" });

  // 6. Erection and commissioning
  const equipTotal = eq(COMMON_AREAS) + eq(["70"]) + eq(["95"]) + eq(EI_AREAS);
  lines.push({
    code: "6.0",
    description: "Erection, installation and hook-up",
    value: +(equipTotal * 0.18 + civil.concrete * 0.12).toFixed(0),
    basis: "18 % of equipment, 12 % of civil",
  });
  lines.push({
    code: "6.1",
    description: "Commissioning, start-up and 2-year operational spares",
    value: +(equipTotal * 0.055).toFixed(0),
    basis: "RFQ §16 spares philosophy plus commissioning support",
  });
  lines.push({
    code: "6.2",
    description: "Freight, insurance and inland transport to Diwanya",
    value: +(equipTotal * 0.045).toFixed(0),
    basis: "FCA vendor works per RFQ §21, sea + 550 km inland",
  });

  // 7. Engineering
  const base = lines.reduce((a, l) => a + l.value, 0);
  lines.push({
    code: "7.0",
    description: "Engineering, design, 3D model and vendor document review",
    value: +(base * 0.075).toFixed(0),
    basis: "7.5 % of direct cost — RFQ §12 requires 30/60/90 % model reviews",
  });

  return lines;
}

export const optionEstimates: OptionEstimate[] = [
  { id: "opt1", name: "Option 1 — River discharge" },
  { id: "opt2", name: "Option 2 — RO reuse + evaporation pond" },
  { id: "opt2r", name: "Option 2R — RO reuse + brine concentrator (recommended)" },
  { id: "opt3", name: "Option 3 — Zero liquid discharge" },
].map((o) => {
  const lines = buildLines(o.id);
  const subtotal = lines.reduce((a, l) => a + l.value, 0);
  const contingency = subtotal * 0.12;
  const total = subtotal + contingency;
  return { ...o, lines, subtotal, contingency, total, perCapacity: total / 500 };
});

/* ------------------------------------------------------------------ */
/* Operating cost                                                      */
/* ------------------------------------------------------------------ */
export interface OpexLine {
  description: string;
  annual: number;
  basis: string;
}

export function opexFor(optionId: string): { lines: OpexLine[]; total: number } {
  const powerKW =
    loadSummary.demand +
    (optionId === "opt1" ? 0 : P.membrane.hpPump_kW * 1.05 + 120) +
    (optionId === "opt3" ? P.zld.concentrator_kW + P.zld.crystalliser_kW : 0) +
    (optionId === "opt2r" ? P.zld.concentrator_kW * 0.35 : 0);
  const kwhYr = powerKW * 8_000;
  const power = kwhYr * 0.1;

  const chem =
    P.chemical.h2o2_kgd * 365 * 0.85 +
    P.chemical.coagulant_kgd * 365 * 0.42 +
    P.chemical.polymer_kgd * 365 * 3.2 +
    P.chemical.nutrientP_kgd * 365 * 1.4 +
    (optionId === "opt1" ? 0 : P.chemical.antiscalant_kgd * 365 * 2.6) +
    P.chemical.naclo_kgd * 365 * 0.35;

  const membraneReplace =
    optionId === "opt1"
      ? 0
      : (P.membrane.roElements * 620 + P.membrane.ufModules * 2_400) / 5;

  const sludge = P.sludge.cake_t_d * 365 * 45;
  const manpower = 28 * 18_000;
  const maintenance = (eq(COMMON_AREAS) + eq(["70"]) + eq(["95"])) * 0.035;

  const lines: OpexLine[] = [
    { description: "Electric power", annual: +power.toFixed(0), basis: `${powerKW.toFixed(0)} kW at 8,000 h/yr, USD 0.10/kWh` },
    { description: "Chemicals", annual: +chem.toFixed(0), basis: `${P.chemical.coagulant_kgd} kg/d coagulant, ${P.chemical.h2o2_kgd} kg/d H₂O₂` },
    { description: "Membrane replacement", annual: +membraneReplace.toFixed(0), basis: "5-year element life, amortised annually" },
    { description: "Sludge transport and disposal", annual: +sludge.toFixed(0), basis: `${P.sludge.cake_t_d} t/d cake at USD 45/t` },
    { description: "Operating manpower", annual: manpower, basis: "28 staff across 4 shifts plus day support" },
    { description: "Maintenance and spares", annual: +maintenance.toFixed(0), basis: "3.5 % of mechanical equipment value" },
  ];
  return { lines, total: lines.reduce((a, l) => a + l.annual, 0) };
}

/* 20-year life-cycle cost, 8 % discount */
const annuity = (r: number, n: number) => (1 - Math.pow(1 + r, -n)) / r;
export const PV_FACTOR = annuity(0.08, 20);

export const lifeCycle = optionEstimates.map((o) => {
  const op = opexFor(o.id);
  return {
    id: o.id,
    name: o.name,
    capex: o.total,
    opex: op.total,
    pvOpex: op.total * PV_FACTOR,
    total: o.total + op.total * PV_FACTOR,
  };
});
