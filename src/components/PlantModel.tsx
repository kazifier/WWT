"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { parts, plot, plotArea_m2, zoneColor, type Zone } from "@/lib/plantLayout";
import { DimContext, GroundRect, DimLabel } from "@/components/Dim3";
import { CanvasBoundary } from "@/components/CanvasBoundary";
import {
  Tank,
  Basin,
  Clarifier,
  Rack,
  RackFrame,
  Building,
  Pump,
  Mixer,
  HeatExchanger,
  ElectricalPanel,
  CableTray,
  LightningTower,
  ControlPanel,
  LocalControlPanel,
  InstrumentPanel,
  PipeRack,
  PipeFrame,
  Insulation,
  Painting,
  PipeRun,
  Valve,
  Instrument,
  Motor,
} from "@/components/EquipmentViewer";

export default function PlantModel() {
  const [showZones, setShowZones] = useState(true);
  const [dims, setDims] = useState(false);
  const [option3, setOption3] = useState(false);

  // Every modelled item is drawn. The Option 3 toggle only controls whether the
  // ZLD block of area 95 is included, so the header count always matches the
  // register instead of silently dropping piping and instrument items.
  const visible = useMemo(
    () => (option3 ? parts : parts.filter((p) => p.area !== "95")),
    [option3],
  );

  const dimValue = useMemo(() => ({ lines: dims, text: dims }), [dims]);

  return (
    <CanvasBoundary label="Overall 3D model" height="70vh">
    <div className="relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-xl border border-line bg-ink-900">
      <Canvas camera={{ position: [150, 110, 160], fov: 38 }} shadows dpr={[1, 2]}>
        <color attach="background" args={["#070d10"]} />
        <fog attach="fog" args={["#070d10", 260, 520]} />

        <hemisphereLight args={["#8fb9c9", "#0a1114", 0.85]} />
        <directionalLight
          position={[120, 180, 90]}
          intensity={1.35}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-140}
          shadow-camera-right={140}
          shadow-camera-top={140}
          shadow-camera-bottom={-140}
        />
        <directionalLight position={[-90, 60, -80]} intensity={0.35} color="#5d8ea3" />

        {/* ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[900, 900]} />
          <meshStandardMaterial color="#0a1317" />
        </mesh>
        <Grid
          args={[400, 400]}
          cellSize={5}
          cellThickness={0.4}
          cellColor="#15252c"
          sectionSize={25}
          sectionThickness={0.9}
          sectionColor="#1e3a44"
          fadeDistance={460}
          position={[0, 0, 0]}
        />

        {/* plot boundary, always on */}
        <GroundRect x={0} z={0} w={plot.w} d={plot.d} />

        {dims && (
          <>
            <DimLabel position={[0, 0.05, plot.zMin - 7]}>{`${plot.w.toFixed(1)} m overall`}</DimLabel>
            <DimLabel position={[plot.xMax + 9, 0.05, 0]}>{`${plot.d.toFixed(1)} m overall`}</DimLabel>
          </>
        )}

        <DimContext.Provider value={dimValue}>
          {visible.map((p) => (
            <group key={p.id} position={[p.x, p.y0 ?? 0, p.z]}>
              {p.kind === "tank" && <Tank p={p} />}
              {p.kind === "basin" && <Basin p={p} />}
              {p.kind === "clarifier" && <Clarifier p={p} />}
              {p.kind === "rack" && <Rack p={p} />}
              {p.kind === "rack-frame" && <RackFrame p={p} />}
              {p.kind === "building" && <Building p={p} />}
              {p.kind === "pump" && <Pump p={p} />}
              {p.kind === "mixer" && <Mixer p={p} />}
              {p.kind === "heat-exchanger" && <HeatExchanger p={p} />}
              {p.kind === "electrical" && <ElectricalPanel p={p} />}
              {p.kind === "cable-tray" && <CableTray p={p} />}
              {p.kind === "lightning" && <LightningTower p={p} />}
              {p.kind === "control-panel" && <ControlPanel p={p} />}
              {p.kind === "local-control-panel" && <LocalControlPanel p={p} />}
              {p.kind === "instrument-panel" && <InstrumentPanel p={p} />}
              {p.kind === "pipe-rack" && <PipeRack p={p} />}
              {p.kind === "pipe-frame" && <PipeFrame p={p} />}
              {p.kind === "insulation" && <Insulation p={p} />}
              {p.kind === "painting" && <Painting p={p} />}
              {p.kind === "pipe" && <PipeRun p={p} />}
              {p.kind === "valve" && <Valve p={p} />}
              {p.kind === "instrument" && <Instrument p={p} />}
              {p.kind === "motor" && <Motor p={p} />}
            </group>
          ))}
        </DimContext.Provider>

        <OrbitControls
          maxPolarAngle={Math.PI / 2.05}
          minDistance={30}
          maxDistance={420}
          target={[0, 6, 0]}
          enableDamping
        />
      </Canvas>

      {/* DOM overlays live outside <Canvas>: the R3F reconciler cannot host
          divs, and doing so previously crashed the whole page. */}
      {showZones && (
        <div className="pointer-events-none absolute left-3 top-3 space-y-1.5 rounded-lg border border-line bg-ink-950/85 p-3 text-[10px]">
          <div className="font-semibold uppercase tracking-[0.14em] text-mist-400">Zones</div>
          {(
            [
              ["Zone 0", "Zone 0 — hazardous"],
              ["Zone 1", "Zone 1 — hazardous"],
              ["Zone 2", "Zone 2 — hazardous"],
              ["Unclassified", "Unclassified / utilities"],
            ] as [Zone, string][]
          ).map(([z, name]) => (
            <div key={z} className="flex items-center gap-2">
              <span className="inline-block h-2 w-4 rounded-sm" style={{ background: zoneColor[z] }} />
              <span className="text-mist-300">{name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
        <button
          onClick={() => setShowZones((v) => !v)}
          className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${showZones ? "border-teal-500 bg-teal-500/15 text-teal-300" : "border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"}`}
        >
          Zone overlay
        </button>
        <button
          onClick={() => setDims((v) => !v)}
          className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${dims ? "border-amber-l bg-amber-l/15 text-amber-l" : "border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"}`}
        >
          Dimensions
        </button>
        <button
          onClick={() => setOption3((v) => !v)}
          className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${option3 ? "border-rust bg-rust/15 text-rust" : "border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"}`}
        >
          Option 3 ZLD
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-mist-400">
        Drag to orbit · scroll to zoom · grid = 5 m, heavy grid = 25 m
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-[10px] text-mist-400">
        Plot {plot.w.toFixed(0)} × {plot.d.toFixed(0)} m ({plotArea_m2.toLocaleString("en-US")} m²) ·{" "}
        {visible.length} items
      </div>
    </div>
    </CanvasBoundary>
  );
}
