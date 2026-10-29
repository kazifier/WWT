/** Equipment Viewer for B047 WWT Facility

 * Single-item 3D viewer displaying equipment from the equipment register.
 * Each geometry is built from dimensions in the PlantPart interface.
 * The drawing includes dimension callouts (Ø, width, depth, height) and
 * zone color coding from the hazardous area classification.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Edges } from "@react-three/drei";
import * as THREE from "three";
import { zoneColor, type PlantPart } from "@/lib/plantLayout";
import { Dim, DimContext } from "@/components/Dim3";
import { CanvasBoundary } from "@/components/CanvasBoundary";

export function Tank({ p }: { p: PlantPart }) {
  return (
    <group>
      <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[p.w / 2, p.w / 2, p.h, 48]} />
        <meshStandardMaterial color={p.color} metalness={0.35} roughness={0.55} />
      </mesh>
      {/* cone roof */}
      <mesh position={[0, p.h + p.w / 14, 0]}>
        <coneGeometry args={[p.w / 2, p.w / 7, 48]} />
        <meshStandardMaterial color={p.color} metalness={0.3} roughness={0.6} />
      </mesh>
      <Edges color="#6fe0d1" threshold={20} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`Ø ${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0, -p.d / 2]} to={[p.w / 2 + 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function Basin({ p }: { p: PlantPart }) {
  const wall = 0.6;
  return (
    <group>
      <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w, p.h, p.d]} />
        <meshStandardMaterial color={p.color} metalness={0.15} roughness={0.8} transparent opacity={0.6} />
      </mesh>
      <Edges color={zoneColor[p.zone]} threshold={15} />
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[p.w + wall, 0.3, p.d + wall]} />
        <meshStandardMaterial color="#20343d" />
      </mesh>
      {/* baffles so a basin reads as a basin, not a solid block */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i * p.w) / 4, p.h / 2, 0]}>
          <boxGeometry args={[0.15, p.h * 0.8, p.d]} />
          <meshStandardMaterial color="#3d5a66" />
        </mesh>
      ))}
      <Dim from={[-p.w / 2, 0.04, -p.d / 2 - 2.5]} to={[p.w / 2, 0.04, -p.d / 2 - 2.5]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2.5, 0.04, -p.d / 2]} to={[p.w / 2 + 2.5, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2.5, 0, p.d / 2 + 1.5]} to={[p.w / 2 + 2.5, p.h, p.d / 2 + 1.5]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function Clarifier({ p }: { p: PlantPart }) {
  return (
    <group>
      <mesh position={[0, p.h / 2, 0]} castShadow>
        <cylinderGeometry args={[p.w / 2, p.w / 2, p.h, 64, 1, true]} />
        <meshStandardMaterial color={p.color} metalness={0.1} roughness={0.8} side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
      <Edges color={zoneColor[p.zone]} threshold={20} />
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[p.w / 2, p.w / 2 - 1, 0.16, 64]} />
        <meshStandardMaterial color="#20343d" />
      </mesh>
      {/* scraper bridge across the full diameter */}
      <mesh position={[0, p.h + 0.3, 0]} rotation={[0, Math.PI / 6, 0]}>
        <boxGeometry args={[p.w, 0.35, 0.7]} />
        <meshStandardMaterial color="#425e6a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* centre drive pier */}
      <mesh position={[0, p.h + 1.1, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 2.2, 24]} />
        <meshStandardMaterial color={zoneColor["Zone 2"]} metalness={0.4} />
      </mesh>
      {/* effluent weir ring */}
      <mesh position={[0, p.h - 0.5, 0]}>
        <torusGeometry args={[p.w / 2 - 0.8, 0.12, 8, 64]} />
        <meshStandardMaterial color="#6fe0d1" />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2.5]} to={[p.w / 2, 0.04, p.d / 2 + 2.5]} label={`Ø ${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2.5, 0, -p.d / 2]} to={[p.w / 2 + 2.5, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m wall`} />
    </group>
  );
}

export function Rack({ p }: { p: PlantPart }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[p.w, 0.3, p.d]} />
        <meshStandardMaterial color="#20343d" />
      </mesh>
      <mesh position={[0, p.h / 2 + 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w * 0.94, p.h, p.d * 0.8]} />
        <meshStandardMaterial color={p.color} metalness={0.5} roughness={0.5} />
      </mesh>
      <Edges color={zoneColor[p.zone]} threshold={15} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h + 0.3, -p.d / 2]} label={`${(p.h + 0.3).toFixed(1)} m`} />
    </group>
  );
}

export function RackFrame({ p }: { p: PlantPart }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[p.w, 0.4, p.d]} />
        <meshStandardMaterial color="#20343d" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, p.h / 2, (s * p.d) / 2]} >
          <boxGeometry args={[p.w, p.h, 0.25]} />
          <meshStandardMaterial color={p.color} metalness={0.4} roughness={0.5} transparent opacity={0.75} />
        </mesh>
      ))}
      {[1, -1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * p.w) / 2, p.h / 2, (sz * p.d) / 2]}>
            <boxGeometry args={[0.3, p.h, 0.3]} />
            <meshStandardMaterial color="#425e6a" metalness={0.5} />
          </mesh>
        ))
      )}
      {[0, 1, -1].map((i) => (
        <mesh key={i} position={[(i * p.w) / 2.5, p.h + 0.2, 0]}>
          <boxGeometry args={[0.3, 0.3, p.d]} />
          <meshStandardMaterial color="#425e6a" metalness={0.5} />
        </mesh>
      ))}
      <Dim from={[-p.w / 2, 0.04, -p.d / 2 - 2]} to={[p.w / 2, 0.04, -p.d / 2 - 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, p.d / 2]} to={[-p.w / 2 - 2, p.h, p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function Pump({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* baseplate */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[p.w * 2.5, 0.12, p.d * 2.5]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* pump body (horizontal centrifugal) */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[p.w * 0.7, p.w * 0.7, p.d * 1.2, 32]} />
        <meshStandardMaterial color={p.color} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* motor end */}
      <mesh position={[p.w * 1.1, 0.35, 0]} castShadow>
        <cylinderGeometry args={[p.w * 0.5, p.w * 0.5, p.d * 0.8, 32]} />
        <meshStandardMaterial color="#6fe0d1" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* coupling */}
      <mesh position={[p.w * 0.55, 0.35, 0]}>
        <cylinderGeometry args={[p.w * 0.15, p.w * 0.15, p.d * 0.15, 24]} />
        <meshStandardMaterial color="#425e6a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* suction/discharge piping */}
      <mesh position={[-p.w * 0.9, 0.45, p.d * 0.3]}>
        <cylinderGeometry args={[0.08, 0.08, p.w * 0.8, 24]} />
        <meshStandardMaterial color="#7f9aa6" metalness={0.5} />
      </mesh>
      <Edges color={zoneColor[p.zone]} threshold={20} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function Mixer({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* baseplate */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[p.w * 2, 0.12, p.d * 2]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* motor */}
      <mesh position={[-p.w * 0.5, 0.5, 0]} castShadow>
        <cylinderGeometry args={[p.w * 0.4, p.w * 0.4, p.d * 0.6, 32]} />
        <meshStandardMaterial color="#6fe0d1" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* shaft */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, p.w * 1.2, 16]} />
        <meshStandardMaterial color="#425e6a" metalness={0.5} />
      </mesh>
      {/* impeller blades */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.5, 0]} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <boxGeometry args={[p.w * 0.8, 0.03, 0.08]} />
          <meshStandardMaterial color="#2ccbb8" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}
      <Edges color={zoneColor[p.zone]} threshold={20} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function HeatExchanger({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* shell */}
      <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[p.w / 2, p.w / 2, p.d, 48]} />
        <meshStandardMaterial color={p.color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* tube bundle end */}
      <mesh position={[p.w * 0.6, p.h * 0.5, 0]}>
        <boxGeometry args={[p.w * 0.2, p.h * 0.7, p.d * 0.7]} />
        <meshStandardMaterial color="#425e6a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* channel/head */}
      <mesh position={[-p.w * 0.55, p.h * 0.5, 0]}>
        <cylinderGeometry args={[p.w * 0.2, p.w * 0.2, p.d * 0.85, 32]} />
        <meshStandardMaterial color="#7f9aa6" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* nozzles */}
      <mesh position={[-p.w * 0.85, p.h * 0.15, 0]}>
        <cylinderGeometry args={[0.1, 0.1, p.d * 0.2, 24]} />
        <meshStandardMaterial color="#7f9aa6" />
      </mesh>
      <mesh position={[p.w * 0.8, p.h * 0.15, 0]}>
        <cylinderGeometry args={[0.1, 0.1, p.d * 0.2, 24]} />
        <meshStandardMaterial color="#7f9aa6" />
      </mesh>
      <Edges color={zoneColor[p.zone]} threshold={15} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`Ø ${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0, -p.d / 2]} to={[p.w / 2 + 2, 0, p.d / 2]} label={`${p.d.toFixed(1)} m shell`} />
      <Dim from={[p.w / 2 + 2, 0, p.d / 2 + 1.5]} to={[p.w / 2 + 2, p.h, p.d / 2 + 1.5]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function ElectricalPanel({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[p.w, 0.1, p.d]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* cabinet body */}
      <mesh position={[0, p.h / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w * 0.9, p.h, p.d * 0.85]} />
        <meshStandardMaterial color={p.color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* door line */}
      <mesh position={[0, p.h / 2 + 0.1, p.d * 0.42]}>
        <boxGeometry args={[p.w * 0.85, p.h, 0.02]} />
        <meshStandardMaterial color="#0f1a20" />
      </mesh>
      {/* name plate */}
      <mesh position={[-p.w * 0.3, p.h / 2 + 0.1, p.d * 0.425]} >
        <boxGeometry args={[p.w * 0.3, p.h * 0.2, 0.01]} />
        <meshStandardMaterial color="#e0a94a" emissive="#e0a94a" emissiveIntensity={0.1} />
      </mesh>
      {/* ventilation slots */}
      <mesh position={[p.w * 0.3, p.h * 0.75, p.d * 0.42]}>
        <boxGeometry args={[p.w * 0.25, 0.08, 0.06]} />
        <meshStandardMaterial color="#0f1a20" />
      </mesh>
      {/* instrument panel on door */}
      <mesh position={[p.w * 0.5, p.h / 2 + 0.15, p.d * 0.42]}>
        <boxGeometry args={[p.w * 0.15, p.h * 0.1, 0.01]} />
        <meshStandardMaterial color="#e0a94a" />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h + 0.1, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function Transformer({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* base pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[p.w + 2, 0.1, p.d + 2]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* main tank */}
      <mesh position={[0, p.h / 2 + 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[p.w / 2, p.w / 2, p.d, 48]} />
        <meshStandardMaterial color={p.color} metalness={0.2} roughness={0.8} />
      </mesh>
      {/* conservator tank */}
      <mesh position={[0, p.h / 2 + 0.1 + p.d * 0.3, 0]}>
        <cylinderGeometry args={[p.w * 0.3, p.w * 0.3, p.d * 0.4, 32]} />
        <meshStandardMaterial color="#7f9aa6" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* bushings */}
      <mesh position={[p.w / 3, p.h / 2 + 0.1 + p.d * 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.08, p.d * 0.4, 24]} />
        <meshStandardMaterial color="#e0a94a" />
      </mesh>
      {/* oil drainage pan */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[p.w / 2 + 0.5, p.w / 2 + 0.5, 0.4, 48]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      <Edges color="#6fe0d1" threshold={15} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`Ø ${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0, -p.d / 2]} to={[p.w / 2 + 2, 0, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function CableTray({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* tray supports */}
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[s * (p.w / 2 - 2), 0.12, 0]} castShadow>
            <boxGeometry args={[0.08, p.h, 0.08]} />
            <meshStandardMaterial color="#425e6a" metalness={0.5} />
          </mesh>
          <mesh position={[s * (p.w / 2 - 2), p.h / 2, 0]}>
            <boxGeometry args={[p.w * 0.04, 0.04, p.d]} />
            <meshStandardMaterial color="#425e6a" metalness={0.5} />
          </mesh>
        </group>
      ))}
      {/* cable tray */}
      <mesh position={[0, p.h / 2, 0]}>
        <boxGeometry args={[p.w, 0.06, p.d]} />
        <meshStandardMaterial color={p.color} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* cables inside */}
      <mesh position={[0, p.h / 2, p.d * 0.25]}>
        <cylinderGeometry args={[0.02, 0.02, p.w * 0.92, 16]} />
        <meshStandardMaterial color="#6fe0d1" />
      </mesh>
      <mesh position={[0, p.h / 2, p.d * 0.5]}>
        <cylinderGeometry args={[0.02, 0.02, p.w * 0.92, 16]} />
        <meshStandardMaterial color="#2ccbb8" />
      </mesh>
      <mesh position={[0, p.h / 2, p.d * 0.75]}>
        <cylinderGeometry args={[0.02, 0.02, p.w * 0.92, 16]} />
        <meshStandardMaterial color="#7f9aa6" />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m run`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m height`} />
    </group>
  );
}

export function LightningTower({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[p.w * 0.6, p.w * 0.6, 0.2, 24]} />
        <meshStandardMaterial color="#425e6a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* tower legs */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * p.w * 0.25, 0.16 + p.h / 2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, p.h - 0.4, 16]} />
          <meshStandardMaterial color="#425e6a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* cross braces */}
      <mesh position={[0, p.h * 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, Math.sqrt((p.w * 0.5) ** 2 + (p.h * 0.4) ** 2)]} />
        <meshStandardMaterial color="#425e6a" metalness={0.5} />
      </mesh>
      {/* air terminal (lightning rod top) */}
      <mesh position={[0, p.h, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 16]} />
        <meshStandardMaterial color="#d2703f" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, p.h + 0.4, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#d2703f" metalness={0.6} roughness={0.3} />
      </mesh>
      <Edges color="#d2703f" threshold={20} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m base`} />
      <Dim from={[p.w / 2 + 2, 0, -p.d / 2]} to={[p.w / 2 + 2, 0, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[0, 0, p.d / 2 + 2]} to={[0, p.h, p.d / 2 + 2]} label={`${p.h.toFixed(1)} m height`} />
    </group>
  );
}

export function Building({ p }: { p: PlantPart }) {
  return (
    <group>
      <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w, p.h, p.d]} />
        <meshStandardMaterial color={p.color} roughness={0.7} />
      </mesh>
      <Edges color="#6fe0d1" threshold={15} />
      <mesh position={[0, p.h + 0.15, 0]}>
        <boxGeometry args={[p.w + 0.4, 0.3, p.d + 0.4]} />
        <meshStandardMaterial color="#2a4049" />
      </mesh>
      <mesh position={[-p.w / 4, 1.1, p.d / 2 + 0.02]}>
        <boxGeometry args={[1.4, 2.2, 0.1]} />
        <meshStandardMaterial color="#6fe0d1" emissive="#6fe0d1" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[p.w / 4, p.h * 0.6, p.d / 2 + 0.02]}>
        <boxGeometry args={[p.w / 3, 1.4, 0.1]} />
        <meshStandardMaterial color="#2ccbb8" emissive="#2ccbb8" emissiveIntensity={0.2} />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function ControlPanel({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[p.w, 0.1, p.d]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* cabinet */}
      <mesh position={[0, p.h / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w * 0.9, p.h, p.d * 0.85]} />
        <meshStandardMaterial color={p.color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* door with window */}
      <mesh position={[0, p.h / 2 + 0.1, p.d * 0.42]}>
        <boxGeometry args={[p.w * 0.85, p.h, 0.02]} />
        <meshStandardMaterial color="#0f1a20" />
      </mesh>
      {/* name plate */}
      <mesh position={[-p.w * 0.3, p.h / 2 + 0.1, p.d * 0.425]} >
        <boxGeometry args={[p.w * 0.3, p.h * 0.2, 0.01]} />
        <meshStandardMaterial color="#e0a94a" emissive="#e0a94a" emissiveIntensity={0.1} />
      </mesh>
      {/* ventilation slots */}
      <mesh position={[p.w * 0.3, p.h * 0.75, p.d * 0.42]}>
        <boxGeometry args={[p.w * 0.25, 0.08, 0.06]} />
        <meshStandardMaterial color="#0f1a20" />
      </mesh>
      {/* instrument panel on door */}
      <mesh position={[p.w * 0.5, p.h / 2 + 0.15, p.d * 0.42]}>
        <boxGeometry args={[p.w * 0.15, p.h * 0.1, 0.01]} />
        <meshStandardMaterial color="#e0a94a" />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h + 0.1, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function LocalControlPanel({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* base platform */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[p.w * 1.5, 0.1, p.d * 1.5]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* panel body */}
      <mesh position={[0, p.h / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w * 0.8, p.h * 0.6, p.d * 0.7]} />
        <meshStandardMaterial color={p.color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* door */}
      <mesh position={[0, p.h / 2 + 0.1, p.d * 0.4]}>
        <boxGeometry args={[p.w * 0.6, p.h * 0.4, 0.02]} />
        <meshStandardMaterial color="#0f1a20" />
      </mesh>
      {/* indicator lights */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[p.w * 0.15, p.h * 0.3 + i * 0.2, p.d * 0.5]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#e0a94a" metalness={0.5} />
        </mesh>
      ))}
      {/* HMI display */}
      <mesh position={[p.w * 0.2, p.h / 2 + 0.3, p.d * 0.5]}>
        <boxGeometry args={[p.w * 0.2, p.h * 0.1, 0.02]} />
        <meshStandardMaterial color="#1e90ff" />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function InstrumentPanel({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[p.w, 0.1, p.d]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* instrument groups */}
      {[1, -1].map((s) => (
        <group key={s} position={[s * (p.w / 3), p.h / 2, 0]}>
          {/* flow indicator */}
          <mesh position={[0, p.h * 0.25, 0]}>
            <cylinderGeometry args={[0.08, 0.08, p.h * 0.4, 16]} />
            <meshStandardMaterial color="#2ccbb8" metalness={0.3} />
          </mesh>
          {/* level indicator */}
          <mesh position={[0, p.h * 0.5, 0]}>
            <cylinderGeometry args={[0.08, 0.08, p.h * 0.4, 16]} />
            <meshStandardMaterial color="#7f9aa6" metalness={0.3} />
          </mesh>
          {/* pressure indicator */}
          <mesh position={[0, p.h * 0.75, 0]}>
            <cylinderGeometry args={[0.08, 0.08, p.h * 0.4, 16]} />
            <meshStandardMaterial color="#425e6a" metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* panel label */}
      <mesh position={[0, p.h + 0.1, 0]}>
        <boxGeometry args={[p.w, 0.2, p.d]} />
        <meshStandardMaterial color="#1e2d37" />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function PipeRack({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* main beams */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * p.w / 2, 0.2, 0]}>
          <boxGeometry args={[0.15, 3, p.d]} />
          <meshStandardMaterial color="#2d5a70" metalness={0.5} />
        </mesh>
      ))}
      {/* cross bracing */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, p.h / 2, i * p.d / 2]}>
          <boxGeometry args={[p.w, 0.1, 0.1]} />
          <meshStandardMaterial color="#2d5a70" metalness={0.5} />
        </mesh>
      ))}
      {/* pipe supports */}
      {[1, -1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * p.w) / 4, 0.5, (sz * p.d) / 4]}>
            <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
            <meshStandardMaterial color="#425e6a" />
          </mesh>
        ))
      )}
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function PipeFrame({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* horizontal pipe */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[p.w * 0.3, p.w * 0.3, p.d * 0.5, 16]} />
        <meshStandardMaterial color={p.color} metalness={0.5} />
      </mesh>
      {/* pipe supports */}
      {[1, -1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * p.w) / 3, 0.2, (sz * p.d) / 3]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshStandardMaterial color="#425e6a" />
          </mesh>
        ))
      )}
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function Insulation({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* insulation layer on pipe */}
      {[0, -1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`ins-${sx}-${sz}`} position={[(sx * p.w) / 4, p.h / 2 + 0.1, (sz * p.d) / 4]}>
            <boxGeometry args={[p.w / 2, 0.2, p.d / 2]} />
            <meshStandardMaterial color={p.color} metalness={0.1} roughness={0.8} transparent opacity={0.6} />
          </mesh>
        ))
      )}
      {/* rock wool pattern */}
      <mesh position={[0, p.h / 2, 0]}>
        <boxGeometry args={[p.w, p.h * 0.8, p.d]} />
        <meshStandardMaterial color={p.color} metalness={0.1} roughness={0.9} transparent opacity={0.6} />
      </mesh>
      <Edges color={zoneColor[p.zone]} threshold={15} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

