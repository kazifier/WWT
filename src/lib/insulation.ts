/**
 * Thermal insulation schedule — ME-SPE-0014.
 *
 * Insulation is applied by surface, not by tag: the schedule is built from the
 * hot and cold surfaces in the package (heat-exchanger shells, steam and
 * condensate lines, CIP circuit, sludge line) with the material and thickness
 * the specification requires for that service temperature, then the area,
 * jacketing, volume and mass are calculated from the geometry.
 *
 * Areas are in square metres and are quoted that way everywhere in the dossier.
 */

import { outsideDiameter, pipeLines } from "@/lib/piping";

export type InsulationMaterial = "Rock wool 100 kg/m³" | "Cellular glass" | "PUF 40 kg/m³" | "Aerogel blanket";

export interface InsulationItem {
  tag: string;
  service: string;
  /** Item the insulation sits on: an equipment tag or a line number. */
  host: string;
  hostType: "equipment" | "piping";
  /** Surface temperature, °C. */
  temp_C: number;
  /** Insulated outside area before insulation, m². */
  area_m2: number;
  material: InsulationMaterial;
  thickness_mm: number;
  /** 0.8 mm aluminium jacketing is applied outdoors (ME-SPE-0014 §7.2). */
  jacketing: "Al 0.8 mm" | "SS 0.5 mm" | "none";
  /** Personnel protection only — not a thermal requirement. */
  personnelOnly: boolean;
  clause: string;
}

/** Hot service: rock wool; cold service: cellular glass / PUF; both with Al jacketing outdoors. */
function materialFor(temp_C: number): { material: InsulationMaterial; jacketing: InsulationItem["jacketing"] } {
  if (temp_C >= 100) return { material: "Rock wool 100 kg/m³", jacketing: "Al 0.8 mm" };
  if (temp_C >= 60) return { material: "Rock wool 100 kg/m³", jacketing: "Al 0.8 mm" };
  if (temp_C <= 10) return { material: "Cellular glass", jacketing: "Al 0.8 mm" };
  return { material: "PUF 40 kg/m³", jacketing: "Al 0.8 mm" };
}

/** ME-SPE-0014 Table 2 — thickness by nominal pipe size for hot service ≥ 60 °C. */
export function thicknessForPipe(nps: number, temp_C: number): number {
  if (temp_C < 60) return 25;
  if (nps <= 2) return 40;
  if (nps <= 6) return 50;
  if (nps <= 12) return 60;
  return 75;
}

/** Cylindrical shell area, m²: π·D·L plus one dished end where the item is closed. */
const shellArea = (d_m: number, l_m: number, ends = 0): number =>
  Math.PI * d_m * l_m + ends * (Math.PI * d_m * d_m) / 4;

const equipmentInsulation: InsulationItem[] = [
  {
    tag: "INS-3001/1",
    service: "Lube oil shell and tube exchanger — hot oil side",
    host: "HX-3001/1",
    hostType: "equipment",
    temp_C: 120,
    area_m2: +shellArea(1.1, 4.5).toFixed(1),
    ...materialFor(120),
    thickness_mm: 60,
    personnelOnly: false,
    clause: "ME-SPE-0014 §5.3 hot service > 100 °C",
  },
  {
    tag: "INS-3001/2",
    service: "Cooling water exchanger — shell protection",
    host: "HX-3001/2",
    hostType: "equipment",
    temp_C: 55,
    area_m2: +shellArea(0.9, 5.0).toFixed(1),
    ...materialFor(55),
    thickness_mm: 25,
    personnelOnly: true,
    clause: "ME-SPE-0014 §6.1 personnel protection > 60 °C surface",
  },
  {
    tag: "INS-8001",
    service: "Sludge thickener — personnel protection on the scraper bridge",
    host: "T-8001",
    hostType: "equipment",
    temp_C: 40,
    area_m2: 12.5,
    ...materialFor(40),
    thickness_mm: 25,
    personnelOnly: true,
    clause: "ME-SPE-0014 §6.1",
  },
  {
    tag: "INS-7001",
    service: "CIP solution tank — hot caustic circulation at 60 °C",
    host: "CIP-7001",
    hostType: "equipment",
    temp_C: 60,
    area_m2: +shellArea(2.4, 2.4, 1).toFixed(1),
    ...materialFor(60),
    thickness_mm: 50,
    personnelOnly: false,
    clause: "ME-SPE-0014 §5.3",
  },
  {
    tag: "INS-1001",
    service: "Neutralisation tank — agitator pedestal and hot drain line",
    host: "V-1001",
    hostType: "equipment",
    temp_C: 65,
    area_m2: 6.0,
    ...materialFor(65),
    thickness_mm: 40,
    personnelOnly: true,
    clause: "ME-SPE-0014 §6.1",
  },
];

