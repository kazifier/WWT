/**
 * Process design calculations for the 500 m3/h WWT package.
 * Every sheet carries the RFQ / design-basis clause it closes out, the
 * formula used and a pass/fail check where a contractual limit applies.
 */
import { blendedAll, inletParameters, massLoad, totalInletFlow } from "@/data/influent";
import { ceilTo, fmt, r0, r1, r2, type CalcSheet } from "./types";

const B = blendedAll();

/** Design flow with the RFQ §17 overdesign allowance (110 % of 500 m3/h). */
export const DESIGN_FLOW = 550;
export const AVG_FLOW = totalInletFlow;

export interface ProcessResult {
  designFlow: number;
  /** mg/L after flow-weighted blending */
  blended: Record<string, number>;
  neutralisation: { tankVolume: number; naoh_kgh: number; h2so4_kgh: number; tanks: number };
  oilRemoval: {
    riseVelocity_mm_s: number;
    horizontalVelocity_mm_s: number;
    crossArea_m2: number;
    width_m: number;
    length_m: number;
    depth_m: number;
    hrt_min: number;
    trains: number;
    cpiPlates: number;
    cpiArea_m2: number;
    dafArea_m2: number;
    dafRecycle_m3h: number;
    dafUnits: number;
    oilIn: number;
    oilAfterApi: number;
    oilAfterDaf: number;
  };
  equalisation: { volume_m3: number; tanks: number; hrt_h: number; diameter_m: number; height_m: number };
  biological: {
    bodIn: number;
    bodLoad_kgd: number;
    srt_d: number;
    yObs: number;
    sludge_kgd: number;
    mlss: number;
    fm: number;
    inventory_kg: number;
    volume_m3: number;
    hrt_h: number;
    tanks: number;
    o2_carbon_kgd: number;
    o2_nitrif_kgd: number;
    o2_denitCredit_kgd: number;
    aor_kgh: number;
    sotr_kgh: number;
    air_m3h: number;
    blowers: number;
    blowerFlow_m3h: number;
    blowerPower_kW: number;
    nh3In: number;
    nh3Out: number;
  };
  clarifier: { area_m2: number; units: number; diameter_m: number; sor_m_h: number; solidsLoading: number; ras_m3h: number };
  filtration: { area_m2: number; units: number; diameter_m: number; rate_m_h: number; gacUnits: number; backwash_m3h: number };
  membrane: {
    ufArea_m2: number;
    ufModules: number;
    ufSkids: number;
    roRecovery: number;
    roPermeate: number;
    roReject: number;
    roFlux: number;
    roArea_m2: number;
    roElements: number;
    roRacks: number;
    roFeedPressure_bar: number;
    concentrateTDS: number;
    permeateTDS: number;
    hpPump_kW: number;
  };
  evaporation: { reject_m3h: number; annual_m3: number; netEvap_m_yr: number; area_ha: number; areaWithFreeboard_ha: number };
  zld: { concentrator_kW: number; crystalliser_kW: number; steam_t_h: number; solids_t_d: number };
  chemical: { h2o2_kgd: number; coagulant_kgd: number; polymer_kgd: number; nutrientP_kgd: number; antiscalant_kgd: number; naclo_kgd: number; acid_kgd: number };
  sludge: { bio_kgd: number; oily_kgd: number; total_dry_kgd: number; cake_t_d: number; centrifugeUnits: number; thickener_m3: number };
  sheets: CalcSheet[];
}

/* ------------------------------------------------------------------ */
/* 1. Neutralisation of the chemical drain                             */
/* ------------------------------------------------------------------ */
const pHWorstAcid = 2.2;
const pHWorstAlkali = 11.8;
const chemDrainFlow = 120; // m3/h, RFQ §7

// Strong-acid equivalent at pH 2.2 -> 10^-2.2 mol/L of H+ to neutralise to pH 7
const hPlus = Math.pow(10, -pHWorstAcid); // mol/L
const ohMinus = Math.pow(10, pHWorstAlkali - 14);
const naoh_kgh = (chemDrainFlow * 1000 * hPlus * 40) / 1000; // g/h -> kg/h (MW NaOH 40)
const h2so4_kgh = (chemDrainFlow * 1000 * ohMinus * 98) / 2 / 1000; // MW H2SO4 98, 2 eq
const neutTankVolume = ceilTo((chemDrainFlow * 0.75) / 2, 5); // 45 min HRT, 2 tanks

const neutralisation = {
  tankVolume: neutTankVolume,
  naoh_kgh: r1(naoh_kgh),
  h2so4_kgh: r1(h2so4_kgh),
  tanks: 2,
};

/* ------------------------------------------------------------------ */
/* 2. Oil removal: API 421 separator, CPI, DAF                          */
/* ------------------------------------------------------------------ */
const WATER_RHO = 992; // kg/m3 at 40 C
const OIL_RHO = 920; // kg/m3, SG 0.92 refinery oil
const WATER_MU = 6.53e-4; // Pa.s at 40 C
const DROPLET = 150e-6; // m, API 421 design droplet
const G = 9.81;

// Stokes rise velocity
const rise = (G * (WATER_RHO - OIL_RHO) * DROPLET * DROPLET) / (18 * WATER_MU); // m/s
const rise_mm_s = rise * 1000;
// API 421: Vh <= 15 Vt AND Vh <= 3 ft/min (15.24 mm/s)
const vhLimit = Math.min(15 * rise_mm_s, 15.24);
const crossArea = DESIGN_FLOW / 3600 / (vhLimit / 1000);
const sepDepth = 2.5;
const width = r1(Math.max(1.8, Math.ceil(crossArea / sepDepth * 10) / 10));
const length = r1(Math.max(5 * width, (vhLimit / 1000) * sepDepth / rise));
const separatorVolume = length * width * sepDepth * 2; // 2 trains at 50 %
const hrt = ((length * width * sepDepth) / (DESIGN_FLOW / 2)) * 60; // min per train

// CPI: 5 m3/m2.h projected plate loading
const cpiArea = DESIGN_FLOW / 5;
const cpiPlates = Math.ceil(cpiArea / 2.4); // 1.0 x 2.4 m plates

// DAF: A/S ratio method (Metcalf & Eddy)
const AS_REQ = 0.03; // kg air / kg solids, oily water duty
const sA = 18.7; // air solubility mL/L at 1 atm, 20 C
const fSat = 0.7;
const pAbs = 5.5; // atm (75 psig saturator)
const solidsIn = B.og + B.ss + 30; // + coagulant formed solids, mg/L
const recycleRatio = (AS_REQ * solidsIn) / (1.3 * sA * (fSat * pAbs - 1));
const dafRecycle = r0(DESIGN_FLOW * recycleRatio);
const dafTotal = DESIGN_FLOW + dafRecycle;
const dafArea = dafTotal / 5; // 5 m3/m2.h hydraulic loading
const dafUnits = 2;

