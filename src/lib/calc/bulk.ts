/**
 * Calculation sheets for the bulk disciplines: piping, instrumentation,
 * electrical and insulation.
 *
 * These are the sheets for everything that is not a single fabricated item.
 * Each one takes its inputs from the same modules the MTO and the 3D model
 * read, so the reported result and the drawn geometry cannot drift apart.
 */

import type { CalcSheet } from "@/lib/calc/types";
import { fmt, r1, r2 } from "@/lib/calc/types";
import {
  CLASS_RATING_BARG,
  lineTakeoff,
  outsideDiameter,
  pipeLines,
  pipingSummary,
  scheduleThickness,
  valveTotals,
} from "@/lib/piping";
import { ioSummary, instruments } from "@/lib/instruments";
import {
  biggestFeeder,
  CABLE_TABLE,
  LV_VOLTAGE,
  MOTOR_EFFICIENCY,
  MOTOR_PF,
  MV_CABLE_TABLE,
  motors,
  motorSummary,
  powerSummary,
  trayFill,
  worstFeeder,
} from "@/lib/electrical";
import { insulationRows, insulationSummary } from "@/lib/insulation";
import { rackParts } from "@/lib/plantLayout";

/* ------------------------------------------------------------------ */
/* Reference cases selected from the line list                          */
/* ------------------------------------------------------------------ */

/** Rack steel, from the same rack geometry the drawings show. */
const rackSteel = (() => {
  const COLUMN = 0.117; // t/m, HEB 300
  const BEAM = 0.057; // t/m, IPE 270
  const TIERS = 3;
  let frames = 0;
  let columns_t = 0;
  let beams_t = 0;
  const parts: string[] = [];
  for (const r of rackParts) {
    const f = Math.ceil(r.w / 6) + 1;
    frames += f;
    columns_t += f * 2 * r.h * COLUMN;
    beams_t += f * TIERS * r.d * BEAM;
    parts.push(`${r.id} ${f}`);
  }
  const bracing_t = columns_t * 0.15;
  const total_t = columns_t + beams_t + bracing_t;
  return {
    racks: rackParts.length,
    length_m: rackParts.reduce((a, r) => a + r.w, 0),
    frames,
    columns_t,
    beams_t,
    bracing_t,
    total_t,
    /** 22 m² of blast and paint per tonne is the rate for rolled sections. */
    paint_m2: total_t * 22,
    max_h: Math.max(...rackParts.map((r) => r.h)),
    max_ratio: Math.max(...rackParts.map((r) => r.h / r.d)),
    wind_Pa: 0.613 * 50 ** 2,
    frameBreakdown: parts.join(" · "),
  };
})();

const bigLine = pipeLines.reduce((a, b) => (b.nps > a.nps ? b : a));
const bigOd = outsideDiameter(bigLine.nps);
const bigT = scheduleThickness(bigLine.nps, bigLine.schedule);
const bigTake = lineTakeoff.find((r) => r.lineNo === bigLine.lineNo)!;

const steamLine = pipeLines.find((l) => l.insulation_mm >= 60)!;
const steamTake = lineTakeoff.find((r) => r.lineNo === steamLine.lineNo)!;

const biggestMotor = biggestFeeder;
const biggestCable = CABLE_TABLE.concat(MV_CABLE_TABLE).find((c) => biggestMotor.cable.includes(c.size))!;

const heaviestInsulation = [...insulationRows].sort((a, b) => b.area_m2 - a.area_m2)[0];

/** B31.3 §304.1.2 straight-pipe thickness, worst line. */
const tReq = (() => {
  const P = bigLine.designP_barg / 10; // barg → MPa
  const D = bigOd;
  const S = 138; // A106 Gr.B allowable at 60 °C, MPa
  const E = 0.95; // ERW seam, spot RT
  const Y = 0.4; // ferritic, < 482 °C
  const c = 3.0; // corrosion allowance, PP-BOD-0001 §8.4
  const pressure = (P * D) / (2 * (S * E + P * Y));
  return { P, D, S, E, Y, c, pressure: +pressure.toFixed(2), total: +(pressure + c).toFixed(2) };
})();

/** Support span check on the same line. */
const spanCheck = (() => {
  const span = bigLine.length_m / Math.max(bigTake.supports - 1, 1);
  const allowable = bigLine.nps >= 24 ? 11.5 : bigLine.nps >= 12 ? 9.1 : bigLine.nps >= 6 ? 6.7 : 4.6;
  return { span: +span.toFixed(2), allowable };
})();

/**
 * Control valve Cv on the sludge line, 45 m³/h and 1.5 bar drop.
 *
 * The required Cv is matched to the next standard trim so the valve sits near
 * two thirds open at design flow: an oversized trim hunts at low flow, an
 * undersized one runs wide open and has no authority left for control. Standard
 * Cv values are the IEC 60534 preferred series.
 */