export function Painting({ p }: { p: PlantPart }) {
  return (
    <group>
      {/* painted structure */}
      <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.w, p.h, p.d]} />
        <meshStandardMaterial color={p.color} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* paint sheen highlight */}
      <mesh position={[0, p.h / 2, 0]}>
        <boxGeometry args={[p.w, p.h * 0.15, p.d]} />
        <meshStandardMaterial color={p.color} metalness={0.1} roughness={0.1} />
      </mesh>
      <Edges color={zoneColor[p.zone]} threshold={15} />
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 2]} to={[p.w / 2, 0.04, p.d / 2 + 2]} label={`${p.w.toFixed(1)} m`} />
      <Dim from={[p.w / 2 + 2, 0.04, -p.d / 2]} to={[p.w / 2 + 2, 0.04, p.d / 2]} label={`${p.d.toFixed(1)} m`} />
      <Dim from={[-p.w / 2 - 2, 0, -p.d / 2]} to={[-p.w / 2 - 2, p.h, -p.d / 2]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}


/* ------------------------------------------------------------------ */
/* bulk disciplines                                                    */
/* ------------------------------------------------------------------ */

/** A pipe spool drawn to the line's outside diameter, with flanges at each end. */
export function PipeRun({ p }: { p: PlantPart }) {
  const r = Math.max(p.d, 0.06) / 2;
  const flangeR = r * 1.55;
  return (
    <group>
      <mesh position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, p.w, 24]} />
        <meshStandardMaterial color={p.color} metalness={0.6} roughness={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (p.w - 0.12)) / 2, r, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[flangeR, flangeR, 0.12, 24]} />
          <meshStandardMaterial color="#7f9aa6" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <Dim from={[-p.w / 2, 0.04, -p.d - 1.2]} to={[p.w / 2, 0.04, -p.d - 1.2]} label={`${p.w.toFixed(1)} m run`} />
      <Dim from={[p.w / 2 + 1.5, 0, 0]} to={[p.w / 2 + 1.5, p.d, 0]} label={`Ø ${(p.d * 1000).toFixed(0)} mm`} />
    </group>
  );
}

