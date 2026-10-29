/**
 * Optional manual pricing — a quantity-driven cross-check of the AACE estimate.
 *
 * calc/cost.ts builds the estimate from percentage factors. This sheet does the
 * same job from the other direction: unit rates that the estimating team can
 * overwrite line by line, applied to the quantities the design actually
 * produces —
 *
 *   pipe        per metre, scaled by wall thickness and material
 *   fittings    per tonne
 *   flanges     per piece, by size and pressure class
 *   gaskets     per flange, as a percentage of the flange price
 *   bolts       per flange set, as a percentage of the flange price
 *   valves      per piece, by type, size, class, material and actuation
 *   insulation  per m² of finished (built-up) area, by material
 *   painting    per m² to QC-SPC-001
 *
 * Each purchase is then carried to site: bought-out items add sea freight,
 * marine insurance, customs duty and handling on their FCA vendor-works price;
 * Ramsis-made items add the Bahrain-workshop-to-Diwanya transport, insurance
 * and site handling on their workshop price.
 *
 * Every rate here is a supply rate — ex works or FCA — so the logistics chain
 * can be challenged without disturbing the material price, and vice versa.
 * Nothing in this module is added to the estimate: it is an independent check
 * on it, which is exactly what a manual pricing sheet is for.
 */
import { equipment } from "@/data/equipment";
import { bulkTotals } from "@/lib/calc/bulk";
import { mtoTotals } from "@/lib/calc/mto";
import { insulationRows, insulationSummary, paintArea } from "@/lib/insulation";
import type { PipeClassKey } from "@/lib/equipment-register";
import {
  CLASS_RATING_BARG,
  lineTakeoff,
  pipeLines,
  scheduleThickness,
  valveSchedule,
  type LineValve,
  type ValveType,
} from "@/lib/piping";

export interface RateCard {
  /** USD/m of pipe — class 150 carbon steel, schedule 40, ex works. */
  pipe_per_m: Record<string, number>;
  /** USD/t of fittings — elbows, tees, reducers, caps, spools. */
  fittings_per_t: number;
  /** USD each, weld-neck flange — class 150 carbon steel, ex works. */
  flange_each: Record<string, number>;
  /** Spiral-wound gasket, % of the flange price. */
  gasket_pct: number;
  /** Stud bolt set (8 bolts), % of the flange price. */
  bolt_pct: number;
  /** USD each, valve at the 4 in / class 150 / hand-operated reference. */
  valve_each: Record<string, number>;
  /** USD adder per valve for actuation (positioner and solenoid included). */
  actuator_adder: Record<string, number>;
  /** Class 600 price over class 150 for the same valve or flange. */
  class600_factor: number;
  /** USD/m² of insulation — supply, install, fixing and aluminium jacketing. */
  insulation_per_m2: Record<string, number>;
  /** USD/m² — blast to Sa 2.5 plus the QC-SPC-001 system, supply and apply. */
  paint_per_m2: number;
  /** USD each for fabricated pipe supports, shop primed. */
  support_each: number;
  /** Bought-out items, FCA vendor works → site. */
  buy_freight_pct: number;
  buy_insurance_pct: number;
  buy_duty_pct: number;
  buy_handling_pct: number;
  /** Ramsis-made items, Bahrain workshop → Diwanya. */
  make_transport_per_t: number;
  make_insurance_pct: number;
  make_handling_pct: number;
}

/** Every NPS the line list can carry, so a rate can be entered before a line uses it. */
export const RATE_SIZES = [1, 1.5, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24];

export const VALVE_TYPES: ValveType[] = [
  "gate",
  "globe",
  "check",
  "ball",
  "butterfly",
  "plug",
  "diaphragm",
  "knife-gate",
  "control",
  "PSV",
];

export const ACTUATORS = ["manual", "pneumatic", "electric", "self-acting"];

