/**
 * Instrument index for the B047 WWT package — IC-BOD-0001 Rev-1.
 *
 * The index is the I/O basis for the package control system (PCS-9901). Each
 * instrument carries its hazardous-area certification, signal type and I/O
 * class, so the I/O count, the marshalling cabinet size and the spare capacity
 * check are all derived rather than asserted.
 */

import type { Zone } from "@/lib/plantLayout";

export type IOType = "AI" | "AO" | "DI" | "DO" | "Pulse";
export type InstrumentType =
  | "Magnetic flowmeter"
  | "Vortex flowmeter"
  | "Coriolis flowmeter"
  | "Ultrasonic level"
  | "Radar level"
  | "Hydrostatic level"
  | "Pressure transmitter"
  | "Differential pressure"
  | "Temperature (RTD)"
  | "pH analyser"
  | "Conductivity analyser"
  | "Dissolved oxygen"
  | "ORP analyser"
  | "Turbidity analyser"
  | "Oil-in-water analyser"
  | "Gas detector (LEL)"
  | "Gas detector (H2S)"
  | "Vibration monitor"
  | "Positioner / limit switch"
  | "Local gauge";

export interface Instrument {
  tag: string;
  service: string;
  type: InstrumentType;
  area: string;
  zone: Zone;
  /** Hazardous-area certification from IC-BOD-0001 §4 / EL-BOD-0001 §9. */
  exRating: string;
  signal: string;
  io: IOType;
  sil: "SIL 2" | "SIL 1" | "—";
  qty: number;
  /** Governing AVL vendor, or the recommendation where none is listed. */
  vendor: string;
  /** Every field instrument is bought out — RAMSIS supplies the mounting only. */
  makeBuy?: "BUY";
  note?: string;
}