/** Gate / globe / check valve body with a handwheel or actuator. */
export function Valve({ p }: { p: PlantPart }) {
  const bodyH = Math.max(p.h * 0.55, 0.35);
  return (
    <group>
      {/* body */}
      <mesh position={[0, bodyH / 2 + p.h * 0.15, 0]} castShadow>
        <sphereGeometry args={[p.w / 2, 20, 16]} />
        <meshStandardMaterial color={p.color} metalness={0.55} roughness={0.45} />
      </mesh>
      {/* stem */}
      <mesh position={[0, bodyH + p.h * 0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.04, p.h * 0.5, 12]} />
        <meshStandardMaterial color="#7f9aa6" metalness={0.6} />
      </mesh>
      {/* handwheel or actuator */}
      <mesh position={[0, bodyH + p.h * 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[Math.max(p.w * 0.42, 0.18), 0.04, 10, 24]} />
        <meshStandardMaterial color="#d2703f" metalness={0.4} />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 1.6]} to={[p.w / 2, 0.04, p.d / 2 + 1.6]} label={`${p.w.toFixed(2)} m`} />
      <Dim from={[p.w / 2 + 1.2, 0, 0]} to={[p.w / 2 + 1.2, p.h, 0]} label={`${p.h.toFixed(2)} m`} />
    </group>
  );
}

