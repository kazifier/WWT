/**
 * MRC / ABG approved vendor list (2024B047-ABG-DIW R1) — the categories that
 * matter for the WWT package, plus what the list does NOT cover.
 *
 * The source PDF is a multi-column table that flattened into a single text
 * run, so column-to-item attribution is only certain where the item name sits
 * adjacent to its vendor block. Entries marked confidence "inferred" must be
 * re-verified against the native spreadsheet before a purchase order.
 */

export type Confidence = "high" | "inferred";

export interface VendorEntry {
  name: string;
  hq: string;
}

export interface AvlCategory {
  equipment: string;
  governing: boolean;
  confidence: Confidence;
  vendors: VendorEntry[];
  note?: string;
}

export const avlCategories: AvlCategory[] = [
  {
    equipment: "Centrifugal pumps",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "Flowserve", hq: "USA" },
      { name: "Sulzer", hq: "Switzerland" },
      { name: "Clyde Union", hq: "UK" },
      { name: "Goulds-Ruhr", hq: "USA" },
      { name: "CPC", hq: "USA" },
      { name: "OBL", hq: "Italy" },
    ],
    note: "Governing — the contractor must use these vendors for the API 610 pumps in the package.",
  },
  {
    equipment: "Dosing / metering pumps",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "Milton Roy", hq: "USA" },
      { name: "Sera", hq: "Germany" },
      { name: "LMI", hq: "USA" },
    ],
    note: "API 675 diaphragm dosing pumps. Milton Roy and Sera cover the 5–500 L/h range the chemical skids need.",
  },
  {
    equipment: "Blowers",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "Boldrocchi", hq: "Italy" },
      { name: "Ebara Hamada Blower Co. Ltd", hq: "Japan" },
    ],
    note: "Only two governing vendors — under the list's own clause, ABG may add vendors with MRC approval where fewer than three exist.",
  },
  {
    equipment: "Mixers and agitators",
    governing: false,
    confidence: "inferred",
    vendors: [
      { name: "Neptune Mixers", hq: "USA" },
      { name: "Antico Olindo & Cesare", hq: "Italy" },
      { name: "Boldrocchi", hq: "Italy" },
    ],
    note: "Non-governing — the contractor may select any suitable vendor per project specification.",
  },
  {
    equipment: "Mechanical seals",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "John Crane", hq: "USA" },
      { name: "EagleBurgmann", hq: "Germany" },
      { name: "Flowserve", hq: "USA" },
    ],
    note: "API 682 single seals for all package pumps.",
  },
  {
    equipment: "Couplings",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "John Crane", hq: "USA" },
      { name: "KTR", hq: "Germany" },
      { name: "GTS", hq: "UK" },
      { name: "Flender", hq: "Germany" },
      { name: "Ru-Steel", hq: "Italy" },
      { name: "SKF", hq: "Sweden" },
      { name: "Thomas-Rexnord", hq: "USA" },
      { name: "Piller", hq: "Germany" },
    ],
  },
  {
    equipment: "MV & LV motors",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "Siemens", hq: "Germany" },
      { name: "ABB", hq: "Finland / Germany" },
      { name: "Fuji Electric", hq: "Japan" },
      { name: "CG", hq: "Belgium" },
      { name: "ATB Schorch", hq: "Germany" },
      { name: "Brook Crompton", hq: "England" },
      { name: "ACEC", hq: "Belgium" },
      { name: "Marelli", hq: "Italy" },
    ],
    note: "IEC 60034, IP55, Class F / B rise, 55 °C ambient. 132 kW and above at 3.3 kV.",
  },
  {
    equipment: "Transformers",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "GE", hq: "USA" },
      { name: "Siemens", hq: "Germany" },
      { name: "Brush", hq: "England" },
      { name: "Fuji", hq: "Japan" },
      { name: "CG", hq: "Belgium" },
    ],
  },
  {
    equipment: "Switchgear & MCC (3.3 kV / 0.4 kV)",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "Siemens", hq: "Germany" },
      { name: "Schneider Electric", hq: "France" },
      { name: "ABB", hq: "Germany" },
      { name: "Fuji Electric", hq: "Japan" },
    ],
  },
  {
    equipment: "Soft starters & VFD",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "Siemens", hq: "Germany" },
      { name: "ABB", hq: "Europe" },
      { name: "Schneider Electric", hq: "France" },
      { name: "Fuji Electric", hq: "Japan" },
    ],
  },
  {
    equipment: "Power capacitor banks / PFC",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "MR", hq: "Germany" },
      { name: "Frako", hq: "Germany" },
      { name: "Schneider", hq: "France" },
      { name: "ABB", hq: "Europe" },
    ],
  },
  {
    equipment: "Electrical cables",
    governing: false,
    confidence: "inferred",
    vendors: [
      { name: "Nexans", hq: "France" },
      { name: "Prysmian (Pirelli)", hq: "Italy" },
      { name: "Ducab", hq: "UAE" },
      { name: "Riyadh Cables", hq: "Saudi Arabia" },
      { name: "Saudi Cable", hq: "Saudi Arabia" },
      { name: "Oman Cables", hq: "Oman" },
      { name: "Elsewedy (Egypt)", hq: "Egypt" },
      { name: "Fulgor", hq: "Greece" },
    ],
  },
  {
    equipment: "Ex-proof distribution boards & lighting",
    governing: false,
    confidence: "inferred",
    vendors: [
      { name: "Stahl", hq: "Germany" },
      { name: "Eaton (Crouse-Hinds / CEAG)", hq: "USA / Germany" },
      { name: "ATX-Legrand", hq: "France" },
      { name: "Cortem", hq: "Italy" },
      { name: "Hawke", hq: "UK" },
    ],
    note: "Zone 2 IIB T3 for the treatment modules; Zone 0 for basins needs Ex ia or Ex ma, which narrows this list considerably.",
  },
  {
    equipment: "Valves (all types)",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "Fisher", hq: "USA" },
      { name: "Samson", hq: "Germany" },
      { name: "Ari Armaturen", hq: "Germany" },
      { name: "Crosby", hq: "USA" },
      { name: "Leser", hq: "Germany" },
      { name: "Broady", hq: "UK" },
      { name: "Nakakita", hq: "Japan" },
      { name: "Parcol", hq: "Italy" },
      { name: "Sempell", hq: "Germany" },
      { name: "Tyco", hq: "Ireland" },
      { name: "IMI B. Birkett", hq: "UK" },
      { name: "Keystone", hq: "USA" },
      { name: "GE Nuovo Pignone", hq: "Italy" },
      { name: "Imjamal", hq: "Iraq" },
    ],
    note: "Imjamal is the only Iraq-based governing valve vendor and should be used where local content is scored.",
  },
  {
    equipment: "Pipes, fittings and flanges",
    governing: false,
    confidence: "inferred",
    vendors: [
      { name: "Tenaris / Tamsa", hq: "Argentina / Mexico" },
      { name: "Vallourec", hq: "France" },
      { name: "Nippon Steel", hq: "Japan" },
      { name: "Butting", hq: "Germany" },
      { name: "Erne Fittings", hq: "Austria" },
      { name: "Taylor Forge", hq: "USA" },
      { name: "Arabian Pipe Co.", hq: "Saudi Arabia" },
      { name: "Kaddas", hq: "UAE" },
    ],
    note: "Non-governing: contractor selects per project specification. Specify ASTM grades only, per RFQ §11.1.",
  },
  {
    equipment: "Gaskets, stud bolts, steam traps",
    governing: false,
    confidence: "inferred",
    vendors: [
      { name: "Flexitallic", hq: "UK / USA" },
      { name: "Garlock", hq: "USA" },
      { name: "Klinger", hq: "Austria" },
      { name: "Gulf Gasket Factory", hq: "UAE" },
      { name: "Spira Power", hq: "UAE" },
      { name: "Korea Flange", hq: "Korea" },
    ],
  },
  {
    equipment: "Third party inspection",
    governing: true,
    confidence: "high",
    vendors: [
      { name: "TÜV Rheinland", hq: "Germany" },
      { name: "Bureau Veritas", hq: "France" },
      { name: "SGS", hq: "Switzerland" },
      { name: "RINA", hq: "Italy" },
      { name: "ATG", hq: "UK" },
      { name: "Al-Rookal Co.", hq: "Iraq (inside-Iraq scope only)" },
    ],
  },
  {
    equipment: "Manufactured items — columns, pressure vessels, exchangers, heaters, air coolers",
    governing: false,
    confidence: "high",
    vendors: [
      { name: "RAMSIS ENGINEERING", hq: "Bahrain" },
      { name: "Gulf Specialized Mechanical & Engineering (GSME)", hq: "UAE" },
      { name: "Motherwell Bridge", hq: "UK" },
      { name: "KNM Process Systems", hq: "Malaysia / Netherlands" },
      { name: "Joseph Bertsch", hq: "USA" },
      { name: "BELLELI Energy", hq: "Italy / Saudi Arabia" },
      { name: "Larsen & Toubro", hq: "India" },
      { name: "National Petroleum Construction Co. (NPCC)", hq: "UAE" },
      { name: "SICES", hq: "Italy" },
      { name: "Simic", hq: "Italy" },
    ],
    note: "RAMSIS Engineering (Bahrain) is an approved NON-GOVERNING vendor for manufactured process equipment. Non-governing means the contractor may select it without further MRC approval, provided the equipment meets the project specification and the ASME U-stamp rule below.",
  },
];

