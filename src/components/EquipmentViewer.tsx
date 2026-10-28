"use client";

/**
 * Single-item 3D viewer.
 *
 * Every item is rebuilt from its own length, width, height and diameter, and
 * the dimension callouts are generated from those same numbers — so the
 * drawing cannot drift from the geometry it describes.
 */

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Edges } from "@react-three/drei";
import * as THREE from "three";
import { zoneColor, type PlantPart } from "@/lib/plantLayout";
import { Dim, DimContext, DimLabel, ProjectionBridge } from "@/components/Dim3";

/* ------------------------------------------------------------------ */
/* geometry per item type                                              */
/* ------------------------------------------------------------------ */

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
      {[-1, 0, 1].map((i) => (
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
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, p.h / 2, (s * p.d) / 2]}>
          <boxGeometry args={[p.w, p.h, 0.25]} />
          <meshStandardMaterial color={p.color} metalness={0.4} roughness={0.5} transparent opacity={0.75} />
        </mesh>
      ))}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * p.w) / 2, p.h / 2, (sz * p.d) / 2]}>
            <boxGeometry args={[0.3, p.h, 0.3]} />
            <meshStandardMaterial color="#425e6a" metalness={0.5} />
          </mesh>
        )),
      )}
      {[-1, 0, 1].map((i) => (
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
        <meshStandardMaterial color={"#6fe0d1"} metalness={0.3} roughness={0.7} />
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
        <meshStandardMaterial color={"#6fe0d1"} metalness={0.3} roughness={0.7} />
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
          <meshStandardMaterial color={"#2ccbb8"} metalness={0.3} roughness={0.6} />
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
      <mesh position={[-p.w * 0.3, p.h / 2 + 0.1, p.d * 0.425]}>
        <boxGeometry args={[p.w * 0.3, p.h * 0.2, 0.01]} />
        <meshStandardMaterial color="#e0a94a" emissive="#e0a94a" emissiveIntensity={0.1} />
      </mesh>
      {/* ventilation slots */}
      <mesh position={[p.w * 0.3, p.h * 0.75, p.d * 0.42]}>
        <boxGeometry args={[p.w * 0.25, 0.08, 0.06]} />
        <meshStandardMaterial color="#0f1a20" />
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
        <meshStandardMaterial color={"#7f9aa6"} metalness={0.2} roughness={0.8} />
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
      {[-1, 1].map((s) => (
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
        <cylinderGeometry args={[0.03, 0.03, Math.sqrt((p.w * 0.5) ** 2 + (p.h * 0.4) ** 2), 16]} />
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

/* ------------------------------------------------------------------ */
/* viewer shell                                                        */
/* ------------------------------------------------------------------ */

export default function EquipmentViewer({ part }: { part: PlantPart }) {
  const [dims, setDims] = useState(true);
  const [text, setText] = useState(true);

  const size = Math.max(part.w, part.d, part.h, 6);
  const camDist = size * 2.1;
  const gridStep = size < 10 ? 1 : size < 30 ? 5 : 10;
  const ground = size * 6;
  const footprint_m2 = +(part.w * part.d).toFixed(1);

  const dimValue = useMemo(() => ({ lines: dims, text }), [dims, text]);

  const geometry =
    part.kind === "tank" ? (
      <Tank p={part} />
    ) : part.kind === "basin" ? (
      <Basin p={part} />
    ) : part.kind === "clarifier" ? (
      <Clarifier p={part} />
    ) : part.kind === "rack" ? (
      <Rack p={part} />
    ) : part.kind === "rack-frame" ? (
      <RackFrame p={part} />
    ) : part.kind === "pump" ? (
      <Pump p={part} />
    ) : part.kind === "mixer" ? (
      <Mixer p={part} />
    ) : part.kind === "heat-exchanger" ? (
      <HeatExchanger p={part} />
    ) : part.kind === "electrical" ? (
      <ElectricalPanel p={part} />
    ) : part.kind === "cable-tray" ? (
      <CableTray p={part} />
    ) : part.kind === "lightning" ? (
      <LightningTower p={part} />
    ) : (
      <Building p={part} />
    );

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-lg border border-line bg-[#060b0e]">
      <Canvas shadows camera={{ position: [camDist, camDist * 0.7, camDist * 0.9], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={["#060b0e"]} />
        <fog attach="fog" args={["#060b0e", size * 12, size * 34]} />
        <hemisphereLight intensity={0.6} groundColor="#0a1418" color="#9fd8d2" />
        <directionalLight
          position={[size * 3, size * 4, size * 2]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-size * 2, size * 2, -size * 3]} intensity={0.4} color="#2ccbb8" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ground, ground]} />
          <meshStandardMaterial color="#0a1418" roughness={1} />
        </mesh>
        <Grid
          args={[ground, ground]}
          position={[0, 0.02, 0]}
          cellSize={gridStep}
          cellThickness={0.4}
          cellColor="#16252c"
          sectionSize={gridStep * 5}
          sectionThickness={0.7}
          sectionColor="#1e323b"
          fadeDistance={ground * 2}
          infiniteGrid={false}
        />

        <DimContext.Provider value={dimValue}>{geometry}</DimContext.Provider>
        <ProjectionBridge />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={size * 0.8}
          maxDistance={camDist * 3}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, part.h / 2, 0]}
        />
      </Canvas>

      {/* caption */}
      <div className="pointer-events-none absolute left-3 top-3 max-w-[65%]">
        <div className="font-mono text-[13px] font-semibold text-teal-300">{part.id}</div>
        <div className="text-[11.5px] text-mist-200">
          {part.label}
          <span className="ml-2 font-mono text-[10px] text-mist-400">Area {part.area}</span>
        </div>
        <div className="mt-1 space-y-0.5 text-[10.5px] text-mist-400">
          <div>
            Footprint {part.w.toFixed(1)} × {part.d.toFixed(1)} m ({footprint_m2.toLocaleString("en-US")} m²)
          </div>
          <div>Overall height {part.h.toFixed(1)} m</div>
          <div>
            <span
              className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
              style={{ background: zoneColor[part.zone] }}
            />
            {part.zone}
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-1.5 text-[10.5px]">
        <button
          onClick={() => setDims((v) => !v)}
          className={`rounded border px-2 py-1 ${
            dims ? "border-amber-l/60 bg-amber-l/15 text-amber-l" : "border-ink-600 bg-ink-950/80 text-mist-400"
          }`}
        >
          Dimension lines
        </button>
        <button
          onClick={() => setText((v) => !v)}
          className={`rounded border px-2 py-1 ${
            text ? "border-teal-500/60 bg-teal-500/15 text-teal-300" : "border-ink-600 bg-ink-950/80 text-mist-400"
          }`}
        >
          Dimension text
        </button>
      </div>

      <div className="absolute bottom-3 left-3 rounded border border-line bg-ink-950/80 px-2.5 py-1.5 text-[10px] text-mist-400">
        Drag to orbit · scroll to zoom · right-drag to pan
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-line bg-ink-950/80 px-2.5 py-1.5 text-[10px] text-mist-400">
        Parametric from register dimensions · grid {gridStep} m
      </div>
    </div>
  );
}