/** Field instrument: stand, transmitter housing and impulse connection. */
export function Instrument({ p }: { p: PlantPart }) {
  return (
    <group>
      <mesh position={[0, p.h * 0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, p.h * 0.6, 12]} />
        <meshStandardMaterial color="#7f9aa6" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, p.h * 0.78, 0]} castShadow>
        <cylinderGeometry args={[p.w * 0.45, p.w * 0.45, 0.34, 20]} />
        <meshStandardMaterial color={p.color} metalness={0.35} roughness={0.6} />
      </mesh>
      <mesh position={[0, p.h * 0.78, p.d * 0.45]}>
        <boxGeometry args={[p.w * 0.42, 0.16, 0.05]} />
        <meshStandardMaterial color="#cfdde3" emissive="#6fe0d1" emissiveIntensity={0.2} />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 1]} to={[p.w / 2, 0.04, p.d / 2 + 1]} label={`Ø ${(p.w * 1000).toFixed(0)} mm`} />
      <Dim from={[p.w / 2 + 1, 0, 0]} to={[p.w / 2 + 1, p.h, 0]} label={`${p.h.toFixed(1)} m`} />
    </group>
  );
}

/** Motor: frame, cooling fins, terminal box and shaft coupling. */
export function Motor({ p }: { p: PlantPart }) {
  const r = Math.max(p.w, 0.4) / 2;
  return (
    <group>
      <mesh position={[0, p.h / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, p.h * 1.5, 24]} />
        <meshStandardMaterial color={p.color} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* cooling fins along the frame */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[(-0.6 + i * 0.17) * p.h, p.h / 2, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[r * 1.08, r * 1.08, 0.03, 20]} />
          <meshStandardMaterial color="#425e6a" metalness={0.4} />
        </mesh>
      ))}
      {/* terminal box */}
      <mesh position={[0, p.h / 2 + r * 0.92, 0]}>
        <boxGeometry args={[0.28, 0.18, 0.22]} />
        <meshStandardMaterial color="#20343e" />
      </mesh>
      {/* shaft */}
      <mesh position={[p.h * 0.78, p.h / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.22, r * 0.22, 0.3, 12]} />
        <meshStandardMaterial color="#7f9aa6" metalness={0.7} />
      </mesh>
      <Dim from={[-p.w / 2, 0.04, p.d / 2 + 1.4]} to={[p.w / 2, 0.04, p.d / 2 + 1.4]} label={`${p.w.toFixed(2)} m`} />
      <Dim from={[p.w / 2 + 1.2, 0, 0]} to={[p.w / 2 + 1.2, p.h, 0]} label={`${p.h.toFixed(2)} m`} />
    </group>
  );
}

