/**
 * Builds the grounding context handed to Gemini. It is derived from the same
 * calculation modules that render the site, so the assistant cannot drift from
 * the numbers on the page.
 */
import { project, treatmentOptions, hazardousArea, clarifications, siteData } from "@/data/project";
import { blendedAll, inletParameters, riverLimits, reuseLimits } from "@/data/influent";
import { equipment, equipmentSummary } from "@/data/equipment";
import { avlCategories, unlistedCategories, avlRules } from "@/data/vendors";
import { process as P } from "@/lib/calc/process";
import { loadSummary, pumpResults } from "@/lib/calc/mechanical";
import { mtoTotals, fabrication } from "@/lib/calc/mto";
import { optionEstimates, opexFor, PV_FACTOR } from "@/lib/calc/cost";
import { haWithSqm, plot, plotArea_m2, areaBlocks, blockAreaTotal_m2, sqm, partCounts } from "@/lib/plantLayout";
import { bulkSheets, bulkTotals } from "@/lib/calc/bulk";
import { pipeBySize, pipingSummary, valveSchedule, valveTotals } from "@/lib/piping";
import { instrumentsByArea, ioSummary } from "@/lib/instruments";
import { motors, motorSummary, powerSummary, trayFill } from "@/lib/electrical";
import { insulationSummary, paintArea } from "@/lib/insulation";

