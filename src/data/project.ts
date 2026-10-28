/**
 * Project identification, site data and document register.
 * Every value is transcribed from the five issued ABG documents; the
 * `source` field keeps the traceability required for a design dossier.
 */

export const project = {
  name: "Waste Water Treatment System (WWT)",
  parent: "EPCC of 70,000 BPD Diwanya Refinery Expansion Project",
  projectNo: "B047",
  client: "Midland Refineries Company (MRC)",
  contractor: "Al Barham Group (ABG)",
  epcm: "Boilen Energy DMCC (BED)",
  licensor: "UOP",
  location: "Diwanya, Iraq",
  rfqNo: "2024B047-MR-0022 Rev B",
  rfqDate: "11-Jul-2026",
  designCapacity_m3h: 500,
  turndownPct: [50, 110] as [number, number],
  guaranteeBasis: "24 months from commissioning / 36 months from delivery",
  deliveryTerms: "FCA vendor premises, export packing for 6 months desert storage",
  executionBasis: "EPCC — design, engineering, manufacture, supply, commissioning, training, performance guarantee",
  currency: "USD",
};

export type OptionId = "opt1" | "opt2" | "opt3";

export interface TreatmentOption {
  id: OptionId;
  name: string;
  short: string;
  basis: string;
  disposition: string;
  requiresRO: boolean;
  requiresEvaporation: boolean;
  requiresZLD: boolean;
  capexIndex: number;
  opexIndex: number;
  plotIndex: number;
  risks: string[];
}

export const treatmentOptions: TreatmentOption[] = [
  {
    id: "opt1",
    name: "Option 1 — Discharge to river",
    short: "River discharge",
    basis: "Treated effluent discharged to the Diwanya river channel per Iraqi regulation for preservation of water sources (RFQ §8).",
    disposition: "Surface discharge at battery limit, outfall diffuser",
    requiresRO: false,
    requiresEvaporation: false,
    requiresZLD: false,
    capexIndex: 1.0,
    opexIndex: 1.0,
    plotIndex: 1.0,
    risks: [
      "Chloride limit 600 mg/L against a blended inlet of 1,560 mg/L — not achievable by biological treatment alone; requires RO or a formal MRC deviation.",
      "Sulphate limit 400 mg/L against blended 813 mg/L — same conclusion.",
      "Phenol 0.01–0.05 mg/L is the tightest number in the whole specification; polishing oxidation + GAC required.",
    ],
  },
  {
    id: "opt2",
    name: "Option 2 — Reuse to raw water RO + evaporation pond",
    short: "RO reuse + pond",
    basis: "Maximum treated water returned to the raw-water RO inlet; balance to an evaporation pond (RFQ §9).",
    disposition: "Permeate to raw water RO; RO reject to lined evaporation pond",
    requiresRO: true,
    requiresEvaporation: true,
    requiresZLD: false,
    capexIndex: 1.28,
    opexIndex: 1.12,
    plotIndex: 1.9,
    risks: [
      "Evaporation pond is plot-area driven: at 165 m³/h reject the net-evaporation duty needs a very large lined area in a 2,000 mm/yr pan-evaporation climate.",
      "Pond is a permanent leachate/seepage liability under MRC environmental permitting.",
      "Silica ≤30 mg/L and hardness ≤450 mg/L set the RO recovery ceiling, not the TDS.",
    ],
  },
  {
    id: "opt3",
    name: "Option 3 — Zero liquid discharge",
    short: "ZLD",
    basis: "Brine concentrator + crystalliser; no liquid effluent leaves the battery limit (RFQ §10).",
    disposition: "Distillate recycled to raw water; dry solids to landfill",
    requiresRO: true,
    requiresEvaporation: true,
    requiresZLD: true,
    capexIndex: 1.72,
    opexIndex: 1.55,
    plotIndex: 1.35,
    risks: [
      "Highest power demand of the three options — MVR compressor dominates the electrical load list.",
      "Solid salt disposal route and its classification still to be agreed with MRC.",
      "Crystalliser availability is the single point of failure for the whole discharge licence.",
    ],
  },
];