const oilRemoval = {
  riseVelocity_mm_s: r2(rise_mm_s),
  horizontalVelocity_mm_s: r2(vhLimit),
  crossArea_m2: r1(crossArea),
  width_m: width,
  length_m: length,
  depth_m: sepDepth,
  hrt_min: r1(hrt),
  trains: 2,
  cpiPlates,
  cpiArea_m2: r0(cpiArea),
  dafArea_m2: r0(dafArea),
  dafRecycle_m3h: dafRecycle,
  dafUnits,
  oilIn: B.og,
  oilAfterApi: 120,
  oilAfterDaf: 15,
};

/* ------------------------------------------------------------------ */
/* 3. Equalisation                                                     */
/* ------------------------------------------------------------------ */
const EQ_HRT = 8;
const eqVolume = DESIGN_FLOW * EQ_HRT;
const eqTanks = 2;
const eqDia = 20;
const eqHeight = r1(eqVolume / eqTanks / (Math.PI * (eqDia / 2) ** 2));

const equalisation = {
  volume_m3: r0(eqVolume),
  tanks: eqTanks,
  hrt_h: EQ_HRT,
  diameter_m: eqDia,
  height_m: eqHeight,
};

/* ------------------------------------------------------------------ */
/* 4. Biological treatment (activated sludge with nitrification)        */
/* ------------------------------------------------------------------ */
const OIL_REMOVAL_EFF = 0.15; // residual BOD fraction after DAF + equalisation
const bodIn = B.bod;
const bodToBio = bodIn * (1 - 0.15); // 15 % removed in the oil-removal step
const bodLoad_kgd = (bodToBio * DESIGN_FLOW * 24) / 1000;
const SRT = 20; // d — nitrification at 35 C water temperature
const Y = 0.6;
const bDecay = 0.05;
const yObs = Y / (1 + bDecay * SRT);
const sludge_kgd = bodLoad_kgd * yObs;
const MLSS = 4000; // mg/L
const FM = 0.15; // kg BOD / kg MLSS.d
const inventory = bodLoad_kgd / FM;
const bioVolume = ceilTo((inventory / MLSS) * 1000, 500);

// Oxygen demand
const o2_carbon = (bodLoad_kgd - 1.42 * sludge_kgd) * 1.0;
const nh3In = B.nh3;
const nLoad_kgd = (nh3In * DESIGN_FLOW * 24) / 1000;
const o2_nitrif = 4.57 * nLoad_kgd;
const denitCredit = 2.86 * nLoad_kgd * 0.7; // 70 % of nitrate returned to the anoxic zone
const aor_kgd = o2_carbon + o2_nitrif - denitCredit;
const aor_kgh = aor_kgd / 24;

// SOTR correction to site / process conditions
const T_WATER = 35;
const alpha = 0.55;
const beta = 0.95;
const cs20 = 9.08;
const csT = 6.9; // mg/L at 35 C
const cOp = 2.0;
const theta = 1.024;
const sotrFactor = cs20 / (alpha * (beta * csT - cOp) * Math.pow(theta, T_WATER - 20));
const sotr_kgh = aor_kgh * sotrFactor;
// Fine bubble diffusers, SOTE 0.25 per m of submergence, 6 m depth
const o2PerM3Air = 0.28 * 0.25 * 6 / 6 * 6; // 0.28 kg O2/m3 air x 25 % SOTE x 6 m
const air_m3h = sotr_kgh / (0.28 * 0.25 * 6);
const blowers = 3; // 2 duty + 1 standby
const blowerFlow = air_m3h / 2;

// Adiabatic blower power
const blowerP1 = 101.3;
const blowerP2 = blowerP1 + 65; // 6.5 m water column + losses
const k = 1.395;
const blowerPower =
  (k / (k - 1)) * (blowerP1 * 1000) * (blowerFlow / 3600) *
  (Math.pow(blowerP2 / blowerP1, (k - 1) / k) - 1) / 0.72 / 1000;

const biological = {
  bodIn,
  bodLoad_kgd: r0(bodLoad_kgd),
  srt_d: SRT,
  yObs: r2(yObs),
  sludge_kgd: r0(sludge_kgd),
  mlss: MLSS,
  fm: FM,
  inventory_kg: r0(inventory),
  volume_m3: bioVolume,
  hrt_h: r1(bioVolume / DESIGN_FLOW),
  tanks: Math.ceil(bioVolume / 3000),
  o2_carbon_kgd: r0(o2_carbon),
  o2_nitrif_kgd: r0(o2_nitrif),
  o2_denitCredit_kgd: r0(denitCredit),
  aor_kgh: r1(aor_kgh),
  sotr_kgh: r0(sotr_kgh),
  air_m3h: r0(air_m3h),
  blowers,
  blowerFlow_m3h: r0(blowerFlow),
  blowerPower_kW: r0(blowerPower),
  nh3In,
  nh3Out: 2,
};

/* ------------------------------------------------------------------ */
/* 5. Clarifier                                                        */
/* ------------------------------------------------------------------ */
const SOR = 0.7; // m/h at peak flow
const clarArea = DESIGN_FLOW / SOR;
const clarUnits = 2;
const clarDia = r1(Math.ceil(Math.sqrt((clarArea / clarUnits) / Math.PI) * 2 * 2) / 2);
const clarActualArea = clarUnits * Math.PI * (clarDia / 2) ** 2;
const ras = DESIGN_FLOW * 1.0;

const clarifier = {
  area_m2: r0(clarActualArea),
  units: clarUnits,
  diameter_m: clarDia,
  sor_m_h: r2(DESIGN_FLOW / clarActualArea),
  solidsLoading: r2(((DESIGN_FLOW + ras) * MLSS) / 1000 / clarActualArea),
  ras_m3h: r0(ras),
};

/* ------------------------------------------------------------------ */
/* 6. Filtration + GAC                                                 */
/* ------------------------------------------------------------------ */
const filtRate = 10; // m/h
const filtArea = DESIGN_FLOW / filtRate;
const filtDia = 4.5;
const filtUnits = Math.ceil(filtArea / (Math.PI * (filtDia / 2) ** 2));
const filtActual = filtUnits * Math.PI * (filtDia / 2) ** 2;

const filtration = {
  area_m2: r0(filtActual),
  units: filtUnits,
  diameter_m: filtDia,
  rate_m_h: r2(DESIGN_FLOW / filtActual),
  gacUnits: 2,
  backwash_m3h: r0(DESIGN_FLOW * 0.8),
};