export function buildProjectContext(): string {
  const layout = `
Plot U9 layout: ${plot.w} x ${plot.d} m = ${sqm(plotArea_m2)} total. Area envelopes (bounding box, m2): ${areaBlocks
    .map((b) => `Area ${b.code} ${b.name}: ${sqm(b.area_m2)} (${b.items} items)`)
    .join("; ")}. Total enveloped ${sqm(blockAreaTotal_m2)}.`;

  const B = blendedAll();
  const blended = inletParameters
    .filter((p) => !p.nonAdditive)
    .map((p) => `${p.label}: ${B[p.key].toFixed(1)} ${p.unit}`)
    .join("; ");

  const eqList = equipment
    .map((e) => `${e.tag} | ${e.description} | ${e.qty} off | ${e.duty} | ${e.moc} | ${e.code} | ${e.zone} | ${e.makeBuy} | ${e.avl} | ${e.vendor}`)
    .join("\n");

  const sheets = [...P.sheets, ...bulkSheets].map((s) => `${s.id} ${s.title} (${s.clause})`).join("\n");

  const costs = optionEstimates
    .map((o) => `${o.name}: capex USD ${(o.total / 1e6).toFixed(1)}M, opex USD ${(opexFor(o.id).total / 1e6).toFixed(2)}M/yr`)
    .join("\n");

  return `# PROJECT
${project.parent}
WWT package, RFQ ${project.rfqNo}, ${project.rfqDate}
Client: ${project.client} | EPC: ${project.contractor} | EPCM: ${project.epcm} | Site: ${project.location}
Design capacity ${project.designCapacity_m3h} m3/h (12,000 m3/d), design flow with 110% overdesign: ${P.designFlow} m3/h
Scope: design, engineering, manufacture, supply, commissioning, training, performance guarantee. Warranty 24 months from commissioning / 36 from delivery.

# SITE AND DESIGN BASIS
${siteData.map((s) => `${s.label}: ${s.value}`).join("\n")}

# HAZARDOUS AREA (B047-ABG-03-PR-LAY-0001 Rev 4, Note 17)
Open basin areas containing hydrocarbons = Zone 0. Treatment modules / ultra treatment package containing hydrocarbons = Zone 2 IIA/IIB T3. Below-grade sumps and trenches = Zone 1. T-class T3 (200 C max surface). ${hazardousArea.gasGroup}.

# INLET (RFQ section 7) - flow-weighted blend of 4 streams
CDU 50 m3/h, Oil storage 80 m3/h, Process drain 250 m3/h, Chemical drain 120 m3/h = 500 m3/h
${blended}

# PROCESS DESIGN RESULTS
Neutralisation: ${P.neutralisation.tanks} tanks x ${P.neutralisation.tankVolume} m3, NaOH ${P.neutralisation.naoh_kgh} kg/h, H2SO4 ${P.neutralisation.h2so4_kgh} kg/h
API separator: rise velocity ${P.oilRemoval.riseVelocity_mm_s} mm/s, Vh ${P.oilRemoval.horizontalVelocity_mm_s} mm/s, ${P.oilRemoval.trains} trains, each ${P.oilRemoval.length_m} x ${P.oilRemoval.width_m} x ${P.oilRemoval.depth_m} m, HRT ${P.oilRemoval.hrt_min} min
CPI: ${P.oilRemoval.cpiPlates} plates per unit, ${P.oilRemoval.cpiArea_m2} m2
DAF: ${P.oilRemoval.dafUnits} units, ${P.oilRemoval.dafArea_m2} m2 total, recycle ${P.oilRemoval.dafRecycle_m3h} m3/h at 5.5 atm
Equalisation: ${P.equalisation.volume_m3} m3 in ${P.equalisation.tanks} tanks, ${P.equalisation.hrt_h} h, D ${P.equalisation.diameter_m} m x H ${P.equalisation.height_m.toFixed(1)} m
Biological: BOD load ${P.biological.bodLoad_kgd} kg/d, SRT ${P.biological.srt_d} d, Yobs ${P.biological.yObs}, sludge ${P.biological.sludge_kgd} kg/d, MLSS ${P.biological.mlss} mg/L, F/M ${P.biological.fm}, volume ${P.biological.volume_m3} m3, HRT ${P.biological.hrt_h} h, AOR ${P.biological.aor_kgh} kg/h, SOTR ${P.biological.sotr_kgh} kg/h, air ${P.biological.air_m3h} m3/h, ${P.biological.blowers} blowers at ${P.biological.blowerFlow_m3h} m3/h x ${P.biological.blowerPower_kW} kW
Clarifier: ${P.clarifier.units} x D ${P.clarifier.diameter_m} m, SOR ${P.clarifier.sor_m_h} m/h, solids loading ${P.clarifier.solidsLoading} kg/m2h, RAS ${P.clarifier.ras_m3h} m3/h
Filtration: ${P.filtration.units} x D ${P.filtration.diameter_m} m multimedia at ${P.filtration.rate_m_h} m/h, plus 2 GAC adsorbers
UF: ${P.membrane.ufModules} modules, ${P.membrane.ufArea_m2} m2, ${P.membrane.ufSkids} skids
RO: ${P.membrane.roRecovery * 100}% recovery, permeate ${P.membrane.roPermeate} m3/h, reject ${P.membrane.roReject} m3/h, ${P.membrane.roElements} elements, ${P.membrane.roArea_m2} m2 at ${P.membrane.roFlux} L/m2h, feed pressure ${P.membrane.roFeedPressure_bar} bar, HP pump ${P.membrane.hpPump_kW} kW  Evaporation pond (Option 2): ${haWithSqm(P.evaporation.areaWithFreeboard_ha)} at ${P.evaporation.netEvap_m_yr} m/yr net evaporation
ZLD (Option 3): concentrator ${P.zld.concentrator_kW} kW, crystalliser ${P.zld.crystalliser_kW} kW, ${P.zld.steam_t_h} t/h steam, ${P.zld.solids_t_d} t/d salt
Sludge: ${P.sludge.total_dry_kgd} kg/d dry, ${P.sludge.cake_t_d} t/d cake at 25% DS
Chemicals: H2O2 ${P.chemical.h2o2_kgd} kg/d, coagulant ${P.chemical.coagulant_kgd} kg/d, polymer ${P.chemical.polymer_kgd} kg/d, nutrient P ${P.chemical.nutrientP_kgd} kg/d, antiscalant ${P.chemical.antiscalant_kgd} kg/d
Electrical: installed ${loadSummary.installed.toFixed(0)} kW, demand ${loadSummary.demand.toFixed(0)} kW, MV ${loadSummary.mvLoad.toFixed(0)} kW at 3.3 kV, transformer ${loadSummary.transformer_kVA} kVA

# PLOT LAYOUT AND AREAS (square metres)
${layout}

# BULK DISCIPLINES (piping, valves, instruments, electrical, insulation, racks)
Piping: ${pipingSummary.lines} lines, ${Math.round(pipingSummary.length_m)} m, ${pipingSummary.pipe_t} t of pipe, ${pipingSummary.fittings_t} t fittings, ${pipingSummary.flanges} flanges/gaskets, ${pipingSummary.bolts} bolts, ${pipingSummary.supports} supports, ${Math.round(pipingSummary.paint_m2)} m2 paint, ${Math.round(pipingSummary.insulation_m2)} m2 insulation. Largest line ${pipingSummary.largest_line}, heaviest ${pipingSummary.heaviest_line} at ${pipingSummary.heaviest_t} t. By size: ${pipeBySize.map((p) => `${p.nps}" ${Math.round(p.length_m)} m (${p.pipe_t} t)`).join("; ")}.
Valves: ${valveTotals.qty} off in ${valveTotals.types} types, ${valveTotals.actuated} actuated / ${valveTotals.manual} manual, ${valveTotals.control} control valves, ${valveTotals.psv} PSVs. ${valveSchedule.map((v) => `${v.type} ${v.qty}`).join(", ")}.
Instruments: ${ioSummary.wiredQty + ioSummary.localQty} field devices, ${ioSummary.total} wired I/O (AI ${ioSummary.AI}, AO ${ioSummary.AO}, DI ${ioSummary.DI}, DO ${ioSummary.DO}) against ${ioSummary.capacity} available PCS I/O (${ioSummary.spare_pct} % spare), ${ioSummary.sil2} SIL 2, ${ioSummary.exRated} Ex-rated, ${ioSummary.localQty} local gauges not wired. By area: ${instrumentsByArea.map((a) => `Area ${a.area} ${a.tags} tags / ${a.qty} off`).join("; ")}.
Electrical: ${motorSummary.count} motors, ${motorSummary.installed_kW} kW connected (${motorSummary.base_kW} kW base excluding the Option 3 ZLD train), ${motorSummary.mvCount} MV at 3.3 kV, ${motorSummary.vfd} VFD. Duty demand ${powerSummary.demand_kW} kW / ${powerSummary.demand_kVA} kVA, transformer TR-9901 ${powerSummary.transformer_kVA} kVA at ${powerSummary.loading_pct} % loading, ${powerSummary.annual_MWh} MWh/yr. Cable tray ${trayFill.tray} at ${trayFill.fill_pct} % fill. Largest feeder ${motorSummary.largest_tag} ${motorSummary.largest_kW} kW. Motors: ${motors.map((m) => `${m.tag} ${m.kw} kW x${m.qty} ${m.volts} V ${m.starter} ${m.cable}`).join("; ")}.
Insulation: ${Math.round(insulationSummary.area_m2)} m2 of insulation on ${insulationSummary.items} items (${insulationSummary.hotArea_m2} m2 hot, ${insulationSummary.coldArea_m2} m2 cold/personnel), ${Math.round(insulationSummary.jacketing_m2)} m2 jacketing, ${Math.round(insulationSummary.mass_kg)} kg of insulation; bare piping paint area ${paintArea.piping_m2} m2.
Piperacks and model: ${partCounts.racks} racks totalling ${Math.round(partCounts.rackLength_m)} m, ${bulkTotals.rack_t} t of rack steel; the 3D model carries ${partCounts.total} items (${partCounts.equipment} equipment, ${partCounts.piping} pipe runs, ${partCounts.valves} valve markers, ${partCounts.instruments} instrument stands, ${partCounts.motors} motors, ${partCounts.insulation} insulated surfaces).
Bulk calculation sheets: ${bulkSheets.map((s) => `${s.id} ${s.title}`).join("; ")}. Open checks in the bulk sheets: ${bulkTotals.open}.

# CALCULATION SHEETS AVAILABLE
${sheets}

# OPTIONS
${treatmentOptions.map((o) => `${o.name}: ${o.basis}`).join("\n")}

# COST
${costs}
Life-cycle PV factor over 20 years at 8% = ${PV_FACTOR.toFixed(3)}
AACE Class 4 accuracy +/-25%.

# EQUIPMENT REGISTER (${equipmentSummary.count} tags, ${equipmentSummary.makeCount} make / ${equipmentSummary.buyCount} buy)
${eqList}

# MAKE / BUY
RAMSIS Engineering (Bahrain) is on the MRC approved vendor list as a NON-GOVERNING vendor for manufactured process equipment (columns, pressure vessels, exchangers, heaters, air coolers). Non-governing means contractor selection is permitted without further MRC approval. All pressure equipment manufacturers must hold a valid ASME U-stamp.
Make scope MTO: ${mtoTotals.total_t} t, ${mtoTotals.manhours.toLocaleString()} h, fabrication value USD ${fabrication.total.toLocaleString()}.
Plate: ${mtoTotals.byGrade.map((g) => `${g.grade} ${g.tonnes} t`).join(", ")}.

# APPROVED VENDOR LIST RULES
${avlRules.map((r) => `${r.rule}: "${r.quote}"`).join("\n")}

# AVL COVERAGE
${avlCategories.map((c) => `${c.equipment} [${c.governing ? "GOVERNING" : "non-governing"}] (${c.confidence} confidence): ${c.vendors.map((v) => `${v.name} (${v.hq})`).join(", ")}`).join("\n")}

# NOT ON THE AVL - RECOMMENDED FOR MRC APPROVAL
${unlistedCategories.map((u) => `${u.equipment}: recommendation = ${u.recommendation}. ${u.reasoning}`).join("\n")}

# OPEN CLARIFICATIONS
${clarifications.map((c) => `${c.id} [${c.severity}] ${c.subject}: ${c.issue} Proposal: ${c.proposal}`).join("\n")}

# OUTLET LIMITS (Option 1, river)
${riverLimits.filter((r) => r.numeric !== null).map((r) => `${r.parameter} <= ${r.limit} ${r.unit}`).join("; ")}
# REUSE LIMITS (Option 2)
${reuseLimits.map((r) => `${r.parameter} <= ${r.limit} ${r.unit}`).join("; ")}
`;
}

export const SYSTEM_PROMPT = `You are the engineering assistant for the ${"B047"} Diwanya Refinery Waste Water Treatment System package, working for RAMSIS Engineering (Bahrain) on behalf of Al Barham Group.

Rules:
- Answer strictly from the PROJECT CONTEXT provided. If something is not in it, say so and state what input you would need.
- Never invent a vendor, a standard clause, a price or a limit. If you estimate, label it as an engineering judgement and say what it is based on.
- Quote document numbers and clause references when you rely on the design basis, the RFQ or the hazardous area drawing.
- Be concise and technical. Use m3/h, mg/L, kW, bar, mm. Use short paragraphs or tight bullets, never long essays.
- When a question touches a contractual contradiction, point to the open clarification (CL-00x) instead of inventing a resolution.
- You may write calculation formulas and table-style comparisons in plain text or markdown.
- If asked to draft a clarification, an RFQ query or a vendor justification, produce something that could be issued today: reference, background, the question, and the requested response date.`;
