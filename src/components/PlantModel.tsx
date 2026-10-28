"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { parts, plot, plotArea_m2, zoneColor } from "@/lib/plantLayout";
import { DimContext, GroundRect, DimLabel, ProjectionBridge } from "@/components/Dim3";
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
} from "@/components/EquipmentViewer";

export default function PlantModel() {
  const [showZones, setShowZones] = useState(true);
  const [labels, setLabels] = useState(true);
  const [dims, setDims] = useState(false);
  const [option3, setOption3] = useState(false);

  const visible = useMemo(
    () => (option3 ? parts : parts.filter((p) => p.area !== "95")),
    [option3],
  );

  const dimValue = useMemo(() => ({ lines: dims, text: dims }), [dims]);

  return (
    <div className="relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-xl border border-line bg-ink-900">
      <Canvas
        camera={{ position: [150, 110, 160], fov: 38 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={["#070d10"]} />
        <fog attach="fog" args={["#070d10", 260, 520]} />

        <ProjectionBridge />

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
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.05, 0]}
          receiveShadow
        >
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
            <DimLabel position={[0, 0.05, plot.zMin - 7]}>
              <div className="rounded border border-amber-l/40 bg-ink-950/90 px-1.5 py-0.5 text-[9.5px] font-semibold text-amber-l">
                {plot.w.toFixed(2)} m overall
              </div>
            </DimLabel>
            <DimLabel position={[plot.xMax + 9, 0.05, 0]}>
              <div className="rounded border border-amber-l/40 bg-ink-950/90 px-1.5 py-0.5 text-[9.5px] font-semibold text-amber-l">
                {plot.d.toFixed(2)} m overall
              </div>
            </DimLabel>
          </>
        )}

        <DimContext.Provider value={dimValue}>
          {visible.map((p) => (
            <group key={p.id}>
              <group position={[p.x, 0, p.z]}>
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
              </group>

              {/* zone ring */}
              {showZones && (
                <mesh
                  position={[p.x, 0.06, p.z]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <ringGeometry args={[Math.max(p.w, p.d) / 2 + 1.2, Math.max(p.w, p.d) / 2 + 1.7, 48]} />
                  <meshBasicMaterial
                    color={zoneColor[p.zone]}
                    transparent
                    opacity={0.85}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}

              {labels && (
                <DimLabel position={[p.x, p.h + 2.6, p.z]}>
                  <div
                    className="pointer-events-none whitespace-nowrap rounded border px-1.5 py-[1px] text-[9.5px] font-semibold backdrop-blur-sm"
                    style={{
                      borderColor: zoneColor[p.zone],
                      background: "rgba(7,13,16,0.82)",
                      color: zoneColor[p.zone],
                    }}
                  >
                    {p.id} {p.label}
                  </div>
                </DimLabel>
              )}
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

      {/* legend */}
      <div className="pointer-events-none absolute left-3 top-3 space-y-1.5 rounded-lg border border-line bg-ink-950/85 p-3 text-[10px]">
        <div className="font-semibold uppercase tracking-[0.14em] text-mist-400">
          Zones
        </div>
        {(
          [
            ["Zone 0", "Zone 0 — hazardous"],
            ["Zone 1", "Zone 1 — hazardous"],
            ["Zone 2", "Zone 2 — hazardous"],
            ["Unclassified", "Unclassified / utilities"],
          ] as const
        ).map(([z, name]) => (
          <div key={z} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-4 rounded-sm"
              style={{ background: zoneColor[z] }}
            />
            <span className="text-mist-300">{name}</span>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
        <button
          onClick={() => setShowZones((v) => !v)}
          className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${
            showZones
              ? "border-teal-500 bg-teal-500/15 text-teal-300"
              : "border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"
          }`}
        >
          Zone overlay
        </button>
        <button
          onClick={() => setLabels((v) => !v)}
          className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${
            labels
              ? "border-teal-500 bg-teal-500/15 text-teal-300"
              : "border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"
          }`}
        >
          Tags
        </button>
        <button
          onClick={() => setDims((v) => !v)}
          className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${
            dims
              ? "border-amber-l bg-amber-l/15 text-amber-l"
              : "border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"
          }`}
        >
          Dimensions
        </button>
        <button
          onClick={() => setOption3((v) => !v)}
          className={`rounded border px-2.5 py-1 text-[10.5px] transition-colors ${
            option3
              ? "border-rust bg-rust/15 text-rust"
              : "border-line bg-ink-950/80 text-mist-400 hover:text-mist-200"
          }`}
        >
          Option 3 ZLD
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-mist-400">
        Drag to orbit · scroll to zoom · grid = 5 m, heavy grid = 25 m
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-[10px] text-mist-400">
        Plot {plot.w.toFixed(0)} × {plot.d.toFixed(0)} m ({plotArea_m2.toLocaleString("en-US")} m²) · {visible.length} items
      </div>
    </div>
  );
}