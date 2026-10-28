/**
 * Equipment register. Every item is derived from the calculation results, so
 * a change in the process sheet propagates into the register, the MTO and the
 * estimate rather than living as an unconnected spreadsheet.
 */
import { process as P } from "@/lib/calc/process";
import { loadSummary } from "@/lib/calc/mechanical";

export type MakeBuy = "MAKE" | "BUY";
export type Zone = "Zone 0" | "Zone 1" | "Zone 2" | "Unclassified";

export interface EquipmentItem {
  tag: string;
  area: string;
  description: string;
  type: string;
  qty: number;
  duty: string;
  moc: string;
  code: string;
  zone: Zone;
  exRating: string;
  power_kW: number;
  weight_t: number;
  cost_usd: number;
  makeBuy: MakeBuy;
  rationale: string;
  avl: "Governing" | "Non-governing" | "Not listed";
  vendor: string;
  leadWeeks: number;
}

export const areas = [
  { code: "10", name: "Chemical drain neutralisation" },
  { code: "20", name: "Equalisation & feed" },
  { code: "30", name: "Oil removal (API / CPI / DAF)" },
  { code: "40", name: "Biological treatment" },
  { code: "50", name: "Clarification" },
  { code: "60", name: "Tertiary filtration" },
  { code: "70", name: "Ultrafiltration & reverse osmosis" },
  { code: "80", name: "Sludge handling" },
  { code: "90", name: "Chemical dosing" },
  { code: "95", name: "Zero liquid discharge (Option 3)" },
  { code: "99", name: "Utilities, electrical & instrumentation" },
];

const EX0 = "Ex ia IIC T3 Ga / Cat. 1G";
const EX1 = "Ex d IIB T3 Gb / Cat. 2G";
const EX2 = "Ex ec IIB T3 Gc / Cat. 3G";
const SAFE = "Safe area, IP55";