export const INSULATION_MATERIALS = [
  "Rock wool 100 kg/m³",
  "Cellular glass",
  "PUF 40 kg/m³",
  "Aerogel blanket",
];

/**
 * 4Q-2026 Gulf basis, USD, ex works. These are working rates a buyer can
 * overwrite — they are not quotations and no vendor has been approached.
 */
export const DEFAULT_RATES: RateCard = {
  pipe_per_m: {
    "1": 14,
    "1.5": 20,
    "2": 28,
    "3": 45,
    "4": 62,
    "6": 96,
    "8": 142,
    "10": 196,
    "12": 262,
    "14": 312,
    "16": 384,
    "18": 452,
    "20": 534,
    "24": 706,
  },
  fittings_per_t: 5_400,
  flange_each: {
    "1": 24,
    "1.5": 34,
    "2": 46,
    "3": 72,
    "4": 98,
    "6": 164,
    "8": 246,
    "10": 344,
    "12": 462,
    "14": 566,
    "16": 704,
    "18": 852,
    "20": 1_010,
    "24": 1_420,
  },
  gasket_pct: 15,
  bolt_pct: 26,
  valve_each: {
    gate: 340,
    globe: 420,
    check: 300,
    ball: 560,
    butterfly: 380,
    plug: 520,
    diaphragm: 480,
    "knife-gate": 460,
    control: 2_800,
    PSV: 1_900,
  },
  actuator_adder: {
    manual: 0,
    pneumatic: 540,
    electric: 980,
    "self-acting": 0,
  },
  class600_factor: 2.4,
  insulation_per_m2: {
    "Rock wool 100 kg/m³": 92,
    "Cellular glass": 134,
    "PUF 40 kg/m³": 118,
    "Aerogel blanket": 235,
  },
  paint_per_m2: 22,
  support_each: 148,
  buy_freight_pct: 6.5,
  buy_insurance_pct: 0.35,
  buy_duty_pct: 5,
  buy_handling_pct: 3.5,
  make_transport_per_t: 165,
  make_insurance_pct: 0.35,
  make_handling_pct: 3,
};