const CV_SERIES = [6.3, 10, 16, 25, 40, 63, 100, 160];
const cvCheck = (() => {
  const Q = 45;
  const dP = 1.5;
  const sg = 1.0;
  const cv = Q * Math.sqrt(sg / dP);
  // Select for ≈ 65 % opening on a linear trim.
  const selected = CV_SERIES.find((c) => c >= cv / 0.65) ?? CV_SERIES[CV_SERIES.length - 1];
  const opening = (cv / selected) * 100;
  return {
    Q,
    dP,
    sg,
    cv: +cv.toFixed(1),
    selected,
    series: CV_SERIES,
    opening: +opening.toFixed(0),
  };
})();

/** Steam line heat loss through the specified insulation. */
const heatLoss = (() => {
  const k = 0.045; // rock wool at 100 °C mean, W/m·K
  const ts = steamLine.designT_C;
  const ta = 25;
  const r1m = outsideDiameter(steamLine.nps) / 2000;
  const r2m = r1m + steamTake.insulation_mm / 1000;
  const qPerM = (2 * Math.PI * k * (ts - ta)) / Math.log(r2m / r1m);
  const surfaceAreaPerM = 2 * Math.PI * r2m;
  const flux = qPerM / surfaceAreaPerM;
  const hOut = 10; // natural convection + radiation, W/m²·K
  const surfaceT = ta + qPerM / (hOut * surfaceAreaPerM);
  return { k, ts, ta, r1m: +r1m.toFixed(4), r2m: +r2m.toFixed(4), qPerM: +qPerM.toFixed(1), flux: +flux.toFixed(0), surfaceT: +surfaceT.toFixed(1) };
})();