export const equipment: EquipmentItem[] = [
  /* ---------------- Area 10 ---------------- */
  {
    tag: "V-1001A/B", area: "10", description: "Chemical drain neutralisation tank", type: "Vertical tank, agitator mounted",
    qty: P.neutralisation.tanks, duty: `${P.neutralisation.tankVolume} m³ each, 45 min HRT`, moc: "SA-240 316L, 8 mm",
    code: "ASME VIII Div.1, U-stamp", zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 9.5, cost_usd: 210000,
    makeBuy: "MAKE", rationale: "Simple atmospheric 316L tank with a proprietary agitator bolted on. Within RAMSIS plate-rolling and TIG capability; no proprietary internals.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 22,
  },
  {
    tag: "AG-1001A/B", area: "10", description: "Neutralisation tank agitator", type: "Pitched blade turbine, gear drive",
    qty: 2, duty: "7.5 kW absorbed, 90 rpm, 1.2 m impeller", moc: "316L wetted, CS pedestal",
    code: "API 671 coupling", zone: "Zone 2", exRating: EX2, power_kW: 7.5, weight_t: 0.9, cost_usd: 18000,
    makeBuy: "BUY", rationale: "Gearbox, mechanical seal and impeller hydraulics are proprietary. RAMSIS has no agitator test bed and no performance guarantee route.",
    avl: "Non-governing", vendor: "Neptune Mixers / Sulzer", leadWeeks: 26,
  },
  {
    tag: "T-9002", area: "10", description: "Caustic storage tank (45 % NaOH)", type: "Vertical atmospheric tank",
    qty: 1, duty: "32 m³, 5 days storage", moc: "CS + rubber lining", code: "API 650",
    zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 4.2, cost_usd: 68000, makeBuy: "MAKE",
    rationale: "Plain API 650 shell with a bought-in lining. RAMSIS routinely fabricates and lines caustic tanks.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 18,
  },
  {
    tag: "T-9003", area: "10", description: "Sulphuric acid storage tank (98 %)", type: "Vertical atmospheric tank",
    qty: 1, duty: "32 m³, 5 days storage", moc: "CS, acid-resistant lining", code: "API 650",
    zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 4.0, cost_usd: 72000, makeBuy: "MAKE",
    rationale: "Same fabrication route as T-9002. Only the lining specification changes.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 18,
  },
  {
    tag: "DP-1001/1002", area: "10", description: "Caustic / acid dosing pumps", type: "API 675 diaphragm, capacity controlled",
    qty: 4, duty: "0–60 kg/h each, 0–100 % stroke", moc: "PTFE / PVDF wetted", code: "API 675",
    zone: "Zone 2", exRating: EX2, power_kW: 1.5, weight_t: 0.2, cost_usd: 22000, makeBuy: "BUY",
    rationale: "Governing vendor item — must be bought from Milton Roy / Sera / LMI per the approved vendor list.",
    avl: "Governing", vendor: "Milton Roy", leadWeeks: 24,
  },
  {
    tag: "V-1010", area: "10", description: "H₂S odour control scrubber", type: "Packed tower, caustic/hypochlorite",
    qty: 1, duty: "2,500 m³/h air, 40 kg/h H₂S peak", moc: "PP/FRP shell, PP packing",
    code: "Project spec", zone: "Zone 2", exRating: EX2, power_kW: 15, weight_t: 3.5, cost_usd: 185000,
    makeBuy: "MAKE", rationale: "FRP/PP vessel with bought-in fan and pump. RAMSIS fabricates FRP; the packing and internals are bought.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 20,
  },

  /* ---------------- Area 20 ---------------- */
  {
    tag: "T-2001A/B", area: "20", description: "Equalisation tank", type: "API 650 vertical, cone roof",
    qty: 2, duty: `Ø ${P.equalisation.diameter_m} m × ${P.equalisation.height_m.toFixed(1)} m, 2,200 m³ each`,
    moc: "ASTM A516 Gr.70, 8 mm shell", code: "API 650",
    zone: "Zone 0", exRating: EX0, power_kW: 0, weight_t: 118, cost_usd: 335000, makeBuy: "MAKE",
    rationale: "The largest single make item: 236 t of plate between the two tanks, well inside RAMSIS rolling capacity (40 mm) and site-erected. No proprietary internals except the mixers.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 30,
  },
  {
    tag: "AG-2001A/B", area: "20", description: "Equalisation tank mixer", type: "Submersible, Ex-rated",
    qty: 2, duty: "22 kW, 22 rpm equivalent thrust", moc: "Duplex 2205 propeller",
    code: "API 650 / API 12 series", zone: "Zone 0", exRating: EX0, power_kW: 22, weight_t: 0.6, cost_usd: 45000,
    makeBuy: "BUY", rationale: "Zone 0 submersible mixer with an Ex ia motor is a specialist purchase. No Bahraini fabrication route for the motor or the gearbox.",
    avl: "Non-governing", vendor: "Sulzer / Xylem", leadWeeks: 24,
  },
  {
    tag: "P-2001A/B", area: "20", description: "Equalised feed pump", type: "API 610 OH2, single stage",
    qty: 2, duty: "550 m³/h @ 22 m, 45 kW", moc: "API 610 Annex H, C6 (CS + 12 % Cr trim)",
    code: "API 610 / API 682", zone: "Zone 2", exRating: EX2, power_kW: 45, weight_t: 0.9, cost_usd: 85000,
    makeBuy: "BUY", rationale: "API 610 pumps are governed by the vendor list and need a performance test bed. RAMSIS does not manufacture rotating equipment.",
    avl: "Governing", vendor: "Flowserve / Sulzer", leadWeeks: 32,
  },
  {
    tag: "P-2002A/B", area: "20", description: "DAF recycle / pressurisation pump", type: "API 610 OH2, 55 kW",
    qty: 2, duty: `${P.oilRemoval.dafRecycle_m3h} m³/h @ 65 m`, moc: "API 610 Annex H, C6",
    code: "API 610 / API 682", zone: "Zone 2", exRating: EX2, power_kW: 55, weight_t: 1.0, cost_usd: 96000,
    makeBuy: "BUY", rationale: "Governing vendor item, and the saturator duty needs a tested NPSH performance curve.",
    avl: "Governing", vendor: "Flowserve / OBL", leadWeeks: 32,
  },

  /* ---------------- Area 30 ---------------- */
  {
    tag: "B-3001A/B", area: "30", description: "API separator basin with chain scraper", type: "Horizontal steel basin, 2 trains",
    qty: 2, duty: `${P.oilRemoval.length_m} × ${P.oilRemoval.width_m} × ${P.oilRemoval.depth_m} m each`,
    moc: "ASTM A36 + epoxy lining", code: "API 421",
    zone: "Zone 0", exRating: EX0, power_kW: 4, weight_t: 86, cost_usd: 310000, makeBuy: "MAKE",
    rationale: "Large welded CS basin: RAMSIS fabricates the shell, baffles, weirs and cover; the scraper chain and flight mechanism is bought in and installed at the works.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 28,
  },
  {
    tag: "SC-3001A/B", area: "30", description: "Separator scraper drive", type: "Chain and flight, motor driven",
    qty: 2, duty: "4 kW, intermittent duty", moc: "CS chain, SS flights", code: "API 421",
    zone: "Zone 0", exRating: EX0, power_kW: 4, weight_t: 2.4, cost_usd: 42000, makeBuy: "BUY",
    rationale: "Proprietary scraper mechanism with an Ex-rated gearmotor; bought as a complete assembly and mounted on the RAMSIS basin.",
    avl: "Not listed", vendor: "Huber / Sülzle Klein", leadWeeks: 26,
  },
  {
    tag: "CPI-3001A/B", area: "30", description: "Corrugated plate interceptor", type: "Inclined plate pack in steel basin",
    qty: 2, duty: `${P.oilRemoval.cpiPlates} plates each, 5 m³/m²·h`, moc: "PP plates, CS frame",
    code: "API 421", zone: "Zone 0", exRating: EX0, power_kW: 0, weight_t: 6.5, cost_usd: 95000,
    makeBuy: "BUY", rationale: "Plate geometry and spacing are proprietary and the oil-removal guarantee sits on them. Basin fabricated by RAMSIS, plate pack bought.",
    avl: "Not listed", vendor: "Huber / Sülzle Klein", leadWeeks: 24,
  },
  {
    tag: "DAF-3001A/B", area: "30", description: "Dissolved air flotation unit", type: "Rectangular DAF with recycle saturation",
    qty: P.oilRemoval.dafUnits, duty: `${(P.oilRemoval.dafArea_m2 / 2).toFixed(0)} m² each, ${P.oilRemoval.dafRecycle_m3h} m³/h recycle`,
    moc: "CS epoxy lined, 316L internals", code: "Project spec",
    zone: "Zone 0", exRating: EX0, power_kW: 18.5, weight_t: 22, cost_usd: 340000, makeBuy: "MAKE",
    rationale: "Shell, float chamber, baffles and scraper bridge are fabricated by RAMSIS. The air saturation skid, recycle pump and compressor are bought and integrated at the works.",
    avl: "Not listed", vendor: "RAMSIS (basin) + Huber (air system)", leadWeeks: 30,
  },
  {
    tag: "SK-3001", area: "30", description: "DAF air saturation skid", type: "Pressure vessel + compressor + release valves",
    qty: 2, duty: "5.5 atm saturator, 18.5 kW compressor", moc: "316L vessel, CS skid",
    code: "ASME VIII Div.1", zone: "Zone 0", exRating: EX0, power_kW: 18.5, weight_t: 3.2, cost_usd: 88000,
    makeBuy: "BUY", rationale: "Proprietary white-water release system; the dissolved-air guarantee depends on the vendor's nozzle design.",
    avl: "Not listed", vendor: "Huber / Evoqua", leadWeeks: 26,
  },

  /* ---------------- Area 40 ---------------- */
  {
    tag: "TK-4001A/B/C", area: "40", description: "Aeration tank (civil)", type: "Reinforced concrete basin",
    qty: 3, duty: "3,000 m³ each, 6 m side water depth", moc: "C40/50 concrete, HDPE liner option",
    code: "ACI 350", zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 0, cost_usd: 0,
    makeBuy: "BUY", rationale: "Civil structure — excluded from the RAMSIS mechanical make scope and carried in the civil estimate. Listed here so the register is complete.",
    avl: "Not listed", vendor: "Local civil subcontractor", leadWeeks: 36,
  },
  {
    tag: "BL-4001A/B/C", area: "40", description: "Aeration blower", type: "Rotary lobe, direct driven",
    qty: P.biological.blowers, duty: `${P.biological.blowerFlow_m3h.toFixed(0)} m³/h @ 65 kPa, ${P.biological.blowerPower_kW} kW`,
    moc: "Cast iron casing, SS impeller", code: "API 673",
    zone: "Zone 2", exRating: EX2, power_kW: P.biological.blowerPower_kW, weight_t: 2.8, cost_usd: 168000,
    makeBuy: "BUY", rationale: "Governing vendor item. Requires a factory performance test to API 673 and a noise guarantee of 85 dB(A) at 1 m.",
    avl: "Governing", vendor: "Boldrocchi / Ebara Hamada", leadWeeks: 34,
  },
  {
    tag: "DF-4001", area: "40", description: "Fine bubble diffuser grid", type: "EPDM membrane diffusers on SS grid",
    qty: 1, duty: "1,800 diffusers, 6 m submergence, 25 % SOTE", moc: "EPDM membrane, 316L saddle",
    code: "Project spec", zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 4.5, cost_usd: 96000,
    makeBuy: "BUY", rationale: "Membrane diffusers are a consumable with an oxygen-transfer warranty. Buying them from the aeration specialist keeps the SOTR guarantee enforceable.",
    avl: "Not listed", vendor: "Xylem (Sanitaire)", leadWeeks: 20,
  },
  {
    tag: "AG-4001A-D", area: "40", description: "Anoxic zone submersible mixer", type: "Ex-rated submersible",
    qty: 4, duty: "11 kW, 480 rpm propeller", moc: "Duplex 2205", code: "API 650 / API 12",
    zone: "Zone 2", exRating: EX2, power_kW: 11, weight_t: 0.45, cost_usd: 38000, makeBuy: "BUY",
    rationale: "Ex-rated submersible mixers are proprietary rotating equipment.",
    avl: "Not listed", vendor: "Sulzer / Xylem", leadWeeks: 24,
  },
  {
    tag: "P-4001A/B", area: "40", description: "Basin recirculation pump", type: "API 610 OH1, 37 kW",
    qty: 2, duty: "900 m³/h @ 12 m", moc: "API 610 Annex H, C6", code: "API 610 / API 682",
    zone: "Zone 2", exRating: EX2, power_kW: 37, weight_t: 0.8, cost_usd: 66000, makeBuy: "BUY",
    rationale: "Governing vendor item, API 610 performance test required.",
    avl: "Governing", vendor: "CPC / Goulds-Ruhr", leadWeeks: 30,
  },

  /* ---------------- Area 50 ---------------- */
  {
    tag: "CL-5001A/B", area: "50", description: "Final clarifier", type: "Circular, suction scraper, concrete",
    qty: 2, duty: `Ø ${P.clarifier.diameter_m} m, ${P.clarifier.area_m2 / 2} m² each`, moc: "Concrete basin, SS 316L mechanism",
    code: "ACI 350 / project spec", zone: "Zone 2", exRating: EX2, power_kW: 2.2, weight_t: 18, cost_usd: 420000,
    makeBuy: "BUY", rationale: "The basin is civil, but the scraper bridge, drive and weir are a proprietary mechanism. Bought as a clarifier package, civil works by the local subcontractor.",
    avl: "Not listed", vendor: "Huber / Veolia", leadWeeks: 32,
  },
  {
    tag: "P-5001A/B/C", area: "50", description: "RAS / WAS pump", type: "API 610 OH2, 30 kW",
    qty: 3, duty: `${P.clarifier.ras_m3h} m³/h @ 15 m`, moc: "API 610 Annex H, C6",
    code: "API 610 / API 682", zone: "Zone 2", exRating: EX2, power_kW: 30, weight_t: 0.8, cost_usd: 58000,
    makeBuy: "BUY", rationale: "Governing vendor item. Sludge duty needs an open impeller and a tested curve.",
    avl: "Governing", vendor: "Sulzer / Flowserve", leadWeeks: 30,
  },

  /* ---------------- Area 60 ---------------- */
  {
    tag: "V-6001A-D", area: "60", description: "Multimedia pressure filter", type: "Vertical pressure vessel",
    qty: P.filtration.units, duty: `Ø ${P.filtration.diameter_m} m, 10 m/h, ${P.filtration.rate_m_h} m/h actual`,
    moc: "SA-516 Gr.70 + 3 mm CA, internal epoxy", code: "ASME VIII Div.1, U-stamp",
    zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 14.5, cost_usd: 148000, makeBuy: "MAKE",
    rationale: "Textbook ASME VIII Div.1 shell with standard nozzles and a bought-in distribution header. Exactly the work RAMSIS is approved for; the filter media is bought separately.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 26,
  },
  {
    tag: "V-6010A/B", area: "60", description: "GAC adsorber", type: "Vertical pressure vessel, 3 m bed",
    qty: 2, duty: "Ø 4.5 m, 12 min EBCT", moc: "SA-516 Gr.70, rubber lined",
    code: "ASME VIII Div.1, U-stamp", zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 16, cost_usd: 215000,
    makeBuy: "MAKE", rationale: "Shell by RAMSIS (U-stamp), 60 t of activated carbon bought from a carbon supplier. Phenol polishing is the only route to the 0.05 mg/L limit.",
    avl: "Non-governing", vendor: "RAMSIS (shell) + Jacobi/Calgon (carbon)", leadWeeks: 28,
  },
  {
    tag: "P-6001A/B", area: "60", description: "Filter backwash pump", type: "API 610 OH2, 45 kW",
    qty: 2, duty: `${P.filtration.backwash_m3h} m³/h @ 32 m`, moc: "API 610 Annex H, C6",
    code: "API 610 / API 682", zone: "Zone 2", exRating: EX2, power_kW: 45, weight_t: 0.9, cost_usd: 72000,
    makeBuy: "BUY", rationale: "Governing vendor item.",
    avl: "Governing", vendor: "Flowserve / Sulzer", leadWeeks: 30,
  },

  /* ---------------- Area 70 ---------------- */
  {
    tag: "UF-7001A-D", area: "70", description: "Ultrafiltration skid", type: "PVDF outside-in, 4 skids",
    qty: P.membrane.ufSkids, duty: `${(P.membrane.ufArea_m2 / P.membrane.ufSkids).toFixed(0)} m² per skid, 55 L/m²·h`,
    moc: "PVDF membrane, PVC/SS housing", code: "Project spec",
    zone: "Zone 2", exRating: EX2, power_kW: 37, weight_t: 8, cost_usd: 345000, makeBuy: "BUY",
    rationale: "Membrane skids are proprietary: the flux guarantee, integrity test and module warranty all sit with the membrane vendor. No fabrication value can be added locally.",
    avl: "Not listed", vendor: "Toray / DuPont / Veolia", leadWeeks: 34,
  },
  {
    tag: "RO-7001A-F", area: "70", description: "Reverse osmosis rack", type: "2-stage, 6 racks",
    qty: P.membrane.roRacks, duty: `${(P.membrane.roElements / P.membrane.roRacks).toFixed(0)} elements per rack, 70 % recovery`,
    moc: "SS 316L HP piping, FRP pressure vessels", code: "Project spec",
    zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 12, cost_usd: 285000, makeBuy: "BUY",
    rationale: "RO racks carry the water-quality guarantee. Fabricating the frames locally would split the guarantee at the membrane/rack interface for no meaningful saving.",
    avl: "Not listed", vendor: "Veolia (SUEZ) / Toray", leadWeeks: 38,
  },
  {
    tag: "P-7001A/B", area: "70", description: "RO high pressure pump", type: "API 610 BB2 multistage, 500 kW",
    qty: 2, duty: `550 m³/h @ ${(P.membrane.roFeedPressure_bar * 10.2).toFixed(0)} m`,
    moc: "Duplex 2507 / super duplex", code: "API 610 / API 682",
    zone: "Zone 2", exRating: EX2, power_kW: Math.ceil(P.membrane.hpPump_kW / 10) * 10, weight_t: 3.4, cost_usd: 415000,
    makeBuy: "BUY", rationale: "MV-driven multistage pump with an energy-recovery interface — governing vendor item and a specialist rotating package.",
    avl: "Governing", vendor: "Flowserve / Sulzer", leadWeeks: 40,
  },
  {
    tag: "ER-7001", area: "70", description: "Energy recovery device", type: "Pressure exchanger",
    qty: 2, duty: "Recovers 35 % of HP pump energy", moc: "Duplex", code: "Project spec",
    zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 1.2, cost_usd: 185000, makeBuy: "BUY",
    rationale: "Proprietary isobaric device; saves about 1.1 MW at design flow and pays back in under three years.",
    avl: "Not listed", vendor: "Energy Recovery Inc / Danfoss", leadWeeks: 32,
  },
  {
    tag: "CIP-7001", area: "70", description: "Membrane cleaning-in-place skid", type: "Heated tank, pump, dosing",
    qty: 1, duty: "10 m³ tank, 40 m³/h", moc: "PP/316L", code: "Project spec",
    zone: "Zone 2", exRating: EX2, power_kW: 22, weight_t: 2.4, cost_usd: 148000, makeBuy: "MAKE",
    rationale: "Tank and skid frame fabricated by RAMSIS; heater, pump and instruments bought. No proprietary membrane interface.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 24,
  },

  /* ---------------- Area 80 ---------------- */
  {
    tag: "T-8001", area: "80", description: "Sludge thickening tank", type: "API 650 with picket fence thickener",
    qty: 1, duty: `${P.sludge.thickener_m3} m³, 18 h retention`, moc: "A516 Gr.70 + epoxy", code: "API 650",
    zone: "Zone 2", exRating: EX2, power_kW: 1.5, weight_t: 24, cost_usd: 185000, makeBuy: "MAKE",
    rationale: "Shell fabricated by RAMSIS, thickening mechanism bought. Continuous sludge duty needs a 6 mm shell plus 3 mm CA.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 24,
  },
  {
    tag: "CF-8001A/B", area: "80", description: "Decanter centrifuge", type: "3-phase, scroll discharge",
    qty: 2, duty: `${(P.sludge.total_dry_kgd / 24).toFixed(0)} kg DS/h each, 25 % cake`, moc: "Duplex 2205 bowl",
    code: "Project spec", zone: "Zone 2", exRating: EX2, power_kW: 55, weight_t: 5.2, cost_usd: 385000, makeBuy: "BUY",
    rationale: "High-speed rotating machine with a wear-protected bowl — no local manufacture route and a specialist service requirement.",
    avl: "Not listed", vendor: "Alfa Laval / Flottweg", leadWeeks: 34,
  },
  {
    tag: "P-8001A/B", area: "80", description: "Sludge transfer pump", type: "API 675 progressive cavity / hose pump",
    qty: 2, duty: "35 m³/h @ 25 m, 4 % DS", moc: "CS body, nitrile stator", code: "API 675",
    zone: "Zone 2", exRating: EX2, power_kW: 15, weight_t: 0.6, cost_usd: 46000, makeBuy: "BUY",
    rationale: "Positive displacement sludge pump — proprietary rotor/stator geometry.",
    avl: "Governing", vendor: "Milton Roy / Sera (per governing dosing list)", leadWeeks: 28,
  },
  {
    tag: "SK-8001", area: "80", description: "Polymer make-up and dosing skid", type: "3-compartment, automatic",
    qty: 2, duty: "1.65 kg/d polymer, 0.1 % solution", moc: "SS 316 frame, PP tanks", code: "Project spec",
    zone: "Zone 2", exRating: EX2, power_kW: 3, weight_t: 1.4, cost_usd: 68000, makeBuy: "MAKE",
    rationale: "Tanks and frame by RAMSIS, dosing pumps from the governing list, mixer bought.",
    avl: "Non-governing", vendor: "RAMSIS (skid) + Milton Roy (pumps)", leadWeeks: 20,
  },

  /* ---------------- Area 90 ---------------- */
  {
    tag: "SK-9001..9008", area: "90", description: "Chemical dosing skids (8 packages)", type: "Tank + pump + panel, packaged",
    qty: 8, duty: `Coagulant ${P.chemical.coagulant_kgd} kg/d, H₂O₂ ${P.chemical.h2o2_kgd} kg/d, antiscalant, biocide, nutrient, NaOCl`,
    moc: "PE/PP tanks on SS skids", code: "Project spec", zone: "Zone 2", exRating: EX2, power_kW: 7.5, weight_t: 1.1,
    cost_usd: 45000, makeBuy: "MAKE",
    rationale: "Eight small skids are the ideal make item: RAMSIS fabricates the frame and mounts bought-in dosing pumps, instruments and panels. Saves about 35 % against packaged purchase.",
    avl: "Non-governing", vendor: "RAMSIS (skid) + Milton Roy (pumps)", leadWeeks: 20,
  },

  /* ---------------- Area 95 (Option 3) ---------------- */
  {
    tag: "ZLD-9501", area: "95", description: "MVR brine concentrator", type: "Mechanical vapour recompression",
    qty: 1, duty: `${P.evaporation.reject_m3h} m³/h feed, ${P.zld.concentrator_kW} kW`, moc: "Duplex / Ti tubes, CS shell",
    code: "Project spec", zone: "Unclassified", exRating: SAFE, power_kW: P.zld.concentrator_kW, weight_t: 145,
    cost_usd: 5200000, makeBuy: "BUY", rationale: "Option 3 only. A thermal package with a performance guarantee — the largest single line item in the project and no fabrication content for RAMSIS beyond the externals.",
    avl: "Not listed", vendor: "Veolia HPD / GEA", leadWeeks: 56,
  },
  {
    tag: "ZLD-9502", area: "95", description: "Crystalliser and salt handling", type: "Forced circulation crystalliser",
    qty: 1, duty: `${P.zld.steam_t_h} t/h steam, ${P.zld.solids_t_d} t/d salt`, moc: "Duplex, rubber lined CS",
    code: "Project spec", zone: "Unclassified", exRating: SAFE, power_kW: P.zld.crystalliser_kW, weight_t: 95,
    cost_usd: 3400000, makeBuy: "BUY", rationale: "Option 3 only. Proprietary crystalliser with salt-handling conveyors and a solids-classification guarantee.",
    avl: "Not listed", vendor: "Veolia HPD / GEA", leadWeeks: 60,
  },

  /* ---------------- Area 99 ---------------- */
  {
    tag: "PCS-9901", area: "99", description: "Package control system (PLC + SCADA)", type: "Redundant PLC, 1,100 I/O",
    qty: 1, duty: `${loadSummary.running.toFixed(0)} kW of driven equipment`, moc: "—", code: "IEC 61131-3",
    zone: "Unclassified", exRating: SAFE, power_kW: 8, weight_t: 1.2, cost_usd: 790000, makeBuy: "BUY",
    rationale: "Platform software and warranty sit with the automation vendor. Panels can be assembled locally but the licence, firmware and support cannot.",
    avl: "Not listed", vendor: "Siemens / Schneider / ABB", leadWeeks: 32,
  },
  {
    tag: "MCC-9901", area: "99", description: "MV switchgear and LV MCC", type: "3.3 kV + 0.4 kV, 8 sections",
    qty: 1, duty: `${loadSummary.transformer_kVA.toFixed(0)} kVA transformer, ${loadSummary.mvLoad.toFixed(0)} kW MV`, moc: "—",
    code: "IEC 61439", zone: "Unclassified", exRating: SAFE, power_kW: 0, weight_t: 9, cost_usd: 730000, makeBuy: "BUY",
    rationale: "Governing vendor item and a type-tested assembly — cannot be fabricated locally.",
    avl: "Governing", vendor: "Siemens / Schneider / ABB", leadWeeks: 34,
  },
  {
    tag: "TR-9901", area: "99", description: "Package transformer", type: "Dry type, 3.3/0.4 kV",
    qty: 1, duty: `${loadSummary.transformer_kVA.toFixed(0)} kVA`, moc: "—", code: "IEC 60076",
    zone: "Unclassified", exRating: SAFE, power_kW: 0, weight_t: 6.5, cost_usd: 245000, makeBuy: "BUY",
    rationale: "Governing vendor item.",
    avl: "Governing", vendor: "Siemens / GE / CG", leadWeeks: 28,
  },
  {
    tag: "AI-9901..9914", area: "99", description: "Process analysers", type: "pH, ORP, conductivity, turbidity, DO, NH₃, Cl₂, S²⁻, oil-in-water, TOC",
    qty: 14, duty: "Continuous, 4–20 mA, alarm to control room", moc: "—", code: "IEC 60079",
    zone: "Zone 2", exRating: EX2, power_kW: 0.2, weight_t: 0.05, cost_usd: 14000, makeBuy: "BUY",
    rationale: "RFQ §11.5 requires intrinsically safe supplies, no nuclear techniques and control-room alarm. Analyser cells are proprietary.",
    avl: "Not listed", vendor: "Endress+Hauser / Hach", leadWeeks: 26,
  },
  {
    tag: "CP-9901", area: "99", description: "Plant / instrument air compressor", type: "Screw, 2 × 100 %",
    qty: 2, duty: "600 Nm³/h @ 8 bar", moc: "—", code: "ISO 8573-1",
    zone: "Unclassified", exRating: SAFE, power_kW: 45, weight_t: 1.8, cost_usd: 88000, makeBuy: "BUY",
    rationale: "Rotating package, not in the approved list — contractor selection.",
    avl: "Not listed", vendor: "Atlas Copco / Kaeser", leadWeeks: 22,
  },
  {
    tag: "GEN-9901", area: "99", description: "Emergency generator", type: "Diesel, 500 kW",
    qty: 1, duty: "Black-start for blowers and RO HP pump", moc: "—", code: "IEC 60034",
    zone: "Unclassified", exRating: SAFE, power_kW: 500, weight_t: 8.5, cost_usd: 215000, makeBuy: "BUY",
    rationale: "Non-governing per the approved list (generators are listed as non-governing).",
    avl: "Non-governing", vendor: "Caterpillar / Cummins / FG Wilson", leadWeeks: 30,
  },
  {
    tag: "PS-9901", area: "99", description: "Pipe spools, supports and platforms", type: "CS / SS 316L / GRP",
    qty: 1, duty: "≈ 4,800 m of pipe 2\"–24\"", moc: "ASTM A106 B, A312 TP316L, GRP",
    code: "ASME B31.3", zone: "Zone 2", exRating: EX2, power_kW: 0, weight_t: 320, cost_usd: 1450000, makeBuy: "MAKE",
    rationale: "Spool fabrication and supports are core RAMSIS workshop work and the largest single make-scope manhour block.",
    avl: "Non-governing", vendor: "RAMSIS ENGINEERING (Bahrain)", leadWeeks: 26,
  },
];

export const equipmentSummary = (() => {
  const make = equipment.filter((e) => e.makeBuy === "MAKE");
  const buy = equipment.filter((e) => e.makeBuy === "BUY");
  const cost = (a: EquipmentItem[]) => a.reduce((s, e) => s + e.cost_usd * e.qty, 0);
  return {
    count: equipment.length,
    makeCount: make.length,
    buyCount: buy.length,
    makeValue: cost(make),
    buyValue: cost(buy),
    total: cost(equipment),
    makeTags: make.map((m) => m.tag),
    governing: equipment.filter((e) => e.avl === "Governing").length,
    nonGoverning: equipment.filter((e) => e.avl === "Non-governing").length,
    notListed: equipment.filter((e) => e.avl === "Not listed").length,
  };
})();

export const byArea = areas.map((a) => {
  const items = equipment.filter((e) => e.area === a.code);
  return {
    ...a,
    count: items.length,
    value: items.reduce((s, e) => s + e.cost_usd * e.qty, 0),
    make: items.filter((i) => i.makeBuy === "MAKE").length,
    power: items.reduce((s, e) => s + e.power_kW * e.qty, 0),
  };
});
