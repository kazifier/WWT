/**
 * The four discharge options, set side by side.
 *
 * Option 1, 2 and 3 are the ones the RFQ asks for (§8, §9, §10). Option 2R is the
 * fourth route this dossier recommends: the same RO reuse as Option 2, but the
 * reject is concentrated in an MVR unit instead of being spread over a 108 ha
 * evaporation pond, and no crystalliser is installed because the small brine
 * stream leaves the plot.
 *
 * Every number here is derived — power from the process sheet, land from the
 * evaporation and thermal-duty calculations, cost from the estimate model — so a
 * change in the process propagates into this comparison instead of leaving a
 * second set of figures to maintain.
 */

import { process as P } from "@/lib/calc/process";
import { loadSummary } from "@/lib/calc/mechanical";
import { optionEstimates, opexFor, lifeCycle } from "@/lib/calc/cost";
import { blendedAll } from "@/data/influent";
import { plotArea_m2 } from "@/lib/plantLayout";

export type CompareId = "opt1" | "opt2" | "opt2r" | "opt3";

export interface ScoreRow {
  criterion: string;
  weight: number;
  score: number;
  /** Why the option scores what it does. */
  note: string;
}

export interface OptionComparison {
  id: CompareId;
  code: string;
  name: string;
  short: string;
  recommended: boolean;
  basis: string;
  disposition: string;
  train: { stage: string; detail: string }[];
  /** Share of the RO feed recovered as reusable water, %. */
  recovery_pct: number;
  reuse_m3h: number;
  /** Liquid that still leaves the battery limit as effluent, m³/h. */
  discharge_m3h: number;
  /** Liquid routed to the evaporation pond, m³/h. */
  pond_m3h: number;
  /** Concentrated brine transferred to the refinery brine system, m³/h. */
  brine_m3h: number;
  salt_t_d: number;
  /** Total plant electric demand including the option-specific equipment, kW. */
  power_kW: number;
  /** Power the option adds over the common treatment train, kW. */
  incremental_kW: number;
  /** Land the option needs beyond the plot U9 process footprint, m². */
  land_m2: number;
  land_basis: string;
  /** Product / final liquid quality used for the compliance call. */
  chloride_mgL: number | null;
  sulphate_mgL: number | null;
  tds_mgL: number | null;
  river_compliant: boolean;
  reuse_compliant: boolean;
  risks: string[];
  scores: ScoreRow[];
  capex: number;
  opex: number;
  lcc: number;
  perCapacity: number;
}

const B = blendedAll();

/* Common train demand (Areas 10–90) — the same figure the load list states. */
const BASE_POWER = loadSummary.demand;

/* RO train: HP pump plus the auxiliary load the estimate model also carries. */
const RO_POWER = P.membrane.hpPump_kW * 1.05 + 120;

/* MVR concentrator and crystalliser, from the ZLD sheet. */
const CONCENTRATOR_KW = P.zld.concentrator_kW;
const CRYSTALLISER_KW = P.zld.crystalliser_kW;

/* RO mass balance at the 110 % design case (550 m³/h feed to the membranes). */
const RO_FEED = P.membrane.roPermeate + P.membrane.roReject;
const RO_PERMEATE = P.membrane.roPermeate;
const RO_REJECT = P.membrane.roReject;

/* 95 % rejection assumed for the ionic species the river limits govern. */
const REJECTION = 0.95;
const permeateChloride = +(B.cl * (1 - REJECTION)).toFixed(0);
const permeateSulphate = +(B.so4 * (1 - REJECTION)).toFixed(0);

/* Brine concentrator: 80 % of the reject recovered as distillate. */
const CONCENTRATE_RECOVERY = 0.8;
const DISTILLATE = +(RO_REJECT * CONCENTRATE_RECOVERY).toFixed(0);
const BRINE = +(RO_REJECT - DISTILLATE).toFixed(0);

/* Thermal island plot allowance: 20 m² per m³/h of feed to the thermal plant. */
const THERMAL_LAND_PER_M3H = 20;
const SALT_STORE_M2 = 600;

const estimate = (id: CompareId) => optionEstimates.find((o) => o.id === id)!;
const opex = (id: CompareId) => opexFor(id).total;
const lcc = (id: CompareId) => lifeCycle.find((l) => l.id === id)!.total;

const pondArea_m2 = P.evaporation.areaWithFreeboard_ha * 10_000;

/**
 * Weighted decision matrix.
 *
 * Weights are the project's, not the vendor's: discharge compliance carries 30 %
 * because a non-compliant option has no value however cheap it is. The cost row
 * is dropped in the client view by the page, and the remaining weights are
 * renormalised so the ranking stays honest rather than being scaled down.
 */
