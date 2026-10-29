"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Two audiences read this dossier: the client, who must not see pricing, and the
 * RAMSIS team, who needs every commercial number.
 *
 * The choice is presentation-only and lives in the browser (localStorage), so the
 * statically exported site stays static. Everything marked `data-commercial` is
 * hidden in the external view by a CSS rule in globals.css, and pages that are
 * entirely commercial swap their body for a notice via <CommercialOnly>.
 */
export type ViewMode = "internal" | "external";

const STORAGE_KEY = "b047-view-mode";

interface ViewModeValue {
  mode: ViewMode;
  isInternal: boolean;
  setMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeValue>({
  mode: "internal",
  isInternal: true,
  setMode: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("internal");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "external" || stored === "internal") setModeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.view = mode;
  }, [mode]);

  const setMode = useCallback((next: ViewMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ mode, isInternal: mode === "internal", setMode }),
    [mode, setMode],
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);

/** The External / Internal switch that sits in the header. */
export function ViewToggle() {
  const { mode, setMode } = useViewMode();
  const options: { id: ViewMode; label: string; title: string }[] = [
    { id: "external", label: "External (client)", title: "Client view — no pricing or commercial content" },
    { id: "internal", label: "Internal", title: "RAMSIS view — every number, including cost and margin" },
  ];

  return (
    <div
      className="flex items-center gap-0.5 rounded border border-line bg-ink-900/80 p-0.5"
      role="group"
      aria-label="View mode"
    >
      {options.map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            title={o.title}
            aria-pressed={active}
            onClick={() => setMode(o.id)}
            className={`whitespace-nowrap rounded px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${
              active
                ? o.id === "external"
                  ? "bg-teal-500/20 text-teal-200"
                  : "bg-violet-500/20 text-violet-200"
                : "text-mist-400 hover:text-mist-200"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Wraps a block that must not reach the client. In the external view the block
 * is not rendered at all; a short notice takes its place so the page still makes
 * sense instead of showing an empty heading.
 */
export function CommercialOnly({
  children,
  note = "Commercial information — available in the internal view.",
}: {
  children: ReactNode;
  note?: string;
}) {
  const { isInternal } = useViewMode();
  if (isInternal) return <>{children}</>;
  return (
    <div className="border-l-2 border-l-violet-500 bg-ink-850/60 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Commercial</div>
      <div className="mt-1 text-[11.5px] leading-relaxed text-mist-400">{note}</div>
    </div>
  );
}

/** A single amount. Hidden by CSS in the external view, so it works inside tables. */
export function Money({ value, className }: { value: string; className?: string }) {
  return (
    <span className={className} data-commercial>
      {value}
    </span>
  );
}

/**
 * Page-level gate for a page whose whole subject is commercial (the estimate).
 * The client view gets a notice instead of the body.
 */
export function CommercialPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { isInternal } = useViewMode();
  if (isInternal) return <>{children}</>;
  return (
    <div className="space-y-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-400">Commercial section</div>
      <h2 className="text-lg font-semibold text-mist-200">{title}</h2>
      <div className="border-l-2 border-l-teal-500 bg-ink-850/60 px-3 py-2 text-[12px] leading-relaxed text-mist-400">
        This section is commercial and is not part of the client dossier. It carries the capital estimate, the
        operating cost build-up, the life-cycle comparison and the scope-risk allowances.
        <br />
        <br />
        Switch to the internal view in the header to read it. The technical basis behind every line — quantities,
        material take-off, equipment and calculations — remains available in the other sections.
      </div>
    </div>
  );
}

/** Renders only in the client view — the counterpart to <CommercialOnly>. */
export function ClientOnly({ children }: { children: ReactNode }) {
  const { isInternal } = useViewMode();
  return isInternal ? null : <>{children}</>;
}

/** Inline notice for a page the client can read but where cost is removed. */
export function ExternalNote({ children }: { children: ReactNode }) {
  const { isInternal } = useViewMode();
  if (isInternal) return null;
  return (
    <div className="border-l-2 border-l-teal-500 bg-ink-850/60 px-3 py-2 text-[11.5px] leading-relaxed text-mist-400">
      {children}
    </div>
  );
}