export interface SiteParameter {
  label: string;
  value: string;
  source: string;
  note?: string;
}

export const siteData: SiteParameter[] = [
  { label: "Design ambient temperature", value: "55 °C", source: "BOD-0001 §6.1 / BOD-0002 §6", note: "RFQ §2 states max -8…55 °C range" },
  { label: "Minimum ambient temperature", value: "+1 °C (static) / −5 °C (rotating)", source: "BOD-0001 §6.1 / BOD-0002 §6", note: "RFQ §2 states −8 °C — see clarification CL-001" },
  { label: "Humidity", value: "12 %RH – 90 %RH", source: "RFQ §2" },
  { label: "Site elevation", value: "34.24 m (datum ±0.000 = EL 34.2416)", source: "RFQ §2 / HAC drawing" },
  { label: "Seismic zone", value: "Zone II, Z = 0.07", source: "RFQ §2", note: "BOD-0001 §6.3 uses UBC-1997 Zone 1, Ca 0.12, Cv 0.18, I = 1.25 — see CL-002" },
  { label: "Design wind speed", value: "44 m/s (3-second gust)", source: "RFQ §2", note: "BOD-0001 §6.2: ASCE 7-2010, 180 km/h basic, exposure C, Kd 0.6" },
  { label: "Rainfall", value: "110 mm/day max, 7 mm/yr average", source: "RFQ §2" },
  { label: "Snow", value: "None", source: "RFQ §2" },
  { label: "Atmospheric pressure", value: "ATM (101.325 kPa)", source: "RFQ §2" },
  { label: "Design life", value: "20 years minimum, continuous duty", source: "BOD-0001 §7 / BOD-0002 §7" },
  { label: "Design capacity", value: "500 m³/h (12,000 m³/d)", source: "RFQ §4" },
  { label: "Operating flexibility", value: "50 % – 110 % of design capacity", source: "RFQ §17" },
  { label: "Waste water battery limit", value: "Plot U9, adjacent to pumping station (potential location)", source: "B047-ABG-03-PR-LAY-0001 Rev 4" },
];

export const hazardousArea = {
  drawing: "B047-ABG-03-PR-LAY-0001 Rev 4 (09-Jun-2026, Issued for Implementation)",
  notes: [
    {
      ref: "Note 17",
      text: "Wastewater treatment open basin areas containing refinery hydrocarbons are classified as Zone 0, while other equipment and modules (such as ultra treatment package) that contain hydrocarbons shall be considered Zone 2, and the selection of all associated instrument and electrical equipment shall be carried out accordingly.",
      impact: "Basins, pits, sumps and open channels = Zone 0 (Cat. 1G / Ex ia). Enclosed treatment modules = Zone 2 IIA/IIB T3 (Cat. 3G / Ex ec or Ex d).",
    },
    {
      ref: "Note 14",
      text: "Oily water system, instrument & electrical equipment should be selected for Zone 0.",
      impact: "All instruments in the API separator / CPI / DAF oil-removal train on the oily-water side default to Zone 0 unless a documented risk-based reclassification is agreed with MRC.",
    },
    {
      ref: "Note 12",
      text: "Below grade location such as sump or trench area is classified as Zone 1.",
      impact: "Pump pits, valve chambers and buried sumps = Zone 1. Submersible pumps need Ex d IIB T3 minimum.",
    },
    {
      ref: "Note 4",
      text: "In general equipments should be selected for Zone-2 IIA/IIB T3 while for the equipment having hydrogen service Zone-2 IIC (or IIB + H2) T3.",
      impact: "Zone 2 equipment: IIB T3. No hydrogen in WWT service, so IIC is not required inside the package.",
    },
    {
      ref: "Note 13",
      text: "Steam boilers and heaters are located in a safe area.",
      impact: "ZLD crystalliser / brine heater (Option 3) can be located in the unclassified zone with the boiler house, subject to a package-specific HAC review.",
    },
  ],
  tempClass: "T3 — max surface temperature 200 °C",
  gasGroup: "IIA / IIB (Zone 2), IIC not applicable to WWT",
  designAmbientForEx: "55 °C site ambient — Ex rating must be valid at the T-class applied",
};