const COMPONENTS: Partial<Record<PlantPart["kind"], (props: { p: PlantPart }) => React.JSX.Element>> = {
  tank: Tank,
  basin: Basin,
  clarifier: Clarifier,
  rack: Rack,
  "rack-frame": RackFrame,
  pump: Pump,
  mixer: Mixer,
  "heat-exchanger": HeatExchanger,
  electrical: ElectricalPanel,
  "pipe-rack": PipeRack,
  "pipe-frame": PipeFrame,
  insulation: Insulation,
  painting: Painting,
  building: Building,
  "cable-tray": CableTray,
  "control-panel": ControlPanel,
  "local-control-panel": LocalControlPanel,
  "instrument-panel": InstrumentPanel,
  lightning: LightningTower,
  pipe: PipeRun,
  valve: Valve,
  instrument: Instrument,
  motor: Motor,
};

/** Frames the camera on the item so a 4 m tank and a 55 m cable run both read. */
function CameraFit({ p }: { p: PlantPart }) {
  const { camera } = useThree();
  useEffect(() => {
    const span = Math.max(p.w, p.d, p.h, 1);
    const dist = span * 1.9 + 3;
    camera.position.set(dist * 0.85, span * 0.95 + 2, dist * 1.05);
    camera.lookAt(0, p.h * 0.45, 0);
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();
  }, [camera, p]);
  return null;
}