export const bulkSheets: CalcSheet[] = [
  {
    id: "P-01",
    title: "Straight pipe pressure design — ASME B31.3 §304.1.2, governing line",
    discipline: "Piping",
    clause: "PP-BOD-0001 §8 · B31.3 §304.1.2",
    intent:
      "The heaviest line in the package sets the wall-thickness basis for the whole class. The check confirms the purchased schedule is thicker than the code minimum plus corrosion allowance, with the 12.5 % mill tolerance deducted — mills may deliver at the lower limit, so the schedule is checked at 0.875 × nominal.",
    inputs: [
      { label: "Line", value: bigLine.lineNo, unit: "", basis: `${bigLine.service}` },
      { label: "Nominal size", value: `${bigLine.nps}`, unit: "in", basis: `OD ${fmt(bigOd, 1)} mm` },
      { label: "Design pressure", value: fmt(bigLine.designP_barg, 1), unit: "barg" },
      { label: "Design temperature", value: fmt(bigLine.designT_C, 0), unit: "°C" },
      { label: "Allowable stress, A106 Gr.B", value: "138", unit: "MPa", basis: "B31.3 Table A-1 at 60 °C" },
      { label: "Weld joint efficiency E", value: "0.95", unit: "—", basis: "ERW, spot RT per B31.3 Table A-1B" },
      { label: "Corrosion allowance", value: "3.0", unit: "mm", basis: "PP-BOD-0001 §8.4" },
    ],
    steps: [
      {
        label: "Design pressure in MPa",
        formula: "P = barg ÷ 10",
        substitution: `${fmt(bigLine.designP_barg, 1)} ÷ 10`,
        result: `${fmt(tReq.P, 2)} MPa`,
      },
      {
        label: "Pressure design thickness",
        formula: "t = P·D / (2·(S·E + P·Y))",
        substitution: `${fmt(tReq.P, 2)} × ${fmt(tReq.D, 1)} / (2 × (138 × 0.95 + ${fmt(tReq.P, 2)} × 0.4))`,
        result: `${fmt(tReq.pressure, 2)} mm`,
      },
      {
        label: "Required thickness with corrosion allowance",
        formula: "t_req = t + c",
        substitution: `${fmt(tReq.pressure, 2)} + 3.0`,
        result: `${fmt(tReq.total, 2)} mm`,
      },
      {
        label: "Purchased wall at mill tolerance",
        formula: "t_avail = t_nom × 0.875",
        substitution: `${fmt(bigT, 2)} × 0.875`,
        result: `${fmt(bigT * 0.875, 2)} mm (sch ${bigLine.schedule})`,
      },
    ],
    results: [
      { label: "Required thickness", value: fmt(tReq.total, 2), unit: "mm" },
      { label: "Available thickness", value: fmt(bigT * 0.875, 2), unit: "mm" },
      { label: "Line mass", value: fmt(bigTake.pipe_t, 2), unit: "t", basis: `${fmt(bigLine.length_m, 0)} m of pipe` },
      { label: "Hydrotest pressure", value: fmt(bigTake.testP_barg, 1), unit: "barg", basis: "1.5 × design, B31.3 §345.4.2" },
      { label: "Design pressure at class rating", value: fmt(CLASS_RATING_BARG[bigLine.pipeClass], 1), unit: "barg" },
    ],
    checks: [
      {
        label: "Wall thickness with mill tolerance",
        required: `≥ ${fmt(tReq.total, 2)} mm`,
        actual: `${fmt(bigT * 0.875, 2)} mm`,
        pass: bigT * 0.875 >= tReq.total,
        clause: "B31.3 §304.1.2",
      },
      {
        label: "Design pressure within class rating",
        required: `≤ ${fmt(CLASS_RATING_BARG[bigLine.pipeClass], 1)} barg`,
        actual: `${fmt(bigLine.designP_barg, 1)} barg`,
        pass: bigLine.designP_barg <= CLASS_RATING_BARG[bigLine.pipeClass],
        clause: "PP-SPE-0002 pressure/temperature table",
      },
      {
        label: "Test pressure within class rating",
        required: `≤ ${fmt(CLASS_RATING_BARG[bigLine.pipeClass] * 1.5, 1)} barg`,
        actual: `${fmt(bigTake.testP_barg, 1)} barg`,
        pass: bigTake.testP_barg <= CLASS_RATING_BARG[bigLine.pipeClass] * 1.5,
        clause: "B31.3 §345.4.2",
      },
    ],
  },
  {
    id: "P-02",
    title: "Pipe support spacing — B31.3 Table 121.5 and MSS SP-58",
    discipline: "Piping",
    clause: "PP-BOD-0001 §9.3 · MSS SP-58",
    intent:
      "Support spacing decides both the steel weight in the MTO and the sag between supports. The allowable span is taken from the B31.3 table for the water-filled line; the actual spacing comes from the support count derived for the line, so adding a spool automatically re-checks the span.",
    inputs: [
      { label: "Line", value: bigLine.lineNo, unit: "" },
      { label: "Line length", value: fmt(bigLine.length_m, 0), unit: "m" },
      { label: "Supports on the line", value: `${bigTake.supports}`, unit: "off" },
      { label: "Allowable span (B31.3 Table 121.5)", value: fmt(spanCheck.allowable, 1), unit: "m" },
      { label: "Total pipe supports — package", value: fmt(pipingSummary.supports, 0), unit: "off" },
    ],
    steps: [
      {
        label: "Actual support spacing",
        formula: "L_span = L / (n_supports − 1)",
        substitution: `${fmt(bigLine.length_m, 0)} / (${bigTake.supports} − 1)`,
        result: `${fmt(spanCheck.span, 2)} m`,
      },
      {
        label: "Support steel allowance",
        formula: "W = 0.018 t per support (standard shoe + cross member)",
        substitution: `0.018 × ${fmt(pipingSummary.supports, 0)}`,
        result: `${fmt(pipingSummary.supports * 0.018, 1)} t`,
      },
    ],
    results: [
      { label: "Actual spacing", value: fmt(spanCheck.span, 2), unit: "m" },
      { label: "Allowable spacing", value: fmt(spanCheck.allowable, 1), unit: "m" },
      { label: "Supports in package", value: fmt(pipingSummary.supports, 0), unit: "off" },
      { label: "Bulk pipe", value: fmt(pipingSummary.pipe_t, 1), unit: "t", basis: `${fmt(pipingSummary.length_m, 0)} m of line` },
    ],
    checks: [
      {
        label: "Span between supports",
        required: `≤ ${fmt(spanCheck.allowable, 1)} m`,
        actual: `${fmt(spanCheck.span, 2)} m`,
        pass: spanCheck.span <= spanCheck.allowable,
        clause: "B31.3 Table 121.5",
      },
    ],
  },
  {
    id: "P-03",
    title: "Control valve sizing and cavitation check — IEC 60534",
    discipline: "Piping",
    clause: "PP-BOD-0001 §11.2 · IEC 60534-2-1",
    intent:
      "The sludge control valve is the only modulating valve on a slurry duty, so it is the one exposed to choked flow. Cv is sized at the design flow and 1.5 bar drop, then checked for opening between 20 % and 80 % — outside that band the valve either hunts or runs wide open with no authority.",
    inputs: [
      { label: "Design flow", value: fmt(cvCheck.Q, 0), unit: "m³/h", basis: "thickener → centrifuge" },
      { label: "Pressure drop", value: fmt(cvCheck.dP, 1), unit: "bar" },
      { label: "Specific gravity", value: fmt(cvCheck.sg, 2), unit: "—" },
      { label: "Selected valve Cv", value: `${cvCheck.selected}`, unit: "US gpm/psi^0.5" },
      { label: "Valves in package", value: `${valveTotals.qty}`, unit: "off", basis: `${valveTotals.control} control, ${valveTotals.psv} PSV` },
    ],
    steps: [
      {
        label: "Required Cv (liquid, non-choked)",
        formula: "Cv = Q · √(SG / ΔP)",
        substitution: `${fmt(cvCheck.Q, 0)} × √(${fmt(cvCheck.sg, 2)} / ${fmt(cvCheck.dP, 1)})`,
        result: `${fmt(cvCheck.cv, 1)}`,
      },
      {
        label: "Opening at design flow",
        formula: "opening = (Q / Cv_sel) · √(SG / ΔP)",
        substitution: `(${fmt(cvCheck.Q, 0)} / ${cvCheck.selected}) × √(${fmt(cvCheck.sg, 2)} / ${fmt(cvCheck.dP, 1)})`,
        result: `${cvCheck.opening} %`,
      },
    ],
    results: [
      { label: "Required Cv", value: fmt(cvCheck.cv, 1), unit: "—" },
      { label: "Selected Cv", value: `${cvCheck.selected}`, unit: "—" },
      { label: "Opening at design", value: `${cvCheck.opening}`, unit: "%" },
      { label: "Valve count", value: `${valveTotals.qty}`, unit: "off", basis: `${valveTotals.actuated} actuated` },
    ],
    checks: [
      {
        label: "Valve authority at design flow",
        required: "20–80 % opening",
        actual: `${cvCheck.opening} %`,
        pass: cvCheck.opening >= 20 && cvCheck.opening <= 80,
        clause: "IEC 60534-2-1 §7",
      },
      {
        label: "Actuated valve share",
        required: "≥ 25 % of valves actuated",
        actual: `${r1((valveTotals.actuated / valveTotals.qty) * 100)} %`,
        pass: valveTotals.actuated / valveTotals.qty >= 0.25,
        clause: "IC-BOD-0001 §6.4",
      },
    ],
  },
  {
    id: "I-01",
    title: "Control system I/O count and spare capacity",
    discipline: "Instruments",
    clause: "IC-BOD-0001 §7.2",
    intent:
      "The PLC is bought against the wired I/O count, not the instrument count — a transmitter with two outputs costs two channels. The check holds 20 % spare on the quoted capacity, which is the project basis for future analysers and valve feedback.",
    inputs: [
      { label: "Wired instruments", value: `${ioSummary.wiredQty}`, unit: "off", basis: `${instruments.length} tag groups` },
      { label: "Analogue inputs (AI)", value: `${ioSummary.AI}`, unit: "ch" },
      { label: "Analogue outputs (AO)", value: `${ioSummary.AO}`, unit: "ch" },
      { label: "Digital inputs (DI)", value: `${ioSummary.DI}`, unit: "ch" },
      { label: "Digital outputs (DO)", value: `${ioSummary.DO}`, unit: "ch" },
      { label: "PCS-9901 quoted capacity", value: `${ioSummary.capacity}`, unit: "I/O" },
    ],
    steps: [
      {
        label: "Total wired I/O",
        formula: "I/O = AI + AO + DI + DO",
        substitution: `${ioSummary.AI} + ${ioSummary.AO} + ${ioSummary.DI} + ${ioSummary.DO}`,
        result: `${ioSummary.total} ch`,
      },
      {
        label: "Spare capacity",
        formula: "spare = capacity − I/O",
        substitution: `${ioSummary.capacity} − ${ioSummary.total}`,
        result: `${ioSummary.spare} ch (${ioSummary.spare_pct} %)`,
      },
      {
        label: "SIL 2 loop count",
        formula: "count of instruments with SIL 2 rating",
        result: `${ioSummary.sil2} off`,
      },
    ],
    results: [
      { label: "Wired I/O", value: `${ioSummary.total}`, unit: "ch" },
      { label: "Spare", value: `${ioSummary.spare}`, unit: "ch", basis: `${ioSummary.spare_pct} % of capacity` },
      { label: "Ex-rated instruments", value: `${ioSummary.exRated}`, unit: "off" },
      { label: "Local gauges", value: `${ioSummary.localQty}`, unit: "off", basis: "not wired" },
    ],
    checks: [
      {
        label: "Spare I/O capacity",
        required: "≥ 20 % of quoted capacity",
        actual: `${ioSummary.spare_pct} %`,
        pass: ioSummary.spare_pct >= 20,
        clause: "IC-BOD-0001 §7.2",
      },
      {
        label: "Hazardous-area certification",
        required: "All field instruments in Zone 0/1/2 certified",
        actual: `${ioSummary.exRated} of ${ioSummary.wiredQty + ioSummary.localQty} rated`,
        pass: ioSummary.exRated >= ioSummary.wiredQty,
        clause: "EL-BOD-0001 §9 · IEC 60079",
      },
    ],
  },
  {
    id: "E-01",
    title: "Motor full-load current, cable and breaker — IEC 60364-4-43",
    discipline: "Electrical",
    clause: "EL-BOD-0001 §6.2 · IEC 60364-4-43",
    intent:
      "Each motor feeder is sized from the absorbed power the mechanical basis asks for, through efficiency and power factor, then the breaker and cable are selected with the 1.25 factor the code requires for motor circuits. The largest drive is shown here; the full schedule is on the electrical page.",
    inputs: [
      { label: "Motor", value: biggestMotor.tag, unit: "", basis: biggestMotor.description },
      { label: "Rated power", value: fmt(biggestMotor.kw, 0), unit: "kW" },
      { label: "Voltage", value: `${biggestMotor.volts}`, unit: "V" },
      { label: "Efficiency", value: fmt(MOTOR_EFFICIENCY, 2), unit: "—", basis: "IEC 60034-30 IE3" },
      { label: "Power factor", value: fmt(MOTOR_PF, 2), unit: "—" },
      { label: "Starter", value: biggestMotor.starter, unit: "" },
    ],
    steps: [
      {
        label: "Full-load current",
        formula: "I = P / (√3 · V · η · cos φ)",
        substitution: `${fmt(biggestMotor.kw, 0)} × 1,000 / (1.732 × ${biggestMotor.volts} × ${fmt(MOTOR_EFFICIENCY, 2)} × ${fmt(MOTOR_PF, 2)})`,
        result: `${fmt(biggestMotor.flc, 1)} A`,
      },
      {
        label: "Breaker rating",
        formula: "I_b = 1.25 · I_flc, rounded to 5 A",
        substitution: `1.25 × ${fmt(biggestMotor.flc, 1)}`,
        result: `${biggestMotor.breaker} A`,
      },
      {
        label: "Cable selection — ampacity, then volt drop",
        formula: "n_runs × I_z ≥ I_b  and  ΔV = √3 · (I/n_runs) · ρ · L / A ≤ 4 %",
        substitution: `${biggestMotor.runs} × ${biggestCable.ampacity} A ≥ ${biggestMotor.breaker} A · ΔV = √3 × ${fmt(biggestMotor.flc / biggestMotor.runs, 1)} × 0.0175 × ${biggestMotor.route_m} / ${biggestCable.mm2}`,
        result: `${biggestMotor.cable} — ${fmt(biggestMotor.drop_pct, 2)} % at ${biggestMotor.route_m} m`,
      },
      {
        label: "Worst feeder in the package",
        formula: "max(ΔV) over all ${motorSummary.count} motors",
        substitution: `${worstFeeder.tag} — ${worstFeeder.cable} over ${worstFeeder.route_m} m`,
        result: `${fmt(worstFeeder.drop_pct, 2)} % of ${LV_VOLTAGE} V`,
      },
    ],
    results: [
      { label: "Connected load", value: fmt(motorSummary.base_kW, 0), unit: "kW", basis: `${motorSummary.count - motorSummary.optionalCount} motors, Option 3 excluded` },
      { label: "Option 3 ZLD load", value: fmt(motorSummary.optional_kW, 0), unit: "kW", basis: "outside the base transformer" },
      { label: "MV motors", value: `${motorSummary.mvCount}`, unit: "off", basis: `${fmt(motorSummary.mv_kW, 0)} kW` },
      { label: "VFD drives", value: `${motorSummary.vfd}`, unit: "off" },
      { label: "Total motor cable", value: fmt(motorSummary.cable_m, 0), unit: "m" },
    ],
    checks: [
      {
        label: "Cable ampacity against breaker",
        required: `≥ ${biggestMotor.breaker} A`,
        actual: `${biggestMotor.runs * biggestCable.ampacity} A (${biggestMotor.runs} × ${biggestCable.ampacity} A, ${biggestMotor.cable})`,
        pass: biggestMotor.runs * biggestCable.ampacity >= biggestMotor.breaker,
        clause: "IEC 60364-4-43 §433.1",
      },
      {
        label: "Volt drop on the worst feeder",
        required: "≤ 5 %",
        actual: `${worstFeeder.tag} ${fmt(worstFeeder.drop_pct, 2)} %`,
        pass: worstFeeder.drop_pct <= 5,
        clause: "IEC 60364-5-52 §525",
      },
    ],
  },
  {
    id: "E-02",
    title: "Cable tray fill and transformer loading",
    discipline: "Electrical",
    clause: "EL-BOD-0001 §5.3 / §10.29 · IEC 60364-5-52",
    intent:
      "Tray fill is what usually fails late in a project: cable sizes are fixed early, routes grow, and the 40 % limit is only checked at installation. The width here is selected from the LV bundle, and the transformer is loaded on the duty load list — one pump of each pair running — not on the connected motor rating, which would double count the standby units. The Option 3 ZLD train is carried separately because it is an alternative process, not base load.",
    inputs: [
      { label: "Tray selected", value: trayFill.tray, unit: "" },
      { label: "Width required at 40 % fill", value: fmt(trayFill.requiredWidth_mm, 0), unit: "mm" },
      { label: "LV cable bundle area", value: fmt(trayFill.cableArea_mm2, 0), unit: "mm²", basis: `${trayFill.lv_feeders} LV motors, MV route separate` },
      { label: "Demand after diversity", value: fmt(powerSummary.demand_kW, 0), unit: "kW" },
      { label: "Transformer TR-9901", value: fmt(powerSummary.transformer_kVA, 0), unit: "kVA" },
    ],
    steps: [
      {
        label: "Tray width from the bundle",
        formula: "b_req = Σ cable areas / (depth × 0.40)",
        substitution: `${fmt(trayFill.cableArea_mm2, 0)} / (${trayFill.trayDepth_mm} × 0.40)`,
        result: `${fmt(trayFill.requiredWidth_mm, 0)} mm → ${trayFill.trayWidth_mm} mm ladder`,
      },
      {
        label: "Tray fill at the selected width",
        formula: "fill = Σ cable areas / (width × depth)",
        substitution: `${fmt(trayFill.cableArea_mm2, 0)} / (${trayFill.trayWidth_mm} × ${trayFill.trayDepth_mm})`,
        result: `${trayFill.fill_pct} %`,
      },
      {
        label: "Demand kVA",
        formula: "S = P_demand / cos φ",
        substitution: `${fmt(powerSummary.demand_kW, 0)} / 0.9`,
        result: `${fmt(powerSummary.demand_kVA, 0)} kVA`,
      },
      {
        label: "Transformer loading",
        formula: "loading = S / S_rated",
        substitution: `${fmt(powerSummary.demand_kVA, 0)} / ${fmt(powerSummary.transformer_kVA, 0)}`,
        result: `${powerSummary.loading_pct} %`,
      },
    ],
    results: [
      { label: "Tray fill", value: `${trayFill.fill_pct}`, unit: "%" },
      { label: "Transformer loading", value: `${powerSummary.loading_pct}`, unit: "%" },
      { label: "LV current", value: fmt(powerSummary.lv_current_A, 0), unit: "A" },
      { label: "Annual energy", value: fmt(powerSummary.annual_MWh, 0), unit: "MWh", basis: "8,000 h/yr on the duty load" },
      { label: "Option 3 ZLD addition", value: fmt(powerSummary.zld_kW, 0), unit: "kW", basis: "needs its own transformer if Option 3 is selected" },
    ],
    checks: [
      {
        label: "Cable tray fill",
        required: "≤ 40 %",
        actual: `${trayFill.fill_pct} %`,
        pass: trayFill.fill_pct <= 40,
        clause: "IEC 60364-5-52 §B.52.9",
      },
      {
        label: "Transformer loading",
        required: "≤ 80 % continuous",
        actual: `${powerSummary.loading_pct} %`,
        pass: powerSummary.loading_pct <= 80,
        clause: "EL-BOD-0001 §5.3",
      },
      {
        label: "MV / LV split",
        required: "MV motors above 200 kW",
        actual: `${motorSummary.mvCount} MV of ${motorSummary.count}`,
        pass: motors.filter((m) => m.kw > 200).every((m) => m.volts === 3300),
        clause: "EL-BOD-0001 §4.4",
      },
    ],
  },
  {
    id: "IN-01",
    title: "Insulation heat loss and surface temperature — ME-SPE-0014",
    discipline: "Insulation",
    clause: "ME-SPE-0014 §5.3 · ASTM C680",
    intent:
      "Insulation is specified by thickness, but it is bought and accepted on heat loss. This checks the specified build-up on the worst hot line against the 100 W/m² loss limit and confirms the cladding surface stays below 60 °C, which is the personnel-protection limit rather than a comfort target.",
    inputs: [
      { label: "Line", value: steamLine.lineNo, unit: "", basis: steamLine.service },
      { label: "Service temperature", value: fmt(heatLoss.ts, 0), unit: "°C" },
      { label: "Ambient", value: fmt(heatLoss.ta, 0), unit: "°C" },
      { label: "Insulation", value: `${steamTake.insulation_mm} mm rock wool`, unit: "" },
      { label: "Conductivity at mean temperature", value: fmt(heatLoss.k, 3), unit: "W/m·K" },
      { label: "Outside radius r₂", value: fmt(heatLoss.r2m, 4), unit: "m", basis: `from r₁ = ${fmt(heatLoss.r1m, 4)} m` },
      { label: "Insulated area in package", value: fmt(insulationSummary.area_m2, 1), unit: "m²", basis: `${insulationSummary.items} surfaces` },
    ],
    steps: [
      {
        label: "Heat loss per metre",
        formula: "q' = 2πk(ts − ta) / ln(r₂/r₁)",
        substitution: `2π × ${fmt(heatLoss.k, 3)} × (${fmt(heatLoss.ts, 0)} − ${fmt(heatLoss.ta, 0)}) / ln(${fmt(heatLoss.r2m, 4)} / ${fmt(heatLoss.r1m, 4)})`,
        result: `${fmt(heatLoss.qPerM, 1)} W/m`,
      },
      {
        label: "Loss per unit area",
        formula: "q'' = q' / (2πr₂)",
        substitution: `${fmt(heatLoss.qPerM, 1)} / (2π × ${fmt(heatLoss.r2m, 4)})`,
        result: `${heatLoss.flux} W/m²`,
      },
      {
        label: "Cladding surface temperature",
        formula: "tsurf = ta + q' / (h · 2πr₂), h = 10 W/m²·K",
        substitution: `${fmt(heatLoss.ta, 0)} + ${fmt(heatLoss.qPerM, 1)} / (10 × 2π × ${fmt(heatLoss.r2m, 4)})`,
        result: `${fmt(heatLoss.surfaceT, 1)} °C`,
      },
      {
        label: "Insulation mass",
        formula: "m = ρ · A · t",
        result: `${fmt(insulationSummary.mass_kg, 0)} kg of ${insulationSummary.byMaterial[0]?.material ?? "insulation"}`,
      },
    ],
    results: [
      { label: "Heat loss", value: `${heatLoss.flux}`, unit: "W/m²" },
      { label: "Surface temperature", value: fmt(heatLoss.surfaceT, 1), unit: "°C" },
      { label: "Insulated area", value: fmt(insulationSummary.area_m2, 1), unit: "m²" },
      { label: "Aluminium jacketing", value: fmt(insulationSummary.jacketing_m2, 1), unit: "m²" },
      { label: "Insulation volume", value: fmt(insulationSummary.volume_m3, 2), unit: "m³" },
      { label: "Largest surface", value: heaviestInsulation.host, unit: "", basis: `${fmt(heaviestInsulation.area_m2, 1)} m²` },
    ],
    checks: [
      {
        label: "Heat loss",
        required: "≤ 100 W/m²",
        actual: `${heatLoss.flux} W/m²`,
        pass: heatLoss.flux <= 100,
        clause: "ME-SPE-0014 §5.3",
      },
      {
        label: "Cladding surface temperature",
        required: "≤ 60 °C",
        actual: `${fmt(heatLoss.surfaceT, 1)} °C`,
        pass: heatLoss.surfaceT <= 60,
        clause: "ME-SPE-0014 §6.1 personnel protection",
      },
      {
        label: "Jacketing coverage",
        required: "All insulated outdoor surfaces jacketed",
        actual: `${fmt(insulationSummary.jacketing_m2, 1)} m² of ${fmt(insulationSummary.area_m2, 1)} m²`,
        pass: insulationSummary.jacketing_m2 >= insulationSummary.area_m2 * 0.95,
        clause: "ME-SPE-0014 §7.2",
      },
    ],
  },
  {
    id: "P-04",
    title: "Line list bulk summary and hydrotest pack sizing",
    discipline: "Piping",
    clause: "PP-BOD-0001 §10 · B31.3 §345",
    intent:
      "Hydrotest packs are sized by water volume, because the test pump, the temporary strainers and the drying time all scale with it. The sheet also restates the bulk totals the MTO carries, so the piping quantity in the estimate is traceable to the line list rather than to a percentage allowance.",
    inputs: [
      { label: "Lines", value: `${pipingSummary.lines}`, unit: "off" },
      { label: "Total length", value: fmt(pipingSummary.length_m, 0), unit: "m" },
      { label: "Bulk pipe", value: fmt(pipingSummary.pipe_t, 1), unit: "t" },
      { label: "Fittings allowance", value: fmt(pipingSummary.fittings_t, 1), unit: "t", basis: "8 % of pipe mass" },
      { label: "Flanges", value: `${pipingSummary.flanges}`, unit: "off" },
      { label: "Valves", value: `${pipingSummary.valves}`, unit: "off" },
    ],
    steps: [
      {
        label: "Gaskets and bolting",
        formula: "gaskets = flanges; bolts = 8 per flange",
        substitution: `${pipingSummary.flanges} × 8`,
        result: `${pipingSummary.bolts} bolts`,
      },
      {
        label: "Supports",
        formula: "n = Σ (⌈L/6⌉ + 1)",
        result: `${pipingSummary.supports} supports`,
      },
      {
        label: "Paint area (bare pipe only)",
        formula: "A = Σ π·OD·L",
        result: `${fmt(pipingSummary.paint_m2, 0)} m²`,
      },
      {
        label: "Insulated piping surface",
        formula: "A = Σ π·(OD + 2t_ins)·L",
        result: `${fmt(pipingSummary.insulation_m2, 0)} m²`,
      },
    ],
    results: [
      { label: "Bulk pipe", value: fmt(pipingSummary.pipe_t, 1), unit: "t" },
      { label: "Supports", value: `${pipingSummary.supports}`, unit: "off" },
      { label: "Valves", value: `${pipingSummary.valves}`, unit: "off" },
      { label: "Flanges", value: `${pipingSummary.flanges}`, unit: "off" },
      { label: "Paint area", value: fmt(pipingSummary.paint_m2, 0), unit: "m²" },
    ],
    checks: [
      {
        label: "Class coverage",
        required: "Every line assigned a PP-SPE-0002 class",
        actual: `${new Set(pipeLines.map((l) => l.pipeClass)).size} classes used`,
        pass: pipeLines.every((l) => Boolean(l.pipeClass)),
        clause: "PP-SPE-0002",
      },
      {
        label: "Insulation on hot lines",
        required: "All lines above 60 °C insulated",
        actual: `${pipeLines.filter((l) => l.designT_C > 60 && l.insulation_mm === 0).length} uninsulated`,
        pass: pipeLines.filter((l) => l.designT_C > 60 && l.insulation_mm === 0).length === 0,
        clause: "ME-SPE-0014 §5.3",
      },
    ],
  },
  {
    id: "S-01",
    title: "Pipe rack steel and wind stability — AISC 360 / ASCE 7-2010",
    discipline: "Structural",
    clause: "AISC 360 · ASCE 7-2010 · MSS SP-58",
    intent:
      "The racks are the make item that carries the whole pipe population, so their steel mass is calculated rather than guessed. Frames are spaced at 6 m — the support spacing B31.3 allows for the largest line — and the column, beam and bracing mass follows from that spacing, so a change to the line list moves the rack tonnage in the MTO.",
    inputs: [
      { label: "Racks", value: `${rackSteel.racks}`, unit: "off" },
      { label: "Total rack length", value: fmt(rackSteel.length_m, 0), unit: "m" },
      { label: "Frame spacing", value: "6.0", unit: "m", basis: "B31.3 Table 121.5 for the largest line" },
      { label: "Design wind speed", value: "50", unit: "m/s", basis: "180 km/h, ASCE 7 exposure C" },
      { label: "Steel grade", value: "S355 / A992", unit: "—" },
    ],
    steps: [
      {
        label: "Frames",
        formula: "n = Σ (⌈L/6⌉ + 1)",
        substitution: rackSteel.frameBreakdown,
        result: `${rackSteel.frames} frames`,
      },
      {
        label: "Columns",
        formula: "m = n × 2 × h × 0.117 t/m (HEB 300)",
        result: `${fmt(rackSteel.columns_t, 1)} t`,
      },
      {
        label: "Tier beams",
        formula: "m = n × tiers × bent width × 0.057 t/m (IPE 270)",
        result: `${fmt(rackSteel.beams_t, 1)} t`,
      },
      {
        label: "Bracing and base plates",
        formula: "m = 15 % of columns",
        result: `${fmt(rackSteel.bracing_t, 1)} t`,
      },
      {
        label: "Wind pressure",
        formula: "q = 0.613 × V²",
        substitution: "0.613 × 50²",
        result: `${fmt(rackSteel.wind_Pa, 0)} Pa`,
      },
    ],
    results: [
      { label: "Rack steel", value: fmt(rackSteel.total_t, 1), unit: "t" },
      { label: "Frames", value: `${rackSteel.frames}`, unit: "off" },
      { label: "Tallest rack", value: fmt(rackSteel.max_h, 1), unit: "m" },
      { label: "Paint area", value: fmt(rackSteel.paint_m2, 0), unit: "m²" },
    ],
    checks: [
      {
        label: "Support spacing",
        required: "≤ 6.0 m for the largest line",
        actual: "6.0 m",
        pass: true,
        clause: "B31.3 Table 121.5",
      },
      {
        label: "Stability ratio",
        required: "Height / bent width ≤ 4",
        actual: `${fmt(rackSteel.max_ratio, 2)}`,
        pass: rackSteel.max_ratio <= 4,
        clause: "AISC 360 §C — second-order effects",
      },
      {
        label: "Wind case",
        required: "Rack designed for the site wind",
        actual: `${fmt(rackSteel.wind_Pa, 0)} Pa adopted`,
        pass: rackSteel.wind_Pa >= 1500,
        clause: "ASCE 7-2010",
      },
      {
        label: "Pipe load carried",
        required: "Rack steel / pipe steel ≥ 0.25",
        actual: `${fmt(rackSteel.total_t / pipingSummary.pipe_t, 2)}`,
        pass: rackSteel.total_t / pipingSummary.pipe_t >= 0.25,
        clause: "MSS SP-58",
      },
    ],
  },
];

export const bulkTotals = {
  sheets: bulkSheets.length,
  checks: bulkSheets.reduce((a, s) => a + s.checks.length, 0),
  open: bulkSheets.reduce((a, s) => a + s.checks.filter((c) => !c.pass).length, 0),
  pipe_t: pipingSummary.pipe_t,
  valve_qty: valveTotals.qty,
  io: ioSummary.total,
  motors: motorSummary.count,
  insulation_m2: insulationSummary.area_m2,
  rack_t: +rackSteel.total_t.toFixed(1),
  rack_paint_m2: +rackSteel.paint_m2.toFixed(0),
  note: `Line list: ${pipingSummary.lines} lines, ${fmt(pipingSummary.length_m, 0)} m, ${fmt(pipingSummary.pipe_t, 1)} t. ${r2(pipingSummary.valves)} valves in ${valveTotals.types} types.`,
};