export interface DocumentRef {
  docNo: string;
  title: string;
  rev: string;
  status: string;
  pages: number;
  role: string;
}

export const documentRegister: DocumentRef[] = [
  {
    docNo: "2024B047-MR-0022",
    title: "RFQ for Waste Water Treatment System",
    rev: "B",
    status: "Issued for Procurement, 11-Jul-2026",
    pages: 11,
    role: "Scope of supply, inlet/outlet battery limits, package technical requirements",
  },
  {
    docNo: "B047-ABG-99-ME-BOD-0001",
    title: "Mechanical Design Basis for Static Equipment",
    rev: "1",
    status: "Issued for Construction, 12-Mar-2026",
    pages: 8,
    role: "ASME VIII Div.1 / API 650 basis, shell thickness rule, supports, PWHT, MDMT",
  },
  {
    docNo: "B047-ABG-99-ME-BOD-0002",
    title: "Mechanical Design Basis for Rotating Equipment",
    rev: "0",
    status: "Issued for Construction, 31-Mar-2026",
    pages: 11,
    role: "API 610/675/673/661/671/611/612 criteria, motor margins, NPSH rule, ITP",
  },
  {
    docNo: "B047-ABG-03-PR-LAY-0001",
    title: "Hazardous Area Classification Layout — CDU and LPG Unit",
    rev: "4",
    status: "Issued for Implementation, 09-Jun-2026",
    pages: 4,
    role: "Zone 0/1/2 boundaries, Note 17 WWT classification, Ex gas group and T-class",
  },
  {
    docNo: "2024B047-ABG-DIW",
    title: "Vendors List (MRC approved)",
    rev: "R1",
    status: "Issued",
    pages: 12,
    role: "Governing / non-governing vendor status, ASME U-stamp rule, RAMSIS listing",
  },
];

/** Items where the issued documents contradict each other and a formal
 *  clarification to ABG/MRC is required before procurement. */
export interface Clarification {
  id: string;
  subject: string;
  issue: string;
  complainantDocs: string;
  proposal: string;
  severity: "High" | "Medium" | "Low";
  costImpact: string;
}