export const instruments: Instrument[] = [
  { tag: "FT-2001", service: "Equalised effluent flow", type: "Magnetic flowmeter", area: "20", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 2", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "LT-2001A/B", service: "Equalisation tank level", type: "Radar level", area: "20", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 2", qty: 2, vendor: "Emerson / Rosemount" },
  { tag: "PT-2001", service: "Feed pump discharge pressure", type: "Pressure transmitter", area: "20", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 2, vendor: "Yokogawa" },
  { tag: "LS-2001", service: "Equalisation high-high level trip", type: "Ultrasonic level", area: "20", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "SPDT relay", io: "DI", sil: "SIL 2", qty: 2, vendor: "Endress+Hauser (recommended)" },
  { tag: "TT-2002", service: "Equalisation temperature", type: "Temperature (RTD)", area: "20", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AI", sil: "—", qty: 1, vendor: "Emerson / Rosemount" },
  { tag: "FT-3001", service: "API separator inlet flow", type: "Magnetic flowmeter", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 2", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "PDT-3001", service: "API separator coalescing pack ΔP", type: "Differential pressure", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Yokogawa" },
  { tag: "LIT-3002", service: "API separator oil-layer interface", type: "Hydrostatic level", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 1", qty: 2, vendor: "Emerson / Rosemount" },
  { tag: "AT-3003", service: "Oil-in-water on separator outlet", type: "Oil-in-water analyser", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 2", qty: 1, vendor: "Turner Designs (recommended)", note: "No governing AVL listing for OiW analysers; recommendation only." },
  { tag: "FT-3004", service: "DAF recycle flow", type: "Coriolis flowmeter", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Micro Motion" },
  { tag: "LT-3005", service: "DAF tank level", type: "Ultrasonic level", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "TT-3006/3007", service: "Lube oil HX inlet / outlet temperature", type: "Temperature (RTD)", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AI", sil: "—", qty: 2, vendor: "Emerson / Rosemount" },
  { tag: "TT-3008/3009", service: "Cooling water HX inlet / outlet temperature", type: "Temperature (RTD)", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AI", sil: "—", qty: 2, vendor: "Emerson / Rosemount" },
  { tag: "GD-3001/3002", service: "Hydrocarbon gas detection — separator area", type: "Gas detector (LEL)", area: "30", zone: "Zone 0", exRating: "Ex d IIC T6", signal: "4–20 mA", io: "AI", sil: "SIL 2", qty: 2, vendor: "Honeywell / Dräger" },
  { tag: "GD-3003", service: "H2S detection — separator area", type: "Gas detector (H2S)", area: "30", zone: "Zone 0", exRating: "Ex d IIC T6", signal: "4–20 mA", io: "AI", sil: "SIL 2", qty: 1, vendor: "Honeywell / Dräger" },
  { tag: "FT-4001", service: "Aeration air flow", type: "Vortex flowmeter", area: "40", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "DO-4002/4003", service: "Dissolved oxygen — aeration basin", type: "Dissolved oxygen", area: "40", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 1", qty: 2, vendor: "Hach" },
  { tag: "AT-4004", service: "Mixed liquor pH", type: "pH analyser", area: "40", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "AT-4005", service: "Mixed liquor ORP", type: "ORP analyser", area: "40", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "LT-4006", service: "Aeration basin level", type: "Ultrasonic level", area: "40", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "TT-4007", service: "Mixed liquor temperature", type: "Temperature (RTD)", area: "40", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AI", sil: "—", qty: 1, vendor: "Emerson / Rosemount" },
  { tag: "FT-5001", service: "Clarifier feed flow", type: "Magnetic flowmeter", area: "50", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "LT-5002", service: "Clarifier sludge blanket", type: "Ultrasonic level", area: "50", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 1", qty: 2, vendor: "Endress+Hauser (recommended)" },
  { tag: "TT-5003", service: "Clarifier effluent turbidity", type: "Turbidity analyser", area: "50", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Hach" },
  { tag: "PDT-6001", service: "Multimedia filter ΔP", type: "Differential pressure", area: "60", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 4, vendor: "Yokogawa" },
  { tag: "FT-6002", service: "Filtered water flow", type: "Magnetic flowmeter", area: "60", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "LT-6003", service: "GAC adsorber level", type: "Radar level", area: "60", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 2, vendor: "Emerson / Rosemount" },
  { tag: "AT-6004", service: "GAC outlet phenol / UV254", type: "Turbidity analyser", area: "60", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Hach", note: "UV254 analyser not on the AVL; recommendation." },
  { tag: "FT-7001", service: "UF permeate flow", type: "Magnetic flowmeter", area: "70", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "PDT-7002", service: "UF transmembrane pressure", type: "Differential pressure", area: "70", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 2, vendor: "Yokogawa" },
  { tag: "FT-7003", service: "RO feed flow", type: "Magnetic flowmeter", area: "70", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "CT-7004", service: "RO permeate conductivity", type: "Conductivity analyser", area: "70", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 2, vendor: "Endress+Hauser (recommended)" },
  { tag: "PT-7005", service: "RO high-pressure pump discharge", type: "Pressure transmitter", area: "70", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 2", qty: 2, vendor: "Yokogawa" },
  { tag: "LT-8001", service: "Sludge thickener level", type: "Radar level", area: "80", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Emerson / Rosemount" },
  { tag: "FT-8002", service: "Sludge transfer flow", type: "Magnetic flowmeter", area: "80", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Endress+Hauser (recommended)" },
  { tag: "VT-8003/8004", service: "Centrifuge vibration", type: "Vibration monitor", area: "80", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AI", sil: "—", qty: 2, vendor: "SKF / Bently Nevada" },
  { tag: "AT-9001", service: "Neutralisation pH", type: "pH analyser", area: "10", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "SIL 2", qty: 2, vendor: "Endress+Hauser (recommended)" },
  { tag: "LT-9002/9003", service: "Caustic / acid tank level", type: "Radar level", area: "10", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 2, vendor: "Emerson / Rosemount" },
  { tag: "FT-9004/9005", service: "Caustic / acid dosing flow", type: "Magnetic flowmeter", area: "10", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 2, vendor: "Endress+Hauser (recommended)" },
  { tag: "PT-9901", service: "Instrument air header pressure", type: "Pressure transmitter", area: "99", zone: "Unclassified", exRating: "Ex nA IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Yokogawa" },
  { tag: "PDT-9902", service: "Instrument air dew point / filter ΔP", type: "Differential pressure", area: "99", zone: "Unclassified", exRating: "Ex nA IIC T4", signal: "4–20 mA HART", io: "AI", sil: "—", qty: 1, vendor: "Yokogawa" },
  { tag: "ZS-2001A/B", service: "Feed pump running / fault status", type: "Positioner / limit switch", area: "20", zone: "Zone 0", exRating: "Ex d IIC T6", signal: "24 V DC dry contact", io: "DI", sil: "—", qty: 4, vendor: "ABB / Schneider" },
  { tag: "ZS-4001", service: "Aeration blower status and surge switch", type: "Positioner / limit switch", area: "40", zone: "Zone 2", exRating: "Ex d IIC T6", signal: "24 V DC dry contact", io: "DI", sil: "—", qty: 2, vendor: "ABB / Schneider" },
  { tag: "FY-3001", service: "Control valve position feedback", type: "Positioner / limit switch", area: "30", zone: "Zone 0", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AO", sil: "—", qty: 3, vendor: "Emerson / Fisher" },
  { tag: "FY-7001", service: "RO HP pump speed reference", type: "Positioner / limit switch", area: "70", zone: "Zone 2", exRating: "Ex ia IIC T4", signal: "4–20 mA", io: "AO", sil: "—", qty: 1, vendor: "ABB / Schneider" },
  { tag: "PG-9901..9912", service: "Local pressure gauges", type: "Local gauge", area: "99", zone: "Unclassified", exRating: "—", signal: "Local indication", io: "DI", sil: "—", qty: 12, vendor: "WIKA / Ashcroft", note: "Local only, not wired to the PCS — counted for procurement, excluded from I/O." },
];

/** Local gauges are excluded from the I/O count; everything else is wired. */
const wired = instruments.filter((i) => i.type !== "Local gauge");

export const ioSummary = (() => {
  const count = (io: IOType) => wired.filter((i) => i.io === io).reduce((a, i) => a + i.qty, 0);
  const AI = count("AI");
  const AO = count("AO");
  const DI = count("DI");
  const DO = count("DO");
  const total = AI + AO + DI + DO;
  // PCS-9901 is quoted at 1,100 I/O with 20 % spare (IC-BOD-0001 §7.2).
  const capacity = 1100;
  const spare = capacity - total;
  return {
    AI,
    AO,
    DI,
    DO,
    total,
    capacity,
    spare,
    spare_pct: +((spare / capacity) * 100).toFixed(1),
    wiredQty: wired.reduce((a, i) => a + i.qty, 0),
    localQty: instruments.filter((i) => i.type === "Local gauge").reduce((a, i) => a + i.qty, 0),
    sil2: instruments.filter((i) => i.sil === "SIL 2").reduce((a, i) => a + i.qty, 0),
    exRated: instruments.filter((i) => i.exRating.startsWith("Ex")).reduce((a, i) => a + i.qty, 0),
  };
})();

export const instrumentsByArea = (() => {
  const areas = [...new Set(instruments.map((i) => i.area))].sort();
  return areas.map((area) => {
    const rows = instruments.filter((i) => i.area === area);
    return {
      area,
      tags: rows.length,
      qty: rows.reduce((a, i) => a + i.qty, 0),
      io: rows.reduce((a, i) => a + (i.type === "Local gauge" ? 0 : i.qty), 0),
    };
  });
})();

/** I/O type mix per analyser / transmitter family, for the marshalling schedule. */
export const instrumentsByType = (() => {
  const types = [...new Set(instruments.map((i) => i.type))];
  return types
    .map((type) => {
      const rows = instruments.filter((i) => i.type === type);
      return { type, tags: rows.length, qty: rows.reduce((a, i) => a + i.qty, 0) };
    })
    .sort((a, b) => b.qty - a.qty);
})();
