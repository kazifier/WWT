/**
 * Electrical load and cable schedule — EL-BOD-0001 Rev-0.
 *
 * Motors are not typed in separately: they are taken from the equipment
 * register wherever a driven item carries absorbed power, so a changed pump
 * rating propagates into the motor list, the feeder schedule, the cable sizes,
 * the tray fill check and the transformer loading check. Panels, earthing and
 * lightning protection follow the same basis document.
 */

import { EQUIPMENT_REGISTER } from "@/lib/equipment-register";
import { loadSummary } from "@/lib/calc/mechanical";

/**
 * Items that are not part of the continuously energised base load:
 * the Option 3 ZLD train (an alternative to the evaporation pond, priced and
 * modelled separately) and the standby generator, which is a source, not a load.
 * They stay in the motor and cable schedule — the workshop still makes their
 * feeders — but they are carried outside the transformer demand.
 */
const OPTIONAL_TAGS = new Set(["ZLD-9501", "ZLD-9502", "GEN-9901"]);

export type StarterType = "DOL" | "Star-delta" | "VFD" | "Soft starter";

export interface CableSize {
  size: string;
  /** Copper XLPE/SWA/PVC, clipped direct, 40 °C ambient — IEC 60364-5-52 table B.52.4. */
  ampacity: number;
  /** Conductor cross-section, mm². */
  mm2: number;
  /** Overall diameter, mm. */
  od: number;
}

export const CABLE_TABLE: CableSize[] = [
  { size: "4C×2.5", ampacity: 24, mm2: 2.5, od: 15 },
  { size: "4C×4", ampacity: 32, mm2: 4, od: 17 },
  { size: "4C×6", ampacity: 41, mm2: 6, od: 19 },
  { size: "4C×10", ampacity: 57, mm2: 10, od: 22 },
  { size: "4C×16", ampacity: 76, mm2: 16, od: 25 },
  { size: "4C×25", ampacity: 101, mm2: 25, od: 29 },
  { size: "4C×35", ampacity: 125, mm2: 35, od: 32 },
  { size: "4C×50", ampacity: 151, mm2: 50, od: 37 },
  { size: "4C×70", ampacity: 192, mm2: 70, od: 42 },
  { size: "4C×95", ampacity: 232, mm2: 95, od: 47 },
  { size: "4C×120", ampacity: 282, mm2: 120, od: 52 },
  { size: "4C×150", ampacity: 330, mm2: 150, od: 57 },
  { size: "4C×185", ampacity: 380, mm2: 185, od: 63 },
  { size: "4C×240", ampacity: 445, mm2: 240, od: 71 },
];

/**
 * 3.3 kV MV feeders are single-core, trefoil — IEC 60502-2, copper XLPE/CWS.
 * They are not put on the LV ladder tray; the MV route has its own clearance.
 */
export const MV_CABLE_TABLE: CableSize[] = [
  { size: "1C×95", ampacity: 250, mm2: 95, od: 26 },
  { size: "1C×120", ampacity: 290, mm2: 120, od: 28 },
  { size: "1C×185", ampacity: 355, mm2: 185, od: 32 },
  { size: "1C×240", ampacity: 420, mm2: 240, od: 35 },
  { size: "1C×300", ampacity: 480, mm2: 300, od: 38 },
  { size: "1C×400", ampacity: 555, mm2: 400, od: 42 },
];

export const MOTOR_EFFICIENCY = 0.94;
export const MOTOR_PF = 0.87;
export const LV_VOLTAGE = 400;
export const MV_VOLTAGE = 3300;

export interface MotorRow {
  tag: string;
  description: string;
  area: string;
  zone: string;
  kw: number;
  qty: number;
  volts: number;
  starter: StarterType;
  /** Full-load current per motor, A. */
  flc: number;
  /** Breaker / MCC bucket rating, A — 1.25 × FLC (IEC 60364-4-43). */
  breaker: number;
  cable: string;
  /** Parallel runs per phase, where one cable cannot carry the breaker rating. */
  runs: number;
  cable_ampacity: number;
  /** Copper cross-section of one run, mm² — used for the volt-drop calculation. */
  cable_mm2: number;
  cable_od: number;
  /** Volt drop at full load over the route, % of nominal. */
  drop_pct: number;
  /** Estimated route length motor → MCC, m. */
  route_m: number;
  /** True where the item is Option 3 or standby and sits outside the base demand. */
  optional: boolean;
  exRating: string;
  makeBuy: string;
}