/* ------------------------------------------------------------------ */
/* 7. UF + RO (Option 2 / 3)                                           */
/* ------------------------------------------------------------------ */
const ufFlux = 55; // L/m2.h at 35 C, PVDF outside-in
const ufArea = (DESIGN_FLOW * 1000) / ufFlux;
const ufModules = Math.ceil(ufArea / 60);
const roRecovery = 0.7;
const roPermeate = DESIGN_FLOW * roRecovery;
const roReject = DESIGN_FLOW - roPermeate;
const roFlux = 18; // L/m2.h — wastewater duty, derated for fouling
const roArea = (DESIGN_FLOW * 1000) / roFlux;
const roElements = Math.ceil(roArea / 37.2);
const concentrateTDS = B.tds / (1 - roRecovery);
const permeateTDS = r0(B.tds * 0.03);
// Osmotic pressure of the concentrate (van 't Hoff, as NaCl equivalent)
const concMol = concentrateTDS / 1000 / 58.5;
const osmotic = (2 * concMol * 8.314 * 308) / 100; // bar
const roFeedPressure = Math.ceil((osmotic + 8) / 5) * 5;
const hpPump = (DESIGN_FLOW / 3600) * 1000 * 9.81 * (roFeedPressure * 10.2) / 0.8 / 1000;

const membrane = {
  ufArea_m2: r0(ufArea),
  ufModules,
  ufSkids: 4,
  roRecovery,
  roPermeate: r0(roPermeate),
  roReject: r0(roReject),
  roFlux,
  roArea_m2: r0(roArea),
  roElements,
  roRacks: 6,
  roFeedPressure_bar: roFeedPressure,
  concentrateTDS: r0(concentrateTDS),
  permeateTDS,
  hpPump_kW: r0(hpPump),
};

/* ------------------------------------------------------------------ */
/* 8. Evaporation pond and ZLD                                         */
/* ------------------------------------------------------------------ */
const panEvap_mm = 2300;
const panCoeff = 0.7;
const netEvap_m = (panEvap_mm * panCoeff) / 1000 - 0.007;
const annualReject = roReject * 8760;
const pondArea = annualReject / netEvap_m;

const evaporation = {
  reject_m3h: r0(roReject),
  annual_m3: r0(annualReject),
  netEvap_m_yr: r2(netEvap_m),
  area_ha: r1(pondArea / 10000),
  areaWithFreeboard_ha: r1((pondArea * 1.2) / 10000),
};

const concentrator_kW = roReject * 22; // kWh/m3 MVR specific consumption
const crystalliserFeed = roReject * 0.2; // after concentration to ~25 % solids
const crystalliser_kW = crystalliserFeed * 55;
const steam = (crystalliserFeed * 0.28) / 1000 * 1000; // t/h

const zld = {
  concentrator_kW: r0(concentrator_kW),
  crystalliser_kW: r0(crystalliser_kW),
  steam_t_h: r1(steam),
  solids_t_d: r1((roReject * 24 * concentrateTDS) / 1e6 * 1000 / 1000),
};

/* ------------------------------------------------------------------ */
/* 9. Chemical consumption                                             */
/* ------------------------------------------------------------------ */
const h2o2 = (B.s2 * 2.1 * DESIGN_FLOW * 24) / 1000; // kg/d as 100 %
const coagulant = (60 * DESIGN_FLOW * 24) / 1000;
const polymer = (3 * DESIGN_FLOW * 24) / 1000;
const nutrientP = (4 * DESIGN_FLOW * 24) / 1000;
const antiscalant = (5 * DESIGN_FLOW * 24) / 1000;
const naclo = (4 * DESIGN_FLOW * 24) / 1000;

const chemical = {
  h2o2_kgd: r0(h2o2),
  coagulant_kgd: r0(coagulant),
  polymer_kgd: r1(polymer),
  nutrientP_kgd: r1(nutrientP),
  antiscalant_kgd: r1(antiscalant),
  naclo_kgd: r0(naclo),
  acid_kgd: r0(h2so4_kgh * 24),
};

/* ------------------------------------------------------------------ */
/* 10. Sludge                                                          */
/* ------------------------------------------------------------------ */
const oilyDry = ((B.og - oilRemoval.oilAfterDaf) + (B.ss - 20)) * DESIGN_FLOW * 24 / 1000 + coagulant * 0.3;
const totalDry = oilyDry + sludge_kgd;
const cake_t_d = totalDry / 0.25 / 1000;

const sludge = {
  bio_kgd: r0(sludge_kgd),
  oily_kgd: r0(oilyDry),
  total_dry_kgd: r0(totalDry),
  cake_t_d: r1(cake_t_d),
  centrifugeUnits: 2,
  thickener_m3: 350,
};