export const avlRules = [
  {
    rule: "ASME U-stamp mandatory",
    quote:
      "All Pressure Equipment Manufacturers shall be ASME U Stamp Certified.",
    application:
      "Every vessel, filter shell and adsorber fabricated by RAMSIS must carry a valid ASME U-stamp for the specific shop, not just the company. Certificate must be current at the time of fabrication and the Authorised Inspector must witness the hydrotest.",
  },
  {
    rule: "Governing items are locked",
    quote:
      "The Contractor shall follow the Company-Recommended Vendors for all Governing (Critical Equipment).",
    application:
      "Centrifugal pumps, dosing pumps, blowers, motors, transformers, MCC, switchgear, valves, couplings and seals must be bought from the governing list. No substitution without MRC approval.",
  },
  {
    rule: "Non-governing and unlisted items are contractor-selected",
    quote:
      "The Contractor shall follow the Project Specifications and Design Documents, and select the most suitable vendor when placing the order.",
    application:
      "This is the clause that legitimises every vendor recommendation in this dossier for items the list does not cover — RO/UF membranes, DAF, MBBR, evaporators, centrifuges and analysers.",
  },
  {
    rule: "Sub-3 vendor categories may be supplemented",
    quote:
      "Critical/Governing items, where the number of approved vendors in the MRC approved vendor list is less than 03, ABG shall have the right to include additional vendors after obtaining formal approval from MRC.",
    application:
      "Blowers have only 2 governing vendors, dosing pumps 3. Adding Aerzen or Kaeser for blowers and ProMinent for dosing is a formal, permitted route — not a deviation.",
  },
];