function starterFor(kw: number, description: string): StarterType {
  if (/centrifuge|blower|compressor/i.test(description)) return "VFD";
  if (kw >= 75) return "VFD";
  if (kw >= 11) return "Star-delta";
  return "DOL";
}

const RESISTIVITY_CU = 0.0175; // Ω·mm²/m at 90 °C XLPE conductor temperature

/**
 * Feeder selection against both criteria that actually govern a motor circuit:
 * the cable must carry the breaker setting (IEC 60364-4-43 §433.1), and the run
 * must stay inside the 5 % volt drop of §525. Where one cable is too small the
 * feeder is split into parallel runs rather than a size that does not exist.
 */
const MAX_RUNS = 4; // beyond four parallel runs a busbar or a larger cable is the answer

function feederFor(breaker: number, flc: number, route_m: number, volts: number) {
  const table = volts > 1000 ? MV_CABLE_TABLE : CABLE_TABLE;
  const dropFor = (c: CableSize, runs: number) =>
    ((Math.sqrt(3) * (flc / runs) * RESISTIVITY_CU * route_m) / c.mm2 / volts) * 100;

  // Prefer the fewest runs: one cable of the next size is cheaper to install than
  // two small ones, so run count is negotiated before cable size.
  for (let runs = 1; runs <= MAX_RUNS; runs++) {
    const needed = breaker / runs;
    for (const c of table) {
      if (c.ampacity < needed) continue;
      const drop = dropFor(c, runs);
      // 4 % design target leaves margin inside the 5 % code limit of IEC 60364-5-52 §525.
      if (drop <= 4) return { cable: c, runs, drop: +drop.toFixed(2) };
    }
  }
  // No single or parallel arrangement inside the table meets both; size on ampacity.
  const c = table[table.length - 1];
  const runs = Math.ceil(breaker / c.ampacity);
  return { cable: c, runs, drop: +dropFor(c, runs).toFixed(2) };
}

export const motors: MotorRow[] = EQUIPMENT_REGISTER.filter((e) => e.power_kW > 0).map((e) => {
  const volts = e.power_kW > 200 ? MV_VOLTAGE : LV_VOLTAGE;
  const flc = (e.power_kW * 1000) / (Math.sqrt(3) * volts * MOTOR_EFFICIENCY * MOTOR_PF);
  const breaker = Math.ceil((flc * 1.25) / 5) * 5;
  const areaIndex = Number(e.area) || 0;
  const route_m = 40 + Math.round(areaIndex / 2) * 5;
  const feeder = feederFor(breaker, flc, route_m, volts);
  return {
    tag: e.tag,
    description: e.description,
    area: e.area,
    zone: e.zone,
    kw: e.power_kW,
    qty: e.qty,
    volts,
    starter: starterFor(e.power_kW, e.description),
    flc: +flc.toFixed(1),
    breaker,
    cable: feeder.runs > 1 ? `${feeder.runs} × (${feeder.cable.size})` : feeder.cable.size,
    runs: feeder.runs,
    cable_ampacity: feeder.cable.ampacity,
    cable_mm2: feeder.cable.mm2,
    cable_od: feeder.cable.od,
    drop_pct: feeder.drop,
    route_m,
    optional: OPTIONAL_TAGS.has(e.tag),
    exRating: e.exRating,
    makeBuy: e.makeBuy,
  };
});