/** Merge a stored card over the defaults so a new size or type is never undefined. */
export function mergeRates(stored?: Partial<RateCard> | null): RateCard {
  if (!stored) return DEFAULT_RATES;
  return {
    ...DEFAULT_RATES,
    ...stored,
    pipe_per_m: { ...DEFAULT_RATES.pipe_per_m, ...(stored.pipe_per_m ?? {}) },
    flange_each: { ...DEFAULT_RATES.flange_each, ...(stored.flange_each ?? {}) },
    valve_each: { ...DEFAULT_RATES.valve_each, ...(stored.valve_each ?? {}) },
    actuator_adder: { ...DEFAULT_RATES.actuator_adder, ...(stored.actuator_adder ?? {}) },
    insulation_per_m2: {
      ...DEFAULT_RATES.insulation_per_m2,
      ...(stored.insulation_per_m2 ?? {}),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Factors                                                             */
/* ------------------------------------------------------------------ */

/** Material escalation: pipe carries the alloy in the wall, fittings a lesser share. */
function materialFactor(material: string): { pipe: number; item: number } {
  if (/duplex|2205|2507|monel/i.test(material)) return { pipe: 5.5, item: 3.6 };
  if (/316|304|stainless/i.test(material)) return { pipe: 3.4, item: 2.2 };
  if (/frp|\bpp\b|pvc|ptfe|grp/i.test(material)) return { pipe: 1.8, item: 1.5 };
  return { pipe: 1, item: 1 };
}

const classFactor = (cls: PipeClassKey, r: RateCard) =>
  (CLASS_RATING_BARG[cls] ?? 19.6) > 50 ? r.class600_factor : 1;

/** A 24 in butterfly does not cost what a 24 in gate does — exponents differ by type. */
const sizeFactor = (nps: number, type: ValveType) => {
  const exp =
    type === "butterfly" || type === "plug" ? 0.6 : type === "control" || type === "PSV" ? 0.7 : 0.75;
  return Math.max(0.3, Math.pow(Math.max(nps, 1) / 4, exp));
};

/** Wall-thickness ratio against schedule 40 — what actually drives pipe price. */
const wallRatio = (nps: number, schedule: string) => {
  const actual = scheduleThickness(nps, schedule as "40");
  const base = scheduleThickness(nps, "40");
  return base > 0 ? actual / base : 1;
};

export function valveUnitPrice(
  r: RateCard,
  v: { type: ValveType; actuator?: LineValve["actuator"]; nps: number; pipeClass: PipeClassKey; material: string },
): number {
  const base = r.valve_each[v.type] ?? 0;
  const mat = materialFactor(v.material).item;
  const unit =
    base * sizeFactor(v.nps, v.type) * classFactor(v.pipeClass, r) * mat;
  return Math.round(unit) + (r.actuator_adder[v.actuator ?? "manual"] ?? 0);
}

/** Insulation material follows service temperature — the rule in lib/insulation. */
const insulMaterialFor = (temp_C: number) => {
  if (temp_C >= 60) return "Rock wool 100 kg/m³";
  if (temp_C <= 10) return "Cellular glass";
  return "PUF 40 kg/m³";
};

/* ------------------------------------------------------------------ */
/* Line-by-line pricing                                                */
/* ------------------------------------------------------------------ */

export interface LineAmounts {
  pipe: number;
  fittings: number;
  flanges: number;
  joints: number;
  valves: number;
  insulation: number;
  paint: number;
  supports: number;
}

export interface LinePriced {
  lineNo: string;
  service: string;
  nps: number;
  pipeClass: PipeClassKey;
  material: string;
  length_m: number;
  pipe_t: number;
  fittings_t: number;
  flanges: number;
  valves: number;
  insul_m2: number;
  paint_m2: number;
  supports: number;
  /** Blended USD/m actually charged for this line after wall and material. */
  pipe_rate: number;
  amounts: LineAmounts;
  supply: number;
  /** Manual entry, when the estimator prices the line as a whole. */
  override: number | null;
  total: number;
}

export function priceLine(r: RateCard, lineNo: string, override?: number | null): LinePriced {
  const to = lineTakeoff.find((t) => t.lineNo === lineNo)!;
  const pl = pipeLines.find((l) => l.lineNo === lineNo)!;
  const mat = materialFactor(pl.material);

  const flangeRate = (r.flange_each[String(to.nps)] ?? 0) * classFactor(pl.pipeClass, r) * mat.item;
  const pipeRate = Math.round(
    (r.pipe_per_m[String(to.nps)] ?? 0) * wallRatio(pl.nps, pl.schedule) * mat.pipe,
  );

  const amounts: LineAmounts = {
    pipe: pipeRate * to.length_m,
    fittings: to.fittings_t * r.fittings_per_t * mat.item,
    flanges: flangeRate * to.flanges,
    joints: flangeRate * ((r.gasket_pct + r.bolt_pct) / 100) * to.flanges,
    valves: pl.valves.reduce(
      (a, v) => a + valveUnitPrice(r, { ...v, nps: pl.nps, pipeClass: pl.pipeClass, material: pl.material }) * v.qty,
      0,
    ),
    insulation:
      to.insul_m2 * (r.insulation_per_m2[insulMaterialFor(pl.designT_C)] ?? 0),
    paint: to.paint_m2 * r.paint_per_m2,
    supports: to.supports * r.support_each,
  };

  const supply = Object.values(amounts).reduce((a, b) => a + b, 0);
  const ov = override != null && Number.isFinite(override) && override > 0 ? override : null;

  return {
    lineNo: pl.lineNo,
    service: pl.service,
    nps: pl.nps,
    pipeClass: pl.pipeClass,
    material: pl.material,
    length_m: to.length_m,
    pipe_t: to.pipe_t,
    fittings_t: to.fittings_t,
    flanges: to.flanges,
    valves: to.valves,
    insul_m2: to.insul_m2,
    paint_m2: to.paint_m2,
    supports: to.supports,
    pipe_rate: pipeRate,
    amounts,
    supply: Math.round(supply),
    override: ov,
    total: ov ?? Math.round(supply),
  };
}

/* ------------------------------------------------------------------ */
/* Logistics                                                           */
/* ------------------------------------------------------------------ */

export interface Landers {
  supply: number;
  freight: number;
  insurance: number;
  duty: number;
  handling: number;
  landed: number;
}

/** FCA vendor works → Diwanya: sea freight, marine insurance, duty, inland handling. */
export function landBought(r: RateCard, supply: number): Landers {
  const freight = (supply * r.buy_freight_pct) / 100;
  const insurance = (supply * r.buy_insurance_pct) / 100;
  const duty = (supply * r.buy_duty_pct) / 100;
  const handling = (supply * r.buy_handling_pct) / 100;
  return {
    supply: Math.round(supply),
    freight: Math.round(freight),
    insurance: Math.round(insurance),
    duty: Math.round(duty),
    handling: Math.round(handling),
    landed: Math.round(supply + freight + insurance + duty + handling),
  };
}

export interface MakeLanded {
  workshop: number;
  tonnes: number;
  transport: number;
  insurance: number;
  handling: number;
  delivered: number;
}

/** Bahrain workshop → Diwanya: transport by weight, insurance and site handling. */
export function landMade(r: RateCard, workshop: number, tonnes: number): MakeLanded {
  const transport = tonnes * r.make_transport_per_t;
  const insurance = (workshop * r.make_insurance_pct) / 100;
  const handling = (workshop * r.make_handling_pct) / 100;
  return {
    workshop: Math.round(workshop),
    tonnes: +tonnes.toFixed(1),
    transport: Math.round(transport),
    insurance: Math.round(insurance),
    handling: Math.round(handling),
    delivered: Math.round(workshop + transport + insurance + handling),
  };
}

/* ------------------------------------------------------------------ */
/* Equipment priced                                                    */
/* ------------------------------------------------------------------ */

export interface BuyPriced {
  tag: string;
  description: string;
  vendor: string;
  qty: number;
  tonnes: number;
  landers: Landers;
}

export interface MakePriced {
  tag: string;
  description: string;
  qty: number;
  tonnes: number;
  landed: MakeLanded;
}

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export interface PaintGroup {
  label: string;
  basis: string;
  area_m2: number;
  amount: number;
  /** Already inside the workshop build-up — shown, not totalled. */
  memo: boolean;
}

export interface InsulationPriced {
  tag: string;
  host: string;
  material: string;
  temp_C: number;
  thickness_mm: number;
  area_m2: number;
  rate: number;
  amount: number;
}

export interface PricedProject {
  lines: LinePriced[];
  valveRows: {
    type: ValveType;
    qty: number;
    actuated: number;
    unit_avg: number;
    amount: number;
  }[];
  insulation: InsulationPriced[];
  paintGroups: PaintGroup[];
  bought: BuyPriced[];
  made: MakePriced[];
  bulk: Landers;
  totals: {
    bulkSupply: number;
    insulation: number;
    paint: number;
    bought: number;
    made: number;
    grand: number;
  };
}

/**
 * Price the whole package against one rate card.
 * `overrides` maps a line number to a manual total for that line; a manual
 * entry replaces the calculated supply for the line and then travels through
 * the same freight, insurance, duty and handling chain as any bought material.
 */
export function priceProject(r: RateCard, overrides: Record<string, number> = {}): PricedProject {
  const lines = lineTakeoff.map((t) => priceLine(r, t.lineNo, overrides[t.lineNo]));

  /* Valves, summarised by type at the price actually charged on the lines. */
  const valveRows = valveSchedule.map((v) => {
    const priced = pipeLines
      .flatMap((pl) =>
        pl.valves
          .filter((x) => x.type === v.type)
          .map((x) => valveUnitPrice(r, { ...x, nps: pl.nps, pipeClass: pl.pipeClass, material: pl.material }) * x.qty),
      )
      .reduce((a, b) => a + b, 0);
    return {
      type: v.type,
      qty: v.qty,
      actuated: v.actuated,
      unit_avg: v.qty > 0 ? Math.round(priced / v.qty) : 0,
      amount: Math.round(priced),
    };
  });

  const insulation = insulationRows.map((row) => {
    const rate = r.insulation_per_m2[row.material] ?? 0;
    return {
      tag: row.tag,
      host: row.host,
      material: row.material,
      temp_C: row.temp_C,
      thickness_mm: row.thickness_mm,
      area_m2: row.finishedArea_m2,
      rate,
      amount: Math.round(row.finishedArea_m2 * rate),
    };
  });

  const paintGroups: PaintGroup[] = [
    {
      label: "Bare piping",
      basis: `${pipeLines.filter((l) => l.insulation_mm === 0).length} uninsulated lines, OD × length`,
      area_m2: paintArea.piping_m2,
      amount: Math.round(paintArea.piping_m2 * r.paint_per_m2),
      memo: false,
    },
    {
      label: "Pipe rack steel",
      basis: `${nf0(bulkTotals.rack_t)} t of rack sections`,
      area_m2: bulkTotals.rack_paint_m2,
      amount: Math.round(bulkTotals.rack_paint_m2 * r.paint_per_m2),
      memo: false,
    },
    {
      label: "Insulation jacketing",
      basis: "Al 0.8 mm jacket, painted on the jacket only",
      area_m2: insulationSummary.jacketing_m2,
      amount: Math.round(insulationSummary.jacketing_m2 * r.paint_per_m2),
      memo: false,
    },
    {
      label: "Equipment and structures",
      basis: "Already inside the workshop cost build-up — memo only",
      area_m2: mtoTotals.coating_m2,
      amount: Math.round(mtoTotals.coating_m2 * r.paint_per_m2),
      memo: true,
    },
  ];

  const bought: BuyPriced[] = equipment
    .filter((e) => e.makeBuy === "BUY")
    .map((e) => ({
      tag: e.tag,
      description: e.description,
      vendor: e.vendor,
      qty: e.qty,
      tonnes: +(e.weight_t * e.qty).toFixed(1),
      landers: landBought(r, e.cost_usd * e.qty),
    }));

  const made: MakePriced[] = equipment
    .filter((e) => e.makeBuy === "MAKE")
    .map((e) => ({
      tag: e.tag,
      description: e.description,
      qty: e.qty,
      tonnes: +(e.weight_t * e.qty).toFixed(1),
      landed: landMade(r, e.cost_usd * e.qty, e.weight_t * e.qty),
    }));

  const bulkSupply = lines.reduce((a, l) => a + l.total, 0);
  const bulk = landBought(r, bulkSupply);

  const insulationTotal = insulation.reduce((a, i) => a + i.amount, 0);
  const paintTotal = paintGroups.filter((g) => !g.memo).reduce((a, g) => a + g.amount, 0);
  const boughtTotal = bought.reduce((a, b) => a + b.landers.landed, 0);
  const madeTotal = made.reduce((a, m) => a + m.landed.delivered, 0);

  return {
    lines,
    valveRows,
    insulation,
    paintGroups,
    bought,
    made,
    bulk,
    totals: {
      bulkSupply: bulk.landed,
      insulation: insulationTotal,
      paint: paintTotal,
      bought: boughtTotal,
      made: madeTotal,
      grand: bulk.landed + insulationTotal + paintTotal + boughtTotal + madeTotal,
    },
  };
}

const nf0 = (v: number) => Math.round(v).toLocaleString("en-US");