/** Main EquipmentViewer component that renders the appropriate 3D model based on part kind */
export function EquipmentViewer({ part }: { part: PlantPart }) {
  const Component = COMPONENTS[part.kind];
  const dimValue = useMemo(() => ({ lines: true, text: true }), []);

  return (
    <CanvasBoundary label={`${part.id} model`}>
    <div className="relative h-[440px] w-full overflow-hidden rounded-lg border border-line bg-ink-900">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [10, 8, 12], fov: 45 }}>
        <color attach="background" args={["#070d10"]} />
        <hemisphereLight args={["#8fb9c9", "#0a1114", 1] as [string, string, number]} />
        <directionalLight position={[12, 18, 10]} intensity={1.3} castShadow />
        <directionalLight position={[-10, 8, -8]} intensity={0.4} color="#5d8ea3" />
        <gridHelper
          args={[Math.max(part.w, part.d) * 6 + 10, 20, "#1e3a44", "#15252c"]}
          position={[0, 0, 0]}
        />
        <CameraFit p={part} />
        <DimContext.Provider value={dimValue}>
          {Component ? (
            <Component p={part} />
          ) : (
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[part.w, part.h, part.d]} />
              <meshStandardMaterial color={part.color} metalness={0.3} roughness={0.6} />
            </mesh>
          )}
        </DimContext.Provider>
        <OrbitControls target={[0, part.h * 0.45, 0]} enableDamping maxPolarAngle={Math.PI / 2.02} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-2 font-mono text-[10.5px] text-mist-400">
        {part.id} · {part.w.toFixed(1)} × {part.d.toFixed(1)} × {part.h.toFixed(1)} m ·{" "}
        {(part.w * part.d).toFixed(1)} m² footprint
      </div>
    </div>
    </CanvasBoundary>
  );
}