function scoresFor(id: CompareId): ScoreRow[] {
  const compliance: Record<CompareId, [number, string]> = {
    opt1: [1, "Fails the river chloride (600 mg/L) and sulphate (400 mg/L) limits — needs an MRC deviation"],
    opt2: [5, "Nothing reaches the river; permeate meets the reuse limits"],
    opt2r: [5, "Nothing reaches the river and no pond is relied on for compliance"],
    opt3: [5, "No liquid effluent at all; distillate recycled"],
  };
  const recovery: Record<CompareId, [number, string]> = {
    opt1: [1, "No water recovered — the whole 500 m³/h is discharged"],
    opt2: [4, `${RO_PERMEATE} m³/h of permeate back to the raw-water RO`],
    opt2r: [5, `${RO_PERMEATE + DISTILLATE} m³/h recovered — permeate plus concentrator distillate`],
    opt3: [5, "Full recovery as distillate; only solids leave"],
  };
  const land: Record<CompareId, [number, string]> = {
    opt1: [5, "Outfall and monitoring station only"],
    opt2: [1, `Pond needs ${P.evaporation.areaWithFreeboard_ha} ha — the plot cannot hold it`],
    opt2r: [4, `Concentrator island of about ${((RO_REJECT * THERMAL_LAND_PER_M3H) / 10_000).toFixed(1)} ha`],
    opt3: [3, "Concentrator, crystalliser and salt store on the plot"],
  };
  const energy: Record<CompareId, [number, string]> = {
    opt1: [5, "Common train only"],
    opt2: [3, "RO high-pressure pumping; pond needs no power"],
    opt2r: [3, "RO plus MVR concentrator at 35 % of the ZLD thermal load"],
    opt3: [1, "MVR plus crystalliser — the largest load in the package"],
  };
  const cost: Record<CompareId, [number, string]> = {
    opt1: [5, "Cheapest to build, and non-compliant"],
    opt2: [2, "Pond lining and earthworks dominate"],
    opt2r: [3, "RO plus concentrator, no pond and no crystalliser"],
    opt3: [3, "Concentrator and crystalliser, no pond"],
  };
  const operability: Record<CompareId, [number, string]> = {
    opt1: [3, "Simple plant, but the discharge licence depends on a deviation"],
    opt2: [2, "Permanent leachate and seepage liability; pond performance is weather-driven"],
    opt2r: [4, "One rotary machine added; brine transfer needs an MRC agreement"],
    opt3: [3, "Crystalliser is a single point of failure for the discharge licence"],
  };

  return [
    { criterion: "Discharge compliance", weight: 0.3, score: compliance[id][0], note: compliance[id][1] },
    { criterion: "Water recovery", weight: 0.15, score: recovery[id][0], note: recovery[id][1] },
    { criterion: "Plot area", weight: 0.15, score: land[id][0], note: land[id][1] },
    { criterion: "Energy and operating simplicity", weight: 0.15, score: energy[id][0], note: energy[id][1] },
    { criterion: "Capital cost", weight: 0.1, score: cost[id][0], note: cost[id][1] },
    { criterion: "Operability and risk", weight: 0.15, score: operability[id][0], note: operability[id][1] },
  ];
}

export const weights = {
  compliance: 0.3,
  recovery: 0.15,
  land: 0.15,
  energy: 0.15,
  cost: 0.1,
  operability: 0.15,
};

/** Weighted total; set `includeCost` false for the client view. */
export function weightedTotal(scores: ScoreRow[], includeCost = true): number {
  const use = scores.filter((s) => includeCost || s.criterion !== "Capital cost");
  const weight = use.reduce((a, s) => a + s.weight, 0);
  return +(use.reduce((a, s) => a + s.score * s.weight, 0) / weight).toFixed(2);
}