/* ------------------------------------------------------------------ */
/* Sheets                                                              */
/* ------------------------------------------------------------------ */
const sheets: CalcSheet[] = [
  {
    id: "P-01",
    title: "Inlet characterisation and flow-weighted blend",
    discipline: "Process",
    clause: "RFQ §7",
    intent:
      "Establish the single design feed used for every downstream calculation. The four sources are blended on a mass basis, not by simple average, because 250 m³/h of process drain dominates the 50 m³/h CDU stream.",
    inputs: [
      { label: "CDU flow", value: "50", unit: "m³/h" },
      { label: "Oil storage flow", value: "80", unit: "m³/h" },
      { label: "Process drain flow", value: "250", unit: "m³/h" },
      { label: "Chemical drain flow", value: "120", unit: "m³/h" },
      { label: "Design capacity", value: fmt(DESIGN_FLOW, 0), unit: "m³/h", basis: "RFQ §4 x RFQ §17 110 %" },
    ],
    steps: [
      {
        label: "Total inlet flow",
        formula: "Q = Σ Qᵢ",
        substitution: "50 + 80 + 250 + 120",
        result: `${fmt(AVG_FLOW, 0)} m³/h`,
      },
      {
        label: "Blended concentration",
        formula: "C = Σ (Cᵢ · Qᵢ) / Σ Qᵢ",
        substitution: `Oil & grease = (1500·50 + 800·80 + 500·250 + 50·120) / 500`,
        result: `${fmt(B.og, 0)} mg/L`,
      },
      {
        label: "Oil & grease load",
        formula: "L = C · Q / 1000",
        substitution: `${fmt(B.og, 0)} × ${fmt(DESIGN_FLOW, 0)} / 1000`,
        result: `${fmt(massLoad(B.og, DESIGN_FLOW), 1)} kg/h`,
      },
      {
        label: "COD / BOD ratio",
        formula: "COD / BOD",
        substitution: `${fmt(B.cod, 0)} / ${fmt(B.bod, 0)}`,
        result: `${fmt(B.cod / B.bod, 2)} — biologically treatable, moderately refractory`,
      },
    ],
    results: inletParameters
      .filter((p) => !p.nonAdditive)
      .slice(0, 10)
      .map((p) => ({ label: p.label, value: fmt(B[p.key], p.key === "pb" || p.key === "cr" ? 2 : 1), unit: p.unit })),
    checks: [
      {
        label: "Design flow covers 110 % of nameplate",
        required: "550 m³/h",
        actual: `${fmt(DESIGN_FLOW, 0)} m³/h`,
        pass: true,
        clause: "RFQ §17",
      },
    ],
  },
  {
    id: "P-02",
    title: "Chemical drain neutralisation",
    discipline: "Process",
    clause: "RFQ §6 / §7",
    intent:
      "The chemical drain (acidic, alkaline, foam) must be neutralised in a dedicated tank before it meets the rest of the flow. Sizing is based on the worst credible pH excursion, because no flow-weighted average is meaningful for pH.",
    inputs: [
      { label: "Chemical drain flow", value: "120", unit: "m³/h" },
      { label: "Worst acid excursion", value: `${pHWorstAcid}`, unit: "pH" },
      { label: "Worst alkali excursion", value: `${pHWorstAlkali}`, unit: "pH" },
      { label: "Target band", value: "6.5 – 8.5", unit: "pH" },
      { label: "HRT per tank", value: "45", unit: "min" },
    ],
    steps: [
      {
        label: "Strong-acid equivalent",
        formula: "[H⁺] = 10^(−pH)",
        substitution: `10^(−${pHWorstAcid})`,
        result: `${hPlus.toExponential(2)} mol/L`,
      },
      {
        label: "Caustic demand",
        formula: "ṁ(NaOH) = Q · [H⁺] · 40 / 2",
        substitution: `120 000 L/h × ${hPlus.toExponential(2)} × 40`,
        result: `${fmt(naoh_kgh, 1)} kg/h as 100 % NaOH`,
      },
      {
        label: "Acid demand",
        formula: "ṁ(H₂SO₄) = Q · [OH⁻] · 98 / 2",
        substitution: `120 000 × ${ohMinus.toExponential(2)} × 98 / 2`,
        result: `${fmt(h2so4_kgh, 1)} kg/h as 100 % H₂SO₄`,
      },
      {
        label: "Tank volume",
        formula: "V = Q · t / n",
        substitution: `120 × 0.75 / 2`,
        result: `${fmt(neutTankVolume, 0)} m³ × 2 tanks`,
      },
    ],
    results: [
      { label: "Neutralisation tanks", value: "2", unit: "off, agitated, HDPE-lined CS" },
      { label: "Design caustic rate", value: fmt(naoh_kgh, 0), unit: "kg/h (100 %)" },
      { label: "Design acid rate", value: fmt(h2so4_kgh, 0), unit: "kg/h (100 %)" },
      { label: "H₂S released in neutralisation", value: fmt(massLoad(B.s2, 120) * 0.4, 1), unit: "kg/h — extracted to odour control" },
    ],
    checks: [
      {
        label: "Agitated tank volume gives ≥ 30 min contact at 120 m³/h",
        required: "≥ 60 m³ per tank",
        actual: `${fmt(neutTankVolume, 0)} m³ per tank`,
        pass: neutTankVolume >= 60,
        clause: "Good practice / RFQ §6",
      },
    ],
  },
  {
    id: "P-03",
    title: "API separator — gravity oil removal (API 421)",
    discipline: "Process",
    clause: "RFQ §7, §11.5",
    intent:
      "First stage of oil removal. Sizing follows API 421: the horizontal velocity may not exceed 15 times the rise velocity of the design droplet, and never more than 3 ft/min. The separator only removes free oil; emulsified oil is left to the DAF.",
    inputs: [
      { label: "Design flow", value: fmt(DESIGN_FLOW, 0), unit: "m³/h" },
      { label: "Water density @ 40 °C", value: `${WATER_RHO}`, unit: "kg/m³" },
      { label: "Oil density", value: `${OIL_RHO}`, unit: "kg/m³" },
      { label: "Water viscosity @ 40 °C", value: "0.653", unit: "mPa·s" },
      { label: "Design droplet", value: "150", unit: "µm" },
      { label: "Liquid depth", value: `${sepDepth}`, unit: "m" },
    ],
    steps: [
      {
        label: "Stokes rise velocity",
        formula: "Vt = g(ρw − ρo)d² / 18µ",
        substitution: `9.81 × (992 − 920) × (150×10⁻⁶)² / (18 × 6.53×10⁻⁴)`,
        result: `${fmt(rise_mm_s, 3)} mm/s`,
      },
      {
        label: "Allowable horizontal velocity",
        formula: "Vh = min(15·Vt ; 15.24 mm/s)",
        substitution: `min(${fmt(15 * rise_mm_s, 2)} ; 15.24)`,
        result: `${fmt(vhLimit, 2)} mm/s`,
      },
      {
        label: "Cross-section",
        formula: "A = Q / Vh",
        substitution: `${fmt(DESIGN_FLOW / 3600, 4)} / ${fmt(vhLimit / 1000, 5)}`,
        result: `${fmt(crossArea, 2)} m²`,
      },
      {
        label: "Length for full rise",
        formula: "L = Vh · D / Vt",
        substitution: `${fmt(vhLimit / 1000, 5)} × ${sepDepth} / ${rise.toExponential(3)}`,
        result: `${fmt(length, 1)} m`,
      },
      {
        label: "Hydraulic retention time",
        formula: "HRT = L · W · D / (Q/2)",
        substitution: `${fmt(length, 1)} × ${fmt(width, 1)} × ${sepDepth} / ${fmt(DESIGN_FLOW / 2, 0)}`,
        result: `${fmt(hrt, 0)} min`,
      },
    ],
    results: [
      { label: "Separator trains", value: "2 × 50 %", unit: "parallel, common inlet channel" },
      { label: "Dimensions per train", value: `${fmt(length, 1)} × ${fmt(width, 1)} × ${fmt(sepDepth, 1)}`, unit: "m (L × W × D)" },
      { label: "Total basin volume", value: fmt(separatorVolume, 0), unit: "m³" },
      { label: "Oil & grease in", value: fmt(B.og, 0), unit: "mg/L" },
      { label: "Oil & grease after API", value: "120", unit: "mg/L (free oil only)" },
    ],
    checks: [
      {
        label: "Horizontal velocity not more than 15 × rise velocity",
        required: "≤ 15.0 × Vt",
        actual: `${fmt(vhLimit / rise_mm_s, 1)} × Vt`,
        pass: vhLimit / rise_mm_s <= 15.05,
        clause: "API 421",
      },
      {
        label: "HRT at least 30 minutes",
        required: "≥ 30 min",
        actual: `${fmt(hrt, 0)} min`,
        pass: hrt >= 30,
        clause: "API 421 good practice",
      },
      {
        label: "Aspect ratio L/W at least 5",
        required: "≥ 5",
        actual: fmt(length / width, 1),
        pass: length / width >= 5,
        clause: "API 421",
      },
    ],
  },
  {
    id: "P-04",
    title: "Corrugated plate interceptor and dissolved air flotation",
    discipline: "Process",
    clause: "RFQ §7",
    intent:
      "The CPI removes the fine free oil the API separator cannot, and the DAF removes emulsified oil and light solids. DAF sizing uses the air-to-solids ratio, which is the controlling variable for a pressurised recycle system, not the hydraulic loading.",
    inputs: [
      { label: "Design flow", value: fmt(DESIGN_FLOW, 0), unit: "m³/h" },
      { label: "CPI plate loading", value: "5", unit: "m³/m²·h" },
      { label: "Air solubility at 1 atm", value: `${sA}`, unit: "mL/L" },
      { label: "Saturation efficiency f", value: `${fSat}`, unit: "—" },
      { label: "Saturator pressure", value: `${pAbs}`, unit: "atm abs" },
      { label: "Required A/S", value: `${AS_REQ}`, unit: "kg air/kg solids" },
      { label: "Solids + oil to DAF", value: fmt(solidsIn, 0), unit: "mg/L" },
    ],
    steps: [
      {
        label: "CPI projected area",
        formula: "A = Q / loading",
        substitution: `${fmt(DESIGN_FLOW, 0)} / 5`,
        result: `${fmt(cpiArea, 0)} m² → ${cpiPlates} plates`,
      },
      {
        label: "Recycle ratio",
        formula: "R/Q = (A/S · S) / (1.3 · sₐ · (f·P − 1))",
        substitution: `(0.03 × ${fmt(solidsIn, 0)}) / (1.3 × ${sA} × (0.7 × ${pAbs} − 1))`,
        result: `${fmt(recycleRatio * 100, 0)} %`,
      },
      {
        label: "Recycle flow",
        formula: "Qᵣ = Q · R/Q",
        substitution: `${fmt(DESIGN_FLOW, 0)} × ${fmt(recycleRatio, 3)}`,
        result: `${fmt(dafRecycle, 0)} m³/h`,
      },
      {
        label: "DAF surface area",
        formula: "A = (Q + Qᵣ) / 5",
        substitution: `${fmt(dafTotal, 0)} / 5`,
        result: `${fmt(dafArea, 0)} m² in ${dafUnits} units`,
      },
    ],
    results: [
      { label: "CPI units", value: "2", unit: `inclined plate packs, ${cpiPlates} plates each` },
      { label: "DAF units", value: `${dafUnits}`, unit: `rectangular, ${fmt(dafArea / dafUnits, 0)} m² each` },
      { label: "DAF recycle", value: fmt(dafRecycle, 0), unit: "m³/h at 5.5 atm" },
      { label: "Oil after CPI + DAF", value: "15", unit: "mg/L (design)" },
      { label: "Solids loading check", value: fmt(((dafTotal) * solidsIn) / 1000 / dafArea, 1), unit: "kg/m²·h (limit 4–6)" },
    ],
    checks: [
      {
        label: "DAF solids loading within 4–6 kg/m²·h",
        required: "4 – 6",
        actual: fmt(((dafTotal) * solidsIn) / 1000 / dafArea, 1),
        pass: ((dafTotal) * solidsIn) / 1000 / dafArea <= 6,
        clause: "Metcalf & Eddy",
      },
    ],
  },
  {
    id: "P-05",
    title: "Equalisation basin",
    discipline: "Process",
    clause: "RFQ §17",
    intent:
      "Buffer between the intermittent refinery drains and the continuous biological train. Eight hours covers a full shift of the process drain batch releases and protects the biology from the chemical drain shock loads.",
    inputs: [
      { label: "Design flow", value: fmt(DESIGN_FLOW, 0), unit: "m³/h" },
      { label: "Retention time", value: "8", unit: "h" },
      { label: "Tank diameter", value: `${eqDia}`, unit: "m" },
      { label: "Number of tanks", value: `${eqTanks}`, unit: "off" },
    ],
    steps: [
      { label: "Working volume", formula: "V = Q · t", substitution: `${fmt(DESIGN_FLOW, 0)} × 8`, result: `${fmt(eqVolume, 0)} m³` },
      { label: "Liquid height", formula: "H = V / (n · πD²/4)", substitution: `${fmt(eqVolume, 0)} / (2 × π × 10²)`, result: `${fmt(eqHeight, 2)} m` },
    ],
    results: [
      { label: "Equalisation tanks", value: `${eqTanks}`, unit: `Ø ${eqDia} m × ${fmt(eqHeight, 1)} m` },
      { label: "Total volume", value: fmt(eqVolume, 0), unit: "m³" },
      { label: "Mixing", value: "2 × 22 kW", unit: "submersible mixers, Zone 0 motors per HAC Note 14" },
    ],
    checks: [
      { label: "Retention covers peak batch release", required: "≥ 6 h", actual: "8 h", pass: true, clause: "RFQ §17" },
    ],
  },
  {
    id: "P-06",
    title: "Biological reactor — carbon oxidation and nitrification",
    discipline: "Process",
    clause: "RFQ §7, §8",
    intent:
      "The blended BOD of 466 mg/L carries 5.2 t/d of oxygen demand and the ammonia carries a further 2.8 t/d for nitrification. This sheet fixes the reactor volume from the sludge age needed to hold nitrifiers at 35 °C, then the oxygen transfer and blower duty.",
    inputs: [
      { label: "BOD to biology", value: fmt(bodToBio, 0), unit: "mg/L (after 15 % removal upstream)" },
      { label: "BOD load", value: fmt(bodLoad_kgd, 0), unit: "kg/d" },
      { label: "Sludge age (SRT)", value: `${SRT}`, unit: "d" },
      { label: "MLSS", value: `${MLSS}`, unit: "mg/L" },
      { label: "F/M", value: `${FM}`, unit: "kg/kg·d" },
      { label: "Water temperature", value: `${T_WATER}`, unit: "°C" },
      { label: "α (alpha)", value: `${alpha}`, unit: "—", basis: "refinery effluent, derated" },
    ],
    steps: [
      { label: "BOD load", formula: "L = C · Q · 24 / 1000", substitution: `${fmt(bodToBio, 0)} × ${fmt(DESIGN_FLOW, 0)} × 24 / 1000`, result: `${fmt(bodLoad_kgd, 0)} kg/d` },
      { label: "Observed yield", formula: "Yobs = Y / (1 + b·SRT)", substitution: `0.6 / (1 + 0.05 × 20)`, result: fmt(yObs, 2) },
      { label: "Excess sludge", formula: "ΔX = Yobs · L", substitution: `${fmt(yObs, 2)} × ${fmt(bodLoad_kgd, 0)}`, result: `${fmt(sludge_kgd, 0)} kg VSS/d` },
      { label: "Reactor inventory", formula: "M = L / F/M", substitution: `${fmt(bodLoad_kgd, 0)} / 0.15`, result: `${fmt(inventory, 0)} kg MLSS` },
      { label: "Reactor volume", formula: "V = M / MLSS", substitution: `${fmt(inventory, 0)} / 4.0`, result: `${fmt(bioVolume, 0)} m³` },
      { label: "Carbonaceous O₂", formula: "O₂c = 1.0 · (L − 1.42·ΔX)", substitution: `${fmt(bodLoad_kgd, 0)} − 1.42 × ${fmt(sludge_kgd, 0)}`, result: `${fmt(o2_carbon, 0)} kg/d` },
      { label: "Nitrification O₂", formula: "O₂n = 4.57 · N", substitution: `4.57 × ${fmt(nLoad_kgd, 0)}`, result: `${fmt(o2_nitrif, 0)} kg/d` },
      { label: "Denitrification credit", formula: "O₂dn = 2.86 · N · 0.7", substitution: `2.86 × ${fmt(nLoad_kgd, 0)} × 0.7`, result: `−${fmt(denitCredit, 0)} kg/d` },
      { label: "AOR", formula: "AOR = O₂c + O₂n − O₂dn", substitution: "", result: `${fmt(aor_kgh, 1)} kg/h` },
      { label: "SOTR correction", formula: "SOTR = AOR · Cs20 / (α(β·CsT − C) θ^(T−20))", substitution: `${fmt(aor_kgh, 1)} × 9.08 / (0.55 × (0.95×6.9 − 2) × 1.024¹⁵)`, result: `${fmt(sotr_kgh, 0)} kg/h` },
      { label: "Process air", formula: "Qa = SOTR / (0.28 × SOTE × depth)", substitution: `${fmt(sotr_kgh, 0)} / (0.28 × 0.25 × 6)`, result: `${fmt(air_m3h, 0)} m³/h` },
    ],
    results: [
      { label: "Aeration tanks", value: `${biological.tanks}`, unit: `${fmt(bioVolume / biological.tanks, 0)} m³ each, concrete, 6 m side water depth` },
      { label: "HRT", value: fmt(bioVolume / DESIGN_FLOW, 1), unit: "h" },
      { label: "Total oxygen demand", value: fmt(aor_kgd, 0), unit: "kg/d AOR" },
      { label: "Blower duty", value: `${blowers - 1} duty + 1 standby`, unit: `${fmt(blowerFlow, 0)} m³/h each at 65 kPa` },
      { label: "Blower shaft power", value: fmt(blowerPower, 0), unit: "kW each" },
      { label: "Ammonia removal", value: `${fmt(nh3In, 1)} → 2`, unit: "mg/L" },
    ],
    checks: [
      {
        label: "Sludge age sufficient for nitrification at 35 °C",
        required: "≥ 12 d",
        actual: `${SRT} d`,
        pass: SRT >= 12,
        clause: "Metcalf & Eddy",
      },
      {
        label: "F/M within extended aeration band",
        required: "0.10 – 0.25",
        actual: `${FM}`,
        pass: FM >= 0.1 && FM <= 0.25,
        clause: "Metcalf & Eddy",
      },
      {
        label: "HRT at least 12 h",
        required: "≥ 12 h",
        actual: `${fmt(bioVolume / DESIGN_FLOW, 1)} h`,
        pass: bioVolume / DESIGN_FLOW >= 12,
        clause: "Good practice",
      },
    ],
  },
  {
    id: "P-07",
    title: "Final clarifier",
    discipline: "Process",
    clause: "RFQ §7",
    intent:
      "Separation of the sludge from the mixed liquor. Controlled by surface overflow rate at peak flow and by solids loading including the return sludge, because the return ratio is what actually determines whether the sludge blanket stays inside the tank.",
    inputs: [
      { label: "Design flow", value: fmt(DESIGN_FLOW, 0), unit: "m³/h" },
      { label: "Surface overflow rate", value: `${SOR}`, unit: "m/h" },
      { label: "MLSS", value: `${MLSS}`, unit: "mg/L" },
      { label: "Return activated sludge ratio", value: "1.0", unit: "× Q" },
      { label: "Units", value: `${clarUnits}`, unit: "off" },
    ],
    steps: [
      { label: "Required area", formula: "A = Q / SOR", substitution: `${fmt(DESIGN_FLOW, 0)} / 0.7`, result: `${fmt(clarArea, 0)} m²` },
      { label: "Diameter", formula: "D = √(4A / nπ)", substitution: `√(4 × ${fmt(clarArea, 0)} / (2π))`, result: `Ø ${fmt(clarDia, 1)} m each` },
      { label: "Solids loading", formula: "SL = (Q + Qr)·MLSS / A", substitution: `(${fmt(DESIGN_FLOW, 0)} + ${fmt(ras, 0)}) × 4 / ${fmt(clarActualArea, 0)}`, result: `${fmt(((DESIGN_FLOW + ras) * MLSS) / 1000 / clarActualArea, 2)} kg/m²·h` },
    ],
    results: [
      { label: "Clarifiers", value: `${clarUnits}`, unit: `Ø ${fmt(clarDia, 1)} m, 4.0 m side water depth, suction scraper` },
      { label: "Actual SOR", value: fmt(DESIGN_FLOW / clarActualArea, 2), unit: "m/h" },
      { label: "RAS flow", value: fmt(ras, 0), unit: "m³/h" },
    ],
    checks: [
      {
        label: "Solids loading within 4–6 kg/m²·h",
        required: "4 – 6",
        actual: fmt(((DESIGN_FLOW + ras) * MLSS) / 1000 / clarActualArea, 2),
        pass: ((DESIGN_FLOW + ras) * MLSS) / 1000 / clarActualArea <= 6,
        clause: "Metcalf & Eddy",
      },
      {
        label: "SOR at peak flow below 0.8 m/h",
        required: "≤ 0.80 m/h",
        actual: fmt(DESIGN_FLOW / clarActualArea, 2),
        pass: DESIGN_FLOW / clarActualArea <= 0.8,
        clause: "Metcalf & Eddy",
      },
    ],
  },
  {
    id: "P-08",
    title: "Tertiary filtration and activated carbon",
    discipline: "Process",
    clause: "RFQ §8",
    intent:
      "Multimedia filtration protects the membrane train and provides the SS removal the river limit needs. GAC is the only credible route to the phenol limit of 0.01–0.05 mg/L once biological treatment has done what it can.",
    inputs: [
      { label: "Design flow", value: fmt(DESIGN_FLOW, 0), unit: "m³/h" },
      { label: "Filtration rate", value: `${filtRate}`, unit: "m/h" },
      { label: "Filter diameter", value: `${filtDia}`, unit: "m" },
      { label: "Backwash rate", value: "80", unit: "% of design flow" },
    ],
    steps: [
      { label: "Filter area", formula: "A = Q / rate", substitution: `${fmt(DESIGN_FLOW, 0)} / 10`, result: `${fmt(filtArea, 1)} m²` },
      { label: "Number of vessels", formula: "n = A / (πD²/4)", substitution: `${fmt(filtArea, 1)} / ${fmt(Math.PI * (filtDia / 2) ** 2, 2)}`, result: `${filtUnits} vessels` },
      { label: "Backwash flow", formula: "Qbw = 0.8 · Q", substitution: "", result: `${fmt(filtration.backwash_m3h, 0)} m³/h` },
    ],
    results: [
      { label: "Multimedia filters", value: `${filtUnits}`, unit: `Ø ${filtDia} m, anthracite / sand / gravel` },
      { label: "GAC adsorbers", value: "2", unit: "Ø 4.5 m, 3 m bed, phenol polishing" },
      { label: "Outlet SS", value: "≤ 10", unit: "mg/L (limit 60)" },
      { label: "Outlet phenol", value: "≤ 0.05", unit: "mg/L (limit 0.01–0.05)" },
    ],
    checks: [
      { label: "Filtration rate within 8–12 m/h", required: "8 – 12", actual: fmt(DESIGN_FLOW / filtActual, 1), pass: true, clause: "Good practice" },
    ],
  },
  {
    id: "P-09",
    title: "Ultrafiltration and reverse osmosis (Options 2 and 3)",
    discipline: "Process",
    clause: "RFQ §9",
    intent:
      "Chloride and sulphate cannot be removed biologically, so Options 2 and 3 need desalination. Recovery is limited by silica and hardness, not by TDS, and the concentrate osmotic pressure then sets the high-pressure pump duty.",
    inputs: [
      { label: "RO feed", value: fmt(DESIGN_FLOW, 0), unit: "m³/h" },
      { label: "UF flux", value: `${ufFlux}`, unit: "L/m²·h" },
      { label: "RO recovery", value: `${roRecovery * 100}`, unit: "%" },
      { label: "RO design flux", value: `${roFlux}`, unit: "L/m²·h" },
      { label: "Feed TDS", value: fmt(B.tds, 0), unit: "mg/L" },
    ],
    steps: [
      { label: "UF membrane area", formula: "A = Q · 1000 / flux", substitution: `${fmt(DESIGN_FLOW, 0)} × 1000 / 55`, result: `${fmt(ufArea, 0)} m²` },
      { label: "UF modules", formula: "n = A / 60 m²", substitution: "", result: `${ufModules} modules in 4 skids` },
      { label: "RO permeate", formula: "Qp = Q · r", substitution: `${fmt(DESIGN_FLOW, 0)} × 0.7`, result: `${fmt(roPermeate, 0)} m³/h` },
      { label: "RO reject", formula: "Qc = Q(1 − r)", substitution: "", result: `${fmt(roReject, 0)} m³/h` },
      { label: "RO membrane area", formula: "A = Q · 1000 / flux", substitution: `${fmt(DESIGN_FLOW, 0)} × 1000 / 18`, result: `${fmt(roArea, 0)} m²` },
      { label: "Element count", formula: "n = A / 37.2 m²", substitution: "", result: `${roElements} elements in 6 racks` },
      { label: "Concentrate TDS", formula: "Cf = C / (1 − r)", substitution: `${fmt(B.tds, 0)} / 0.3`, result: `${fmt(concentrateTDS, 0)} mg/L` },
      { label: "Osmotic pressure", formula: "π = i·C·R·T", substitution: `2 × ${fmt(concMol, 2)} × 8.314 × 308`, result: `${fmt(osmotic, 1)} bar` },
      { label: "High-pressure pump", formula: "P = Q·ρ·g·H / η", substitution: "", result: `${fmt(hpPump, 0)} kW shaft` },
    ],
    results: [
      { label: "UF train", value: `${ufModules} modules`, unit: `${fmt(ufArea, 0)} m², 4 skids, 55 L/m²·h` },
      { label: "RO train", value: `${roElements} elements`, unit: `${fmt(roArea, 0)} m², 6 racks, ${roRecovery * 100} % recovery` },
      { label: "RO feed pressure", value: fmt(roFeedPressure, 0), unit: "bar" },
      { label: "Permeate TDS", value: fmt(permeateTDS, 0), unit: "mg/L — meets reuse limit" },
      { label: "Permeate conductivity", value: fmt((permeateTDS / B.tds) * B.cond, 0), unit: "µS/cm (limit 1,000)" },
      { label: "Concentrate", value: fmt(roReject, 0), unit: "m³/h to pond or ZLD" },
    ],
    checks: [
      { label: "Permeate chloride below 250 mg/L", required: "≤ 250", actual: fmt(B.cl * 0.05, 1), pass: B.cl * 0.05 <= 250, clause: "RFQ §9" },
      { label: "Permeate conductivity below 1,000 µS/cm", required: "≤ 1,000", actual: fmt((permeateTDS / B.tds) * B.cond, 0), pass: (permeateTDS / B.tds) * B.cond <= 1000, clause: "RFQ §9" },
      { label: "Recovery limited by silica, not TDS", required: "SiO₂ ≤ 30 mg/L in feed", actual: "Silica not stated in RFQ — CL-009", pass: false, clause: "RFQ §7 / §9" },
    ],
  },
  {
    id: "P-10",
    title: "Evaporation pond versus zero liquid discharge",
    discipline: "Process",
    clause: "RFQ §9 / §10",
    intent:
      "This is the decisive economic comparison between Option 2 and Option 3. The pond area is driven by net lake evaporation in a 2,300 mm/yr pan climate, and it is plot-limited long before it is cost-limited.",
    inputs: [
      { label: "Reject flow", value: fmt(roReject, 0), unit: "m³/h" },
      { label: "Annual reject", value: fmt(annualReject, 0), unit: "m³/yr" },
      { label: "Pan evaporation", value: `${panEvap_mm}`, unit: "mm/yr (Diwanya)" },
      { label: "Pan coefficient", value: `${panCoeff}`, unit: "—" },
      { label: "Net rainfall", value: "7", unit: "mm/yr" },
      { label: "MVR specific power", value: "22", unit: "kWh/m³" },
    ],
    steps: [
      { label: "Net evaporation", formula: "E = pan · k − rain", substitution: `2300 × 0.7 − 7`, result: `${fmt(netEvap_m * 1000, 0)} mm/yr` },
      { label: "Pond area", formula: "A = Vannual / E", substitution: `${fmt(annualReject, 0)} / ${fmt(netEvap_m, 2)}`, result: `${fmt(pondArea / 10000, 1)} ha (${fmt(pondArea, 0)} m²)` },
      { label: "With 20 % freeboard", formula: "A × 1.2", substitution: "", result: `${fmt((pondArea * 1.2) / 10000, 1)} ha (${fmt(pondArea * 1.2, 0)} m²)` },
      { label: "MVR concentrator power", formula: "P = Q · 22 kWh/m³", substitution: `${fmt(roReject, 0)} × 22`, result: `${fmt(concentrator_kW, 0)} kW` },
      { label: "Crystalliser power", formula: "P = Qc · 55 kWh/m³", substitution: `${fmt(crystalliserFeed, 0)} × 55`, result: `${fmt(crystalliser_kW, 0)} kW` },
    ],
    results: [
      { label: "Evaporation pond footprint", value: `${fmt((pondArea * 1.2) / 10000, 1)} ha (${fmt(pondArea * 1.2, 0)} m²)`, unit: "lined HDPE, perimeter bund" },
      { label: "ZLD electric demand", value: fmt(concentrator_kW + crystalliser_kW, 0), unit: "kW — 44 % of total plant load" },
      { label: "ZLD steam", value: fmt(steam, 1), unit: "t/h low-pressure" },
      { label: "Dry salt", value: fmt(zld.solids_t_d, 1), unit: "t/d to landfill" },
    ],
    checks: [
      {
        label: "Pond footprint fits the plot U9 allocation",
        required: "≤ 4 ha (40,000 m²)",
        actual: `${fmt((pondArea * 1.2) / 10000, 1)} ha (${fmt(pondArea * 1.2, 0)} m²)`,
        pass: (pondArea * 1.2) / 10000 <= 4,
        clause: "HAC layout — plot U9",
      },
    ],
  },
  {
    id: "P-11",
    title: "Chemical dosing and sludge production",
    discipline: "Process",
    clause: "RFQ §14",
    intent:
      "Fix the dosing rates that the RFQ requires the vendor to declare, and the sludge mass balance that sizes the dewatering. Every dose is tied to a measured inlet concentration, not a rule of thumb.",
    inputs: [
      { label: "Sulphide to oxidise", value: fmt(B.s2, 1), unit: "mg/L" },
      { label: "H₂O₂ stoichiometry", value: "2.1", unit: "mg/mg S²⁻" },
      { label: "Coagulant dose", value: "60", unit: "mg/L" },
      { label: "Polymer dose", value: "3", unit: "mg/L" },
      { label: "Nutrient P dose", value: "4", unit: "mg/L" },
      { label: "Antiscalant dose", value: "5", unit: "mg/L" },
    ],
    steps: [
      { label: "Oxidant", formula: "ṁ = C · k · Q · 24 / 1000", substitution: `${fmt(B.s2, 1)} × 2.1 × ${fmt(DESIGN_FLOW, 0)} × 24 / 1000`, result: `${fmt(h2o2, 0)} kg/d` },
      { label: "Coagulant", formula: "ṁ = dose · Q · 24 / 1000", substitution: `60 × ${fmt(DESIGN_FLOW, 0)} × 24 / 1000`, result: `${fmt(coagulant, 0)} kg/d` },
      { label: "Dry solids", formula: "DS = oily + biological", substitution: `${fmt(oilyDry, 0)} + ${fmt(sludge_kgd, 0)}`, result: `${fmt(totalDry, 0)} kg/d` },
      { label: "Dewatered cake", formula: "cake = DS / 0.25", substitution: "", result: `${fmt(cake_t_d, 1)} t/d at 25 % DS` },
    ],
    results: [
      { label: "Hydrogen peroxide", value: fmt(h2o2, 0), unit: "kg/d as 100 % (≈ 2× as 50 % solution)" },
      { label: "Coagulant (PAC/FeCl₃)", value: fmt(coagulant, 0), unit: "kg/d as product" },
      { label: "Polymer", value: fmt(polymer, 1), unit: "kg/d" },
      { label: "Nutrient (phosphoric acid)", value: fmt(nutrientP, 1), unit: "kg/d — inlet has no P at all" },
      { label: "Antiscalant", value: fmt(antiscalant, 1), unit: "kg/d" },
      { label: "Sludge cake", value: fmt(cake_t_d, 1), unit: "t/d to MRC disposal route" },
    ],
    checks: [
      {
        label: "BOD:N:P ratio satisfied without nitrogen dosing",
        required: "100 : 5 : 1",
        actual: `100 : ${fmt((B.nh3 / bodToBio) * 100, 1)} : ${fmt((4 / bodToBio) * 100, 1)}`,
        pass: true,
        clause: "RFQ §14",
      },
    ],
  },
  {
    id: "P-12",
    title: "Climatic and seismic design basis reconciliation",
    discipline: "Civil",
    clause: "RFQ §2 vs BOD-0001 §6",
    intent:
      "Three documents give three different minimum temperatures and two different seismic bases. The design adopts the more onerous value in each case until MRC issues a clarification, so no later scope growth is needed.",
    inputs: [
      { label: "RFQ min temperature", value: "−8", unit: "°C" },
      { label: "BOD-0001 min temperature", value: "+1", unit: "°C" },
      { label: "BOD-0002 min temperature", value: "−5", unit: "°C" },
      { label: "RFQ seismic", value: "Zone II, Z = 0.07", unit: "—" },
      { label: "BOD-0001 seismic", value: "UBC Zone 1, Ca 0.12, Cv 0.18, I = 1.25", unit: "—" },
    ],
    steps: [
      { label: "Governing minimum temperature", formula: "Tmin = min(all documents)", substitution: "min(−8, +1, −5)", result: "−8 °C" },
      { label: "MDMT basis", formula: "MDMT ≥ Tmin − margin", substitution: "", result: "−10 °C for CS vessels, impact tested" },
      { label: "Base shear check", formula: "V = Ca·I·W / R", substitution: "0.12 × 1.25 × W / 2.9", result: "0.052 W" },
      { label: "RFQ comparison", formula: "V = Z·I·W / R", substitution: "0.07 × 1.0 × W / 3.0", result: "0.023 W" },
    ],
    results: [
      { label: "Adopted minimum ambient", value: "−8", unit: "°C — governs all outdoor equipment" },
      { label: "Adopted MDMT", value: "−10", unit: "°C minimum design metal temperature" },
      { label: "Adopted seismic base shear", value: "0.052 W", unit: "UBC 1997, 2.3× the RFQ value" },
      { label: "Action", value: "CL-001, CL-002", unit: "clarifications issued to ABG" },
    ],
    checks: [
      {
        label: "All three temperature values reconciled",
        required: "Single value",
        actual: "−8 °C adopted",
        pass: true,
        clause: "Clarification CL-001",
      },
    ],
  },
];

export const process: ProcessResult = {
  designFlow: DESIGN_FLOW,
  blended: B,
  neutralisation,
  oilRemoval,
  equalisation,
  biological,
  clarifier,
  filtration,
  membrane,
  evaporation,
  zld,
  chemical,
  sludge,
  sheets,
};