export const motorSummary = (() => {
  const base = motors.filter((m) => !m.optional);
  const optional = motors.filter((m) => m.optional);
  const installed_kW = motors.reduce((a, m) => a + m.kw * m.qty, 0);
  const base_kW = base.reduce((a, m) => a + m.kw * m.qty, 0);
  const optional_kW = optional.reduce((a, m) => a + m.kw * m.qty, 0);
  const lv = motors.filter((m) => m.volts === LV_VOLTAGE);
  const mv = motors.filter((m) => m.volts === MV_VOLTAGE);
  const largest = [...base].sort((a, b) => b.kw - a.kw)[0];
  const cable_m = motors.reduce((a, m) => a + m.route_m * m.qty, 0);
  return {
    count: motors.reduce((a, m) => a + m.qty, 0),
    installed_kW: +installed_kW.toFixed(0),
    /** Connected rating of the continuously energised base, Option 3 and standby excluded. */
    base_kW: +base_kW.toFixed(0),
    /** Option 3 ZLD train — carried outside the base transformer demand. */
    optional_kW: +optional_kW.toFixed(0),
    optionalCount: optional.reduce((a, m) => a + m.qty, 0),
    lvCount: lv.reduce((a, m) => a + m.qty, 0),
    mvCount: mv.reduce((a, m) => a + m.qty, 0),
    lv_kW: +lv.reduce((a, m) => a + m.kw * m.qty, 0).toFixed(0),
    mv_kW: +mv.reduce((a, m) => a + m.kw * m.qty, 0).toFixed(0),
    largest_tag: largest.tag,
    largest_kW: largest.kw,
    cable_m: cable_m,
    vfd: motors.filter((m) => m.starter === "VFD").reduce((a, m) => a + m.qty, 0),
    dol: motors.filter((m) => m.starter === "DOL").reduce((a, m) => a + m.qty, 0),
    starDelta: motors.filter((m) => m.starter === "Star-delta").reduce((a, m) => a + m.qty, 0),
  };
})();

/**
 * Demand, transformer loading and energy.
 *
 * The transformer is sized on the duty load list (one pump running, one standby)
 * with the EL-BOD-0001 §5.3 diversity of 0.85 — not on the connected motor
 * rating, which would oversize it by the standby units alone. The register motor
 * count is reported beside it so the two bases are never confused: connected
 * kW is what the cables and the MCC carry, demand kW is what the transformer
 * feeds. TR-9901 is the rating the mechanical load list selects, so both pages
 * state one number.
 */
export const powerSummary = (() => {
  const demand_kW = loadSummary.demand;
  const demand_kVA = demand_kW / 0.9;
  const transformer_kVA = loadSummary.transformer_kVA * 1000;
  const loading = (demand_kVA / transformer_kVA) * 100;
  const lv_current = (loadSummary.lvLoad * 1000) / (Math.sqrt(3) * LV_VOLTAGE * 0.9);
  return {
    demand_kW: +demand_kW.toFixed(0),
    demand_kVA: +demand_kVA.toFixed(0),
    transformer_kVA: Math.round(transformer_kVA),
    transformer_MVA: +(transformer_kVA / 1000).toFixed(1),
    loading_pct: +loading.toFixed(1),
    lv_current_A: +lv_current.toFixed(0),
    /** Annual energy at 8,000 h/yr on the duty load — the figure the opex model uses. */
    annual_MWh: +((loadSummary.running * 8000) / 1000).toFixed(0),
    /** The ZLD train would need its own transformer if Option 3 is chosen. */
    zld_kW: motorSummary.optional_kW,
  };
})();

/**
 * Cable tray on the main LV route — selected, not assumed.
 *
 * The tray carries the LV feeders only: the 3.3 kV MV feeders run on their own
 * route at a greater clearance (EL-BOD-0001 §10.29), so mixing them would double
 * count the cross-section. Width comes from the bundle area at the 40 % fill of
 * IEC 60364-5-52 §B.52.9, rounded up to a standard ladder width.
 */
export const TRAY_WIDTHS = [150, 300, 450, 600, 750, 900];

export const trayFill = (() => {
  const lv = motors.filter((m) => m.volts === LV_VOLTAGE);
  const cableArea = lv.reduce((a, m) => {
    const area = Math.PI * (m.cable_od / 2) ** 2 * 0.75; // stranded bundle packing ≈ 75 %
    return a + area * m.qty * m.runs;
  }, 0);
  const trayDepth = 100;
  const requiredWidth = cableArea / (trayDepth * 0.4);
  const trayWidth = TRAY_WIDTHS.find((w) => w >= requiredWidth) ?? TRAY_WIDTHS[TRAY_WIDTHS.length - 1];
  const fill = (cableArea / (trayWidth * trayDepth)) * 100;
  return {
    cableArea_mm2: +cableArea.toFixed(0),
    requiredWidth_mm: +requiredWidth.toFixed(0),
    trayWidth_mm: trayWidth,
    trayDepth_mm: trayDepth,
    /** Section the code allows to be filled, mm² — for the note in the sheet. */
    usable_mm2: +(trayWidth * trayDepth * 0.4).toFixed(0),
    fill_pct: +fill.toFixed(1),
    lv_feeders: lv.reduce((a, m) => a + m.qty, 0),
    tray: `${trayWidth} × ${trayDepth} mm ladder, hot-dip galvanised`,
  };
})();

