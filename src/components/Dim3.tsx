"use client";

/**
 * Shared 3D dimension primitives: a measurement line with extension ticks and
 * an optional text callout. Visibility is controlled through DimContext so the
 * same primitives can be reused by the overall plant model and the single-item
 * viewer without threading props through every geometry component.
 *
 * Labels are rendered with drei's <Html>, which portals the DOM node into an
 * overlay above the canvas. A plain <div> cannot be a child of <Canvas>: the
 * react-three-fiber reconciler only knows three.js objects and throws on DOM
 * elements, which took the whole /model page down.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export const DIM_COLOR = "#e0a94a";

export const DimContext = createContext({ lines: true, text: true });

function DimLine({ a, b }: { a: [number, number, number]; b: [number, number, number] }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b], 3));
    return g;
  }, [a, b]);
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={DIM_COLOR} />
    </lineSegments>
  );
}

/** A dimension: measurement line, two extension ticks and a text label. */
export function Dim({
  from,
  to,
  label,
  tick = 0.6,
}: {
  from: [number, number, number];
  to: [number, number, number];
  label: string;
  /** Offset of the perpendicular ticks, metres. */
  tick?: number;
}) {
  const { lines, text } = useContext(DimContext);
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  if (!lines) return null;

  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dz) || 1;
  const nx = (-dz / len) * tick;
  const nz = (dx / len) * tick;

  return (
    <group>
      <DimLine a={from} b={to} />
      <DimLine a={[from[0] + nx, from[1], from[2] + nz]} b={[from[0] - nx, from[1], from[2] - nz]} />
      <DimLine a={[to[0] + nx, to[1], to[2] + nz]} b={[to[0] - nx, to[1], to[2] - nz]} />
      {text && <DimLabel position={mid}>{label}</DimLabel>}
    </group>
  );
}

/** Renders a label at a 3D position as a DOM overlay inside the canvas. */
export function DimLabel({
  position,
  children,
}: {
  position: [number, number, number];
  children: ReactNode;
}) {
  return (
    <Html position={position} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded border border-amber-l/50 bg-ink-950/90 px-1.5 py-0.5 font-mono text-[10.5px] text-amber-l">
        {children}
      </div>
    </Html>
  );
}

/** A closed rectangle of dimension lines on the ground plane (plot outline). */
export function GroundRect({
  x,
  z,
  w,
  d,
  color = "#5d7d8a",
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  color?: string;
}) {
  const geom = useMemo(() => {
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const z0 = z - d / 2;
    const z1 = z + d / 2;
    const seg: number[] = [];
    const push = (a: [number, number, number], b: [number, number, number]) => seg.push(...a, ...b);
    push([x0, 0.04, z0], [x1, 0.04, z0]);
    push([x1, 0.04, z0], [x1, 0.04, z1]);
    push([x1, 0.04, z1], [x0, 0.04, z1]);
    push([x0, 0.04, z1], [x0, 0.04, z0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    return g;
  }, [x, z, w, d]);

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

export function DimProvider({ value, children }: { value: { lines: boolean; text: boolean }; children: ReactNode }) {
  return <DimContext.Provider value={value}>{children}</DimContext.Provider>;
}
