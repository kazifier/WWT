"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Two audiences read this dossier: the client, who must not see pricing, and the
 * RAMSIS team, who needs every commercial number.
 *
 * External is the default and the internal view sits behind a PIN, so a client
 * who opens the site — or a link someone forwards — lands on the public dossier
 * and never sees a number until someone unlocks it. The unlock is remembered for
 * the tab session only.
 *
 * The choice is presentation-only and lives in the browser (sessionStorage),
 * so the statically exported site stays static. Everything marked
 * `data-commercial` is hidden by a CSS rule in globals.css — hidden by default,
 * revealed only under html[data-view="internal"] — and pages that are entirely
 * commercial swap their body for a notice via <CommercialOnly>.
 *
 * This is a courtesy lock, not access control: the numbers are still in the
 * page payload on a static host. Anything genuinely secret must live behind a
 * server, not behind this toggle.
 */
export type ViewMode = "internal" | "external";

const MODE_KEY = "b047-view-mode";
const UNLOCK_KEY = "b047-view-unlocked";

/** Six-digit PIN required to enter the internal (RAMSIS) view. */
const INTERNAL_PIN = "518790";

interface ViewModeValue {
  mode: ViewMode;
  isInternal: boolean;
  /** False while the internal view is still behind the PIN. */
  unlocked: boolean;
  setMode: (mode: ViewMode) => void;
  /** Returns false when the PIN is wrong; remembers a correct one for this tab. */
  unlock: (pin: string) => boolean;
}

const ViewModeContext = createContext<ViewModeValue>({
  mode: "external",
  isInternal: false,
  unlocked: false,
  setMode: () => {},
  unlock: () => false,
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  // Locked until proven otherwise: the SSR markup must not show pricing.
  const [mode, setModeState] = useState<ViewMode>("external");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_KEY);
    const sessionUnlock = window.sessionStorage.getItem(UNLOCK_KEY) === "1";
    if (stored === "internal" && sessionUnlock) {
      setUnlocked(true);
      setModeState("internal");
    } else {
      setUnlocked(false);
      setModeState("external");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.view = mode;
  }, [mode]);

  const setMode = useCallback((next: ViewMode) => {
    if (next === "external") {
      window.sessionStorage.removeItem(UNLOCK_KEY);
      setUnlocked(false);
    }
    setModeState(next);
    window.localStorage.setItem(MODE_KEY, next);
  }, []);

  const unlock = useCallback((pin: string) => {
    if (pin.trim() !== INTERNAL_PIN) return false;
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
    window.localStorage.setItem(MODE_KEY, "internal");
    setUnlocked(true);
    setModeState("internal");
    return true;
  }, []);

  const value = useMemo(
    () => ({ mode, isInternal: mode === "internal", unlocked, setMode, unlock }),
    [mode, unlocked, setMode, unlock],
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);

/**
 * The External / Internal switch in the header.
 * External locks immediately; Internal asks for the PIN until it is unlocked.
 */
export function ViewToggle() {
  const { mode, unlocked, setMode, unlock } = useViewMode();
  const [asking, setAsking] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const lock = () => {
    setAsking(false);
    setPin("");
    setError(false);
    setMode("external");
  };

  const onInternal = () => {
    if (unlocked) {
      setAsking(false);
      setMode("internal");
      return;
    }
    setError(false);
    setAsking(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlock(pin)) {
      setAsking(false);
      setPin("");
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  const activeInternal = mode === "internal";

  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="View mode"
    >
      {asking ? (
        <form onSubmit={submit} className="flex items-center gap-1.5">
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setError(false);
            }}
            placeholder="6-digit PIN"
            aria-label="Internal view PIN"
            className={`w-[104px] rounded border bg-ink-900 px-2 py-[3px] text-center font-mono text-[11px] tracking-[0.25em] text-mist-200 placeholder:tracking-normal placeholder:text-mist-400/60 focus:outline-none ${
              error ? "border-rust" : "border-line focus:border-teal-500"
            }`}
          />
          <button
            type="submit"
            className="rounded border border-teal-500/50 bg-teal-500/15 px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em] text-teal-300"
          >
            Unlock
          </button>
          <button
            type="button"
            title="Cancel"
            onClick={() => {
              setAsking(false);
              setPin("");
              setError(false);
            }}
            className="rounded border border-line px-2 py-[3px] text-[10px] text-mist-400 hover:text-mist-200"
          >
            ×
          </button>
          {error && (
            <span className="whitespace-nowrap text-[10px] font-semibold text-rust">Incorrect PIN</span>
          )}
        </form>
      ) : (
        <div className="flex items-center gap-0.5 rounded border border-line bg-ink-900/80 p-0.5">
          {(
            [
              {
                id: "external" as ViewMode,
                label: "External (client)",
                title: "Client view — no pricing or commercial content",
                onClick: lock,
              },
              {
                id: "internal" as ViewMode,
                label: unlocked ? "Internal" : "Internal · PIN",
                title: unlocked
                  ? "RAMSIS view — every number, including cost and margin"
                  : "Internal view is locked — a six-digit PIN is required",
                onClick: onInternal,
              },
            ]
          ).map((o) => {
            const active = mode === o.id;
            return (
              <button
                key={o.id}
                type="button"
                title={o.title}
                aria-pressed={active}
                onClick={o.onClick}
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
      )}
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
        Unlock the internal view in the header to read it. The technical basis behind every line — quantities,
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