/* ------------------------------------------------------------------ */
/* Items the approved vendor list does not cover                       */
/* ------------------------------------------------------------------ */
export interface ProposedVendor {
  name: string;
  hq: string;
  strength: string;
}

export interface UnlistedCategory {
  id: string;
  equipment: string;
  avlStatus: "not listed" | "under-represented";
  why: string;
  approvalRoute: string;
  proposed: ProposedVendor[];
  recommendation: string;
  reasoning: string;
}

export const unlistedCategories: UnlistedCategory[] = [
  {
    id: "N-01",
    equipment: "RO / UF membranes and membrane skids",
    avlStatus: "not listed",
    why: "The MRC list covers piping, valves, vessels and electrical equipment for the process units, but has no membrane vendor at all. Options 2 and 3 cannot be priced without one.",
    approvalRoute: "Non-listed item — contractor selects per project specification (Vendors List note). Submit to MRC with the RFQ response for record.",
    proposed: [
      { name: "Toray Industries", hq: "Japan", strength: "ROMEMBRA RO + HSU UF; strong in refinery reuse references in the Gulf" },
      { name: "DuPont Water Solutions (FilmTec)", hq: "USA", strength: "Largest RO element installed base; Fortilife range is built for high-fouling wastewater" },
      { name: "Veolia Water Technologies (SUEZ)", hq: "France", strength: "Full train supply including ZLD integration; single-point performance guarantee" },
      { name: "LG Chem (NanoH2O)", hq: "Korea", strength: "Competitive RO pricing, strong regional support from Bahrain" },
    ],
    recommendation: "Veolia Water Technologies (SUEZ) for the train, with Toray or DuPont elements",
    reasoning:
      "A package with a single performance guarantee is worth more than a few percent on element price: the effluent reuse guarantee sits on the RO, and splitting the guarantee between an element maker and a skid builder leaves the interface risk with ABG. Element supply should stay open to Toray and DuPont so the second fill is competitive.",
  },
  {
    id: "N-02",
    equipment: "Dissolved air flotation (DAF) units",
    avlStatus: "not listed",
    why: "No DAF vendor appears anywhere on the list. The DAF is the only barrier between 120 mg/L and 15 mg/L oil, and it protects the biology.",
    approvalRoute: "Non-listed item — contractor selection. Not critical, so no MRC pre-approval needed, but record it in the PDR.",
    proposed: [
      { name: "Huber SE", hq: "Germany", strength: "HDF DAF with counter-current scraping; extensive refinery oily-water references" },
      { name: "Sülzle Klein", hq: "Germany", strength: "Compact DAF packages, good for revamp and brownfield layouts" },
      { name: "Veolia Water Technologies", hq: "France", strength: "Bundles with the RO/ZLD scope, single guarantee" },
      { name: "Evoqua (Xylem)", hq: "USA", strength: "Large installed base, strong service network in the Middle East" },
    ],
    recommendation: "Huber SE, with Veolia as the bundled alternative",
    reasoning:
      "Huber's DAF is the reference unit for refinery oily water in this capacity band and its scraper design is proven on waxy/sludgy refinery float. If Veolia is awarded the RO, bundling the DAF into that package removes an interface and a spare-parts inventory.",
  },
  {
    id: "N-03",
    equipment: "Biological treatment — aeration, diffusers, MBBR media",
    avlStatus: "not listed",
    why: "The list has blowers (governing) but nothing for diffusers, aeration grids, biofilm media or the biological process guarantee.",
    approvalRoute: "Non-listed. Diffusers and media are non-critical consumables; the process guarantee is carried by the WWT package vendor.",
    proposed: [
      { name: "Xylem (Sanitaire)", hq: "USA / UK", strength: "Fine-bubble diffuser systems and gold-standard aeration design support" },
      { name: "Veolia (AnoxKaldnes)", hq: "Sweden", strength: "MBBR/IFAS media and process design for high-ammonia refinery effluent" },
      { name: "Suez / Aquatech", hq: "France / USA", strength: "Full biological train with performance guarantee" },
      { name: "Sulzer (mixers)", hq: "Switzerland", strength: "Anoxic zone submersible mixers, Ex-rated for Zone 2" },
    ],
    recommendation: "Xylem Sanitaire diffusers + Sulzer mixers",
    reasoning:
      "Diffusers are 3 % of capex and 30 % of the aeration energy bill, so the efficiency warranty matters more than the price. Sanitaire's 6 m grid is a direct fit for the 3,000 m³ basins and their oxygen transfer warranty is measurable at site.",
  },
  {
    id: "N-04",
    equipment: "Evaporator / crystalliser (ZLD)",
    avlStatus: "not listed",
    why: "Option 3 is a ZLD system and the list has no thermal vendor. This is the largest single equipment line in Option 3.",
    approvalRoute: "Non-listed, critical by value. Recommend a formal MRC pre-qualification before the Option 3 bid is priced.",
    proposed: [
      { name: "Veolia HPD", hq: "USA / France", strength: "MVR brine concentrators and crystallisers; largest reference base in refining" },
      { name: "GEA Process Engineering", hq: "Germany", strength: "Falling-film MVR and salt crystallisers, strong Middle East service" },
      { name: "Aquatech International", hq: "USA", strength: "Fractional crystallisation and ZLD integration" },
      { name: "IDE Technologies", hq: "Israel", strength: "Thermal and membrane brine concentration" },
    ],
    recommendation: "Veolia HPD, with GEA as the technical alternate",
    reasoning:
      "At 165 m³/h of reject the crystalliser is a 5–6 MW machine whose availability defines the discharge licence. Both vendors have refining references, but HPD is the one whose warranty structure fits a single-point ZLD guarantee.",
  },
  {
    id: "N-05",
    equipment: "Decanter centrifuges (sludge dewatering)",
    avlStatus: "not listed",
    why: "No separation equipment vendor on the list. The package produces about 14 t/d of dry solids, so dewatering availability directly controls the sludge trucking cost.",
    approvalRoute: "Non-listed. Non-critical, contractor selection.",
    proposed: [
      { name: "Alfa Laval", hq: "Sweden", strength: "ALDEC decanters, largest service footprint in the Gulf" },
      { name: "Flottweg", hq: "Germany", strength: "Oily sludge decanters with high dry-solids cake" },
      { name: "GEA Westfalia", hq: "Germany", strength: "Refinery sludge references, robust bowl design" },
      { name: "Hiller", hq: "Germany", strength: "Competitive on 3-phase oily sludge separation" },
    ],
    recommendation: "Alfa Laval ALDEC",
    reasoning:
      "Three-phase separation of oily biological sludge is the hardest duty in this plant and Alfa Laval has the densest service network from Bahrain and Saudi, which matters more than capex for a machine that runs continuously.",
  },
  {
    id: "N-06",
    equipment: "Process analysers and instrumentation",
    avlStatus: "not listed",
    why: "RFQ §11.5 requires a long list of analysers (pH, conductivity, ORP, turbidity, chlorine, iron, SDI, ammonia) and none is on the vendor list.",
    approvalRoute: "Non-listed. Contractor selection to project specification.",
    proposed: [
      { name: "Endress+Hauser", hq: "Switzerland", strength: "Full water-analysis portfolio, strong Bahrain service" },
      { name: "Hach", hq: "USA", strength: "Ammonia, chlorine and turbidity analysers with lowest reagent cost" },
      { name: "ABB", hq: "Switzerland", strength: "Integrated analyser houses and systems" },
      { name: "Siemens", hq: "Germany", strength: "Process analytics with SIL-rated options" },
    ],
    recommendation: "Endress+Hauser for flow/level/pH, Hach for the wet-chemistry analysers",
    reasoning:
      "One vendor for the whole instrument index keeps the spare-parts list short, but ammonia and chlorine need Hach's reagent-based cells to meet the 0.5 mg/L and 2 mg/L limits reliably. Splitting by measurement type rather than by area is the cheaper long-term call.",
  },
  {
    id: "N-07",
    equipment: "Chemical dosing skids and polymer make-up",
    avlStatus: "under-represented",
    why: "Dosing pumps are governed (Milton Roy, Sera, LMI) but the skids, tanks, mixers and control panels that carry them are not listed.",
    approvalRoute: "Pumps from the governing list; skid fabrication by RAMSIS; controls by the PLC vendor.",
    proposed: [
      { name: "Milton Roy", hq: "USA", strength: "Governing — API 675 diaphragm pumps with 0–100 % capacity control" },
      { name: "Sera", hq: "Germany", strength: "Governing — high-turn-down diaphragm pumps" },
      { name: "ProMinent", hq: "Germany", strength: "Add via the sub-3-vendor clause for the small polymer/nutrient duties" },
      { name: "Watson-Marlow", hq: "UK", strength: "Peristaltic polymer feed, low shear" },
    ],
    recommendation: "Milton Roy pumps on RAMSIS-fabricated skids",
    reasoning:
      "Buying the pumps from the governing list and fabricating the skid in Bahrain keeps the governed content compliant and the ungoverned content local. ProMinent is the right addition for the small duties where Milton Roy's smallest frame is oversized.",
  },
  {
    id: "N-08",
    equipment: "Package control system (PLC/SCADA)",
    avlStatus: "not listed",
    why: "RFQ §11.2 requires all process variables through the PLC, and §5 requires a package control system, but no automation vendor is on the list.",
    approvalRoute: "Non-listed. Must be on the MRC plant DCS standard — confirm the platform with MRC before bid.",
    proposed: [
      { name: "Siemens (S7-1500 / PCS neo)", hq: "Germany", strength: "Governing electrical vendor already — same supply chain" },
      { name: "Schneider Electric (EcoStruxure)", hq: "France", strength: "Governing electrical vendor, strong water segment" },
      { name: "ABB (AC500 / 800xA)", hq: "Switzerland", strength: "Governing electrical vendor" },
      { name: "Rockwell (ControlLogix)", hq: "USA", strength: "Common in package units, but not on the MRC list" },
    ],
    recommendation: "Siemens S7-1500 with a SCADA layer to the MRC DCS",
    reasoning:
      "Siemens already supplies the motors, switchgear and soft starters from the governing list, so one vendor owns the electrical and control interface. Confirm the MRC plant DCS protocol before the bid — a protocol mismatch discovered after award is a classic package-unit claim.",
  },
];