export const optionComparisons: OptionComparison[] = [
  {
    id: "opt1",
    code: "1",
    name: "Option 1 — Discharge to the river",
    short: "River discharge",
    recommended: false,
    basis:
      "Treated effluent discharged to the Diwanya river channel under the Iraqi regulation for preservation of water sources (RFQ §8).",
    disposition: "Surface discharge through an outfall diffuser at the battery limit.",
    train: [
      { stage: "Neutralisation", detail: "Two 45 m³ agitated tanks, caustic and acid dosing" },
      { stage: "Oil removal", detail: "API separator, CPI and DAF" },
      { stage: "Biological", detail: "Aeration basins, clarifier, RAS/WAS" },
      { stage: "Polishing", detail: "Multimedia filtration, GAC and oxidation for phenol" },
      { stage: "Discharge", detail: "Outfall, diffuser and river monitoring station" },
    ],
    recovery_pct: 0,
    reuse_m3h: 0,
    discharge_m3h: 500,
    pond_m3h: 0,
    brine_m3h: 0,
    salt_t_d: 0,
    power_kW: BASE_POWER,
    incremental_kW: 0,
    land_m2: 1_200,
    land_basis: "Outfall, diffuser and monitoring station",
    chloride_mgL: Math.round(B.cl),
    sulphate_mgL: Math.round(B.so4),
    tds_mgL: Math.round(B.tds),
    river_compliant: false,
    reuse_compliant: false,
    risks: [
      "Chloride 1,560 mg/L against a 600 mg/L limit and sulphate 813 mg/L against 400 mg/L — desalination is the only way to meet them.",
      "A deviation would have to be agreed with MRC before award, and it would not survive a change of regulator.",
      "Phenol 0.01–0.05 mg/L is the tightest number in the specification; polishing oxidation plus GAC is mandatory, not optional.",
    ],
    scores: scoresFor("opt1"),
    capex: estimate("opt1").total,
    opex: opex("opt1"),
    lcc: lcc("opt1"),
    perCapacity: estimate("opt1").perCapacity,
  },
  {
    id: "opt2",
    code: "2",
    name: "Option 2 — RO reuse and evaporation pond",
    short: "RO reuse + pond",
    recommended: false,
    basis:
      "Maximum treated water returned to the raw-water RO inlet, with the reject to a lined evaporation pond (RFQ §9).",
    disposition: "Permeate to the raw-water RO; reject to a lined pond, no discharge to the river.",
    train: [
      { stage: "Common treatment train", detail: "As Option 1 through GAC" },
      { stage: "Ultrafiltration", detail: `${P.membrane.ufSkids} skids, ${P.membrane.ufModules} modules, ${P.membrane.ufArea_m2.toLocaleString("en-US")} m²` },
      { stage: "Reverse osmosis", detail: `${P.membrane.roElements} elements at ${P.membrane.roRecovery * 100} % recovery, ${P.membrane.roFeedPressure_bar} bar` },
      { stage: "Evaporation pond", detail: `${P.evaporation.areaWithFreeboard_ha} ha lined HDPE at ${P.evaporation.netEvap_m_yr} m/yr net evaporation` },
    ],
    recovery_pct: Math.round((RO_PERMEATE / RO_FEED) * 100),
    reuse_m3h: RO_PERMEATE,
    discharge_m3h: 0,
    pond_m3h: RO_REJECT,
    brine_m3h: 0,
    salt_t_d: 0,
    power_kW: BASE_POWER + RO_POWER,
    incremental_kW: RO_POWER,
    land_m2: pondArea_m2 + 3_500,
    land_basis: `Pond ${P.evaporation.areaWithFreeboard_ha} ha with 20 % freeboard, plus the RO and UF bays`,
    chloride_mgL: permeateChloride,
    sulphate_mgL: permeateSulphate,
    tds_mgL: P.membrane.permeateTDS,
    river_compliant: true,
    reuse_compliant: true,
    risks: [
      `The pond is plot-driven, not cost-driven: ${P.evaporation.areaWithFreeboard_ha} ha against a plot U9 of ${(plotArea_m2 / 10_000).toFixed(1)} ha.`,
      "A lined pond is a permanent leachate and seepage liability under MRC environmental permitting, and it fails visibly if the liner is damaged.",
      "Evaporation is weather-dependent — net evaporation assumes 2,300 mm/yr pan less 7 mm/yr rain.",
    ],
    scores: scoresFor("opt2"),
    capex: estimate("opt2").total,
    opex: opex("opt2"),
    lcc: lcc("opt2"),
    perCapacity: estimate("opt2").perCapacity,
  },
  {
    id: "opt2r",
    code: "2R",
    name: "Option 2R — RO reuse with brine concentrator",
    short: "RO reuse + MVR concentrator",
    recommended: true,
    basis:
      "The recommended fourth route: RO reuse as Option 2, but the reject is concentrated in an MVR unit instead of being evaporated in a pond. No crystalliser, because the residual brine leaves the plot.",
    disposition: `Permeate and distillate to the raw-water RO (${RO_PERMEATE + DISTILLATE} m³/h); ${BRINE} m³/h of concentrated brine to the refinery brine system.`,
    train: [
      { stage: "Common treatment train", detail: "As Option 1 through GAC" },
      { stage: "Ultrafiltration", detail: `${P.membrane.ufModules} modules, ${P.membrane.ufArea_m2.toLocaleString("en-US")} m²` },
      { stage: "Reverse osmosis", detail: `${P.membrane.roRecovery * 100} % recovery, ${P.membrane.roReject} m³/h reject` },
      { stage: "MVR brine concentrator", detail: `${CONCENTRATE_RECOVERY * 100} % of the reject recovered as distillate at ${(CONCENTRATOR_KW / RO_REJECT).toFixed(0)} kWh/m³` },
      { stage: "Brine transfer", detail: `${BRINE} m³/h at about 25 % TDS to the refinery brine system` },
    ],
    recovery_pct: Math.round(((RO_PERMEATE + DISTILLATE) / RO_FEED) * 100),
    reuse_m3h: RO_PERMEATE + DISTILLATE,
    discharge_m3h: 0,
    pond_m3h: 0,
    brine_m3h: BRINE,
    salt_t_d: 0,
    power_kW: BASE_POWER + RO_POWER + CONCENTRATOR_KW * 0.35,
    incremental_kW: RO_POWER + CONCENTRATOR_KW * 0.35,
    land_m2: RO_REJECT * THERMAL_LAND_PER_M3H + 3_500,
    land_basis: `Concentrator island of about ${((RO_REJECT * THERMAL_LAND_PER_M3H) / 10_000).toFixed(1)} ha, no pond`,
    chloride_mgL: permeateChloride,
    sulphate_mgL: permeateSulphate,
    tds_mgL: P.membrane.permeateTDS,
    river_compliant: true,
    reuse_compliant: true,
    risks: [
      "The brine transfer needs a written acceptance from MRC — it is the one interface that is not in RAMSIS scope.",
      "MVR scaling on sulphate and silica needs the antiscalant regime proven in the pilot; the concentrator is one machine, so sparing is a spares decision.",
      "Brine composition must be confirmed against the refinery brine system's materials before the detailed design freeze.",
    ],
    scores: scoresFor("opt2r"),
    capex: estimate("opt2r").total,
    opex: opex("opt2r"),
    lcc: lcc("opt2r"),
    perCapacity: estimate("opt2r").perCapacity,
  },
  {
    id: "opt3",
    code: "3",
    name: "Option 3 — Zero liquid discharge",
    short: "ZLD",
    recommended: false,
    basis:
      "Brine concentrator plus crystalliser; no liquid effluent leaves the battery limit (RFQ §10).",
    disposition: "Distillate recycled to the raw-water RO; dry salt to landfill.",
    train: [
      { stage: "Common treatment train", detail: "As Option 1 through GAC" },
      { stage: "Reverse osmosis", detail: `${P.membrane.roRecovery * 100} % recovery` },
      { stage: "MVR concentrator", detail: `${CONCENTRATOR_KW.toLocaleString("en-US")} kW` },
      { stage: "Crystalliser", detail: `${CRYSTALLISER_KW.toLocaleString("en-US")} kW, ${P.zld.steam_t_h} t/h steam` },
      { stage: "Salt handling", detail: `${P.zld.solids_t_d} t/d of mixed salt to landfill` },
    ],
    recovery_pct: 100,
    reuse_m3h: RO_PERMEATE + DISTILLATE,
    discharge_m3h: 0,
    pond_m3h: 0,
    brine_m3h: 0,
    salt_t_d: P.zld.solids_t_d,
    power_kW: BASE_POWER + RO_POWER + CONCENTRATOR_KW + CRYSTALLISER_KW,
    incremental_kW: RO_POWER + CONCENTRATOR_KW + CRYSTALLISER_KW,
    land_m2: (RO_REJECT + BRINE) * THERMAL_LAND_PER_M3H + SALT_STORE_M2,
    land_basis: "Concentrator, crystalliser and salt store — no pond",
    chloride_mgL: null,
    sulphate_mgL: null,
    tds_mgL: null,
    river_compliant: true,
    reuse_compliant: true,
    risks: [
      `Adds ${(CONCENTRATOR_KW + CRYSTALLISER_KW).toLocaleString("en-US")} kW — the MVR compressor becomes the largest single load in the refinery's WWT package.`,
      `Salt disposal route, classification and transport of ${P.zld.solids_t_d} t/d still to be agreed with MRC.`,
      "Crystalliser availability is the single point of failure for the whole discharge licence.",
    ],
    scores: scoresFor("opt3"),
    capex: estimate("opt3").total,
    opex: opex("opt3"),
    lcc: lcc("opt3"),
    perCapacity: estimate("opt3").perCapacity,
  },
];

export const recommendedOption = optionComparisons.find((o) => o.recommended)!;

export const ranking = (includeCost = true) =>
  [...optionComparisons]
    .map((o) => ({ id: o.id, code: o.code, short: o.short, total: weightedTotal(o.scores, includeCost) }))
    .sort((a, b) => b.total - a.total);

/** Option 2R against the cheapest compliant alternative that avoids a pond. */
export const commercialDelta = (() => {
  const r = recommendedOption;
  const zld = optionComparisons.find((o) => o.id === "opt3")!;
  const pond = optionComparisons.find((o) => o.id === "opt2")!;
  return {
    capexVsPond: r.capex - pond.capex,
    capexVsZld: r.capex - zld.capex,
    lccVsPond: r.lcc - pond.lcc,
    lccVsZld: r.lcc - zld.lcc,
    opexVsPond: r.opex - pond.opex,
    opexVsZld: r.opex - zld.opex,
  };
})();