export const clarifications: Clarification[] = [
  {
    id: "CL-001",
    subject: "Minimum ambient temperature",
    issue: "RFQ §2 states −8 °C; BOD-0001 §6.1 states +1 °C; BOD-0002 §6 states −5 °C. Three different numbers for the same site.",
    complainantDocs: "2024B047-MR-0022 §2 vs BOD-0001 §6.1 vs BOD-0002 §6",
    proposal: "Design all outdoor equipment, instrument enclosures and freeze protection for −8 °C (the most onerous) at no cost impact; confirm MRC accepts −8 °C as the governing MDMT basis.",
    severity: "Medium",
    costImpact: "Nil if −8 °C accepted; ~0.4 % of package value if −8 °C mandated for all wetted CS.",
  },
  {
    id: "CL-002",
    subject: "Seismic design basis",
    issue: "RFQ §2 specifies Zone II with Z = 0.07; BOD-0001 §6.3 specifies UBC-1997 Zone 1 with Ca 0.12, Cv 0.18 and importance factor 1.25. These are not the same demand.",
    complainantDocs: "2024B047-MR-0022 §2 vs BOD-0001 §6.3",
    proposal: "Adopt the more onerous of the two (UBC Ca = 0.12, I = 1.25) for all package structures and tank anchorage; request MRC confirmation of the single governing basis.",
    severity: "High",
    costImpact: "≈1.1 % of civil/structural scope for anchorage upgrade if UBC governs.",
  },
  {
    id: "CL-003",
    subject: "Chloride and sulphate outlet limits (Option 1)",
    issue: "Blended inlet chloride is 1,560 mg/L and sulphate 813 mg/L, but the river discharge limits are 600 mg/L and 400 mg/L. Biological treatment cannot remove either.",
    complainantDocs: "2024B047-MR-0022 §7 vs §8",
    proposal: "Option 1 is only compliant with a desalination step (RO or ion exchange) or a renegotiated discharge consent. Present both with priced delta; do not offer biological-only for Option 1.",
    severity: "High",
    costImpact: "RO train ≈ 22 % of Option 1 capex if the limits are enforced.",
  },
  {
    id: "CL-004",
    subject: "H2S / sulphide inlet and no outlet limit",
    issue: "Chemical drain carries 100 mg/L S²⁻ and CDU 60 mg/L (blended 43 mg/L) but the outlet table gives no sulphide limit (blank).",
    complainantDocs: "2024B047-MR-0022 §7 vs §8",
    proposal: "Design for ≤1 mg/L sulphide at outlet as good practice; request MRC to confirm a numeric limit so the oxidation duty is not a commercial risk.",
    severity: "Medium",
    costImpact: "Oxidant consumption ±0.3 % of opex per 10 mg/L of design sulphide.",
  },
  {
    id: "CL-005",
    subject: "Outlet turbidity and TDS marking",
    issue: "Option 2 table marks turbidity, TDS, TSS, DO, BOD and 30 further parameters as 'VTA' (vendor to advise) with no numeric limit, yet §9 calls them 'maximum required property'.",
    complainantDocs: "2024B047-MR-0022 §9",
    proposal: "Offer a firm numeric envelope (turbidity ≤1 NTU, TDS ≤1,000 mg/L, TSS ≤5 mg/L, BOD ≤10 mg/L) and get MRC sign-off, otherwise the performance guarantee is unenforceable.",
    severity: "High",
    costImpact: "Protects the LD exposure on the performance guarantee — no capex delta.",
  },
  {
    id: "CL-006",
    subject: "Motor changeover voltage 132–133 kW",
    issue: "RFQ §11.2 changes from LV to MV at '133 kW and above'; BOD-0002 §17 changes at '132 kW and above'. A 132 kW motor therefore falls on both sides.",
    complainantDocs: "2024B047-MR-0022 §11.2 vs BOD-0002 §17",
    proposal: "Adopt MV (3.3 kV) at ≥132 kW per BOD-0002 and align the RFQ wording; verify MCC spare ways on that basis.",
    severity: "Low",
    costImpact: "Neutral; affects MCC schedule and cable sizing only.",
  },
  {
    id: "CL-007",
    subject: "Pump standby requirement vs package scope",
    issue: "RFQ §11.1 requires all rotary equipment supplied with installed standby, which doubles the pump count in a 500 m³/h train and conflicts with the §17 turndown philosophy.",
    complainantDocs: "2024B047-MR-0022 §11.1 vs §17",
    proposal: "Apply installed standby to critical duty only (feed, recycle, RO high-pressure, oxidant dosing, blowers) and offer the rest with one installed spare per train plus warehouse spare rotables.",
    severity: "Medium",
    costImpact: "−6 to −8 % of pump package value if standby is rationalised.",
  },
  {
    id: "CL-008",
    subject: "Vendor list coverage",
    issue: "The MRC approved vendor list has no governing vendors at all for RO/UF membranes, DAF, MBBR media, evaporator/crystalliser, decanter centrifuges and process analysers.",
    complainantDocs: "2024B047-ABG-DIW Vendors List R1",
    proposal: "Invoke the list's own clause: for non-listed items the Contractor selects per project specification, and where an item has fewer than 3 approved vendors ABG may add vendors with formal MRC approval. Submit the proposed list in this dossier for approval.",
    severity: "High",
    costImpact: "Enables competitive tender — avoids single-source premium of 8–15 %.",
  },
];