/** Piping insulation, taken straight from the line list (only lines with insulation_mm > 0). */
const pipingInsulation: InsulationItem[] = pipeLines
  .filter((l) => l.insulation_mm > 0)
  .map((l) => {
    const od_m = outsideDiameter(l.nps) / 1000;
    return {
      tag: `INS-${l.lineNo.split("-")[2].replace(/[^0-9]/g, "")}-${l.nps}"`,
      service: l.service,
      host: l.lineNo,
      hostType: "piping" as const,
      temp_C: l.designT_C,
      area_m2: +(Math.PI * od_m * l.length_m).toFixed(1),
      ...materialFor(l.designT_C),
      thickness_mm: l.insulation_mm,
      personnelOnly: l.designT_C < 60,
      clause:
        l.designT_C >= 100
          ? "ME-SPE-0014 §5.3 hot service"
          : l.designT_C >= 60
            ? "ME-SPE-0014 §5.3 warm service"
            : "ME-SPE-0014 §6.1 personnel protection",
    };
  });

export const insulationItems: InsulationItem[] = [...equipmentInsulation, ...pipingInsulation];

const DENSITY: Record<InsulationMaterial, number> = {
  "Rock wool 100 kg/m³": 100,
  "Cellular glass": 120,
  "PUF 40 kg/m³": 40,
  "Aerogel blanket": 160,
};

export interface InsulationRow extends InsulationItem {
  /** Insulated area including the insulation build-up, m². */
  finishedArea_m2: number;
  insulationVolume_m3: number;
  insulationMass_kg: number;
  jacketingArea_m2: number;
}

export const insulationRows: InsulationRow[] = insulationItems.map((i) => {
  const delta = i.thickness_mm / 1000;
  // Area grows with the insulation thickness: A' = A · (D + 2t)/D, approximated
  // from the equivalent diameter of the surface being insulated.
  const equivalentD = Math.sqrt(i.area_m2 / Math.PI) || 1;
  const finished = i.area_m2 * ((equivalentD + 2 * delta) / equivalentD);
  const volume = i.area_m2 * delta;
  return {
    ...i,
    finishedArea_m2: +finished.toFixed(1),
    insulationVolume_m3: +volume.toFixed(2),
    insulationMass_kg: Math.round(volume * DENSITY[i.material]),
    jacketingArea_m2: i.jacketing === "none" ? 0 : +finished.toFixed(1),
  };
});

export const insulationSummary = (() => {
  const area = insulationRows.reduce((a, r) => a + r.area_m2, 0);
  const jacketing = insulationRows.reduce((a, r) => a + r.jacketingArea_m2, 0);
  const mass = insulationRows.reduce((a, r) => a + r.insulationMass_kg, 0);
  const volume = insulationRows.reduce((a, r) => a + r.insulationVolume_m3, 0);
  const hot = insulationRows.filter((r) => r.temp_C >= 60);
  const cold = insulationRows.filter((r) => r.temp_C < 60);
  const byMaterial = [...new Set(insulationRows.map((r) => r.material))].map((material) => {
    const rows = insulationRows.filter((r) => r.material === material);
    return {
      material,
      items: rows.length,
      area_m2: +rows.reduce((a, r) => a + r.area_m2, 0).toFixed(1),
      mass_kg: rows.reduce((a, r) => a + r.insulationMass_kg, 0),
      thicknesses: [...new Set(rows.map((r) => r.thickness_mm))].sort((a, b) => a - b),
    };
  });
  return {
    items: insulationRows.length,
    area_m2: +area.toFixed(1),
    jacketing_m2: +jacketing.toFixed(1),
    volume_m3: +volume.toFixed(2),
    mass_kg: mass,
    hotArea_m2: +hot.reduce((a, r) => a + r.area_m2, 0).toFixed(1),
    coldArea_m2: +cold.reduce((a, r) => a + r.area_m2, 0).toFixed(1),
    personnel: insulationRows.filter((r) => r.personnelOnly).length,
    byMaterial,
  };
})();

/** Bare external area of the package that still needs painting (ISO 12944 / QC-SPC-001). */
export const paintArea = (() => {
  const pipingBare = pipeLines
    .filter((l) => l.insulation_mm === 0)
    .reduce((a, l) => a + Math.PI * (outsideDiameter(l.nps) / 1000) * l.length_m, 0);
  return {
    piping_m2: +pipingBare.toFixed(0),
    insulatedPiping_m2: +(insulationSummary.area_m2 - insulationSummary.hotArea_m2 - insulationSummary.coldArea_m2 + insulationSummary.area_m2 * 0).toFixed(0),
    note: "Jacketed surfaces are painted on the jacketing only (QC-SPC-001 §7.4).",
  };
})();
