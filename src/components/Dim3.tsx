"use client";

/**
 * Shared 3D dimension primitives: a measurement line with extension ticks and
 * an optional text callout. Visibility is controlled through DimContext so the
 * same primitives can be reused by the overall plant model and the single-item
 * viewer without threading props through every geometry component.
 */

import { createContext, useContext, useMemo, type ReactNode, useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
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
      {text && (
        <DimLabel position={mid}>{label}</DimLabel>
      )}
    </group>
  );
}

/** Renders a label at a 3D position using CSS projection (no drei Html). */
export function DimLabel({
  position,
  children,
}: {
  position: [number, number, number];
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const project = (window as unknown as { __project3D?: (pos: [number, number, number]) => [number, number, boolean] }).__project3D;
      if (project) {
        const [sx, sy, visible] = project(position);
        if (!visible) { ref.current.style.display = "none"; return; }
        ref.current.style.display = "";
        ref.current.style.left = `${sx}px`;
        ref.current.style.top = `${sy}px`;
      }
    };
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [position]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 50,
        ...style,
      }}
      className="whitespace-nowrap rounded border border-amber-l/50 bg-ink-950/90 px-1.5 py-0.5 font-mono text-[10.5px] text-amber-l"
    >
      {children}
    </div>
  );
}

/** Bridge component that exposes camera projection to DOM overlays. */
function ProjectionBridge() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const project = (v: [number, number, number]): [number, number, boolean] => {
      const v4 = new THREE.Vector4(v[0], v[1], v[2], 1);
      v4.applyMatrix4(camera.projectionMatrix);
      v4.applyMatrix4(camera.matrixWorldInverse);
      const w = gl.domElement.width;
      const h = gl.domElement.height;
      const visible = v4.z < 1 && v4.z > -1 && v4.w > 0;
      const sx = (v4.x / v4.w) * w / 2 + w / 2;
      const sy = -(v4.y / v4.w) * h / 2 + h / 2;
      return [sx, sy, visible];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__project3D = project;
    return () => { (window as any).__project3D = undefined; };
  }, [camera, gl]);
  return null;
}

export { ProjectionBridge };

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
  const points = useMemo(() => {
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
    return seg;
  }, [x, z, w, d]);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

export function DimProvider({ value, children }: { value: { lines: boolean; text: boolean }; children: ReactNode }) {
  return <DimContext.Provider value={value}>{children}</DimContext.Provider>;
}