export interface PanelRow {
  tag: string;
  description: string;
  rating: string;
  code: string;
  location: string;
  ways?: number;
  spareWays?: number;
  note: string;
}

export const panels: PanelRow[] = [
  { tag: "SW-9901", description: "MV switchgear, incoming + 4 feeders", rating: "11 kV, 31.5 kA 3 s", code: "IEC 62271-200", location: "Electrical room", ways: 6, spareWays: 2, note: "Vacuum circuit breakers, numerical protection relays." },
  { tag: "TR-9901", description: "MV/LV transformer", rating: `11/0.415 kV, ${powerSummary.transformer_kVA.toLocaleString("en-US")} kVA ONAN`, code: "IEC 60076", location: "Transformer bay", note: `Oil-filled, conservator, Buchholz and OTI/WTI protection. Loading ${powerSummary.loading_pct} % at the design demand.` },
  { tag: "MCC-9901", description: "LV motor control centre", rating: "415 V, 80 kA 1 s", code: "IEC 61439-1/2", location: "Electrical room", ways: motors.length + 4, spareWays: 4, note: "Form 4b, withdrawable buckets; VFDs in separate compartments." },
  { tag: "PCC-9901", description: "Power distribution centre", rating: "415 V, 2,500 A", code: "IEC 61439-1/2", location: "Electrical room", ways: 12, spareWays: 3, note: "Feeds MCC, UPS, lighting and small power." },
  { tag: "UPS-9901", description: "UPS for control and instrument loads", rating: "30 kVA, 30 min autonomy", code: "IEC 62040-1", location: "Control room", note: "Double conversion; battery room ventilated per IEC 62485-2." },
  { tag: "JB-9901/9902", description: "Field junction boxes, areas 30/40 and 70/80", rating: "Ex e IIC T6, IP66", code: "IEC 60079-7", location: "Field", note: "Marshalling for transmitters and valve positioners." },
  { tag: "LP-9901/9902", description: "High-mast lighting poles", rating: "2 × 12 m, 6 × 250 W LED", code: "IEC 60598-2-5", location: "Plot perimeter", note: "Average 30 lux maintained over the plot; photocell + timer control." },
  { tag: "EB-9901", description: "Earthing grid and bonding", rating: "95 mm² Cu bare, 25 mm² bonds", code: "IEC 62305 / IEC 60364-5-54", location: "Whole plot", note: "Target ≤ 1 Ω to remote earth; test pits at four corners." },
];

/** Lightning protection radius at 6 m (tank roof) — IEC 62305-3 rolling sphere, LPL III (R = 45 m). */
export const lightningProtection = (() => {
  const towerHeight = 22;
  const sphereRadius = 45;
  const h = towerHeight - 6; // tower tip above the protected surface
  const radius = Math.sqrt(Math.max(2 * sphereRadius * h - h * h, 0));
  return {
    towerHeight,
    sphereRadius,
    radiusAt6m: +radius.toFixed(1),
    towers: 1,
    note: "LA-9901 is a dedicated 22 m mast, not a tank-mounted air terminal (EL-BOD-0001 §10.26).",
  };
})();

/** Feeder schedule with the volt drop already calculated for the selected cable. */
export const feeders = motors.map((m) => ({
  tag: m.tag,
  cable: m.cable,
  runs: m.runs,
  mm2: m.cable_mm2,
  breaker: m.breaker,
  route_m: m.route_m,
  flc: m.flc,
  drop_pct: m.drop_pct,
}));

/** Worst feeder in the package — the one the E-01 sheet checks. */
export const worstFeeder = [...feeders].sort((a, b) => b.drop_pct - a.drop_pct)[0];

/** Largest feeder by breaker rating — the one the ampacity check uses. */
export const biggestFeeder = [...motors].sort((a, b) => b.breaker - a.breaker)[0];
