"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Display currency for every amount in the dossier.
 *
 * The Bahraini dinar is pegged: 1 USD = 0.376 BHD, unchanged since 1980, so a
 * fixed factor is correct rather than a "live" rate that would need a network
 * call on a static site. Amounts are *stored* and *entered* in USD — the rate
 * card, the overrides and the estimate all stay USD — and only the rendering
 * converts, so switching currency can never change a calculation or a stored
 * number. Dinar amounts carry three decimals because that is how a BHD figure
 * is quoted in the Gulf; dollar amounts are whole.
 */
export type Currency = "USD" | "BHD";

const KEY = "b047-currency";

/** Official peg: 0.376 BHD per USD, i.e. 1 BHD = 2.659574 USD. */
export const BHD_PER_USD = 0.376;

interface CurrencyValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Formats a USD amount in the selected currency. */
  usd: (v: number) => string;
  /** The same amount, abbreviated to k / M. */
  money: (v: number) => string;
  /** Symbol/suffix for a rate cell, e.g. "/m" stays, "$" becomes "BD". */
  symbol: string;
}

const fmtUsd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const fmtBhd = (v: number) =>
  `BD ${(v * BHD_PER_USD).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;

const shortUsd = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

const shortBhd = (v: number) => {
  const b = v * BHD_PER_USD;
  return b >= 1_000_000
    ? `BD ${(b / 1_000_000).toFixed(2)}M`
    : b >= 1000
      ? `BD ${(b / 1000).toFixed(0)}k`
      : `BD ${b.toFixed(2)}`;
};

const CurrencyContext = createContext<CurrencyValue>({
  currency: "USD",
  setCurrency: () => {},
  usd: fmtUsd,
  money: shortUsd,
  symbol: "$",
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "BHD" || stored === "USD") setCurrencyState(stored);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      /* private mode — the choice holds for this page view */
    }
  }, []);

  const value = useMemo<CurrencyValue>(
    () => ({
      currency,
      setCurrency,
      usd: currency === "BHD" ? fmtBhd : fmtUsd,
      money: currency === "BHD" ? shortBhd : shortUsd,
      symbol: currency === "BHD" ? "BD" : "$",
    }),
    [currency, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

/** The formatter pair, so a page reads `const { usd, money } = useMoney()`. */
export const useMoney = () => {
  const { usd, money } = useCurrency();
  return { usd, money };
};

/** USD / BHD switch for the header. */
export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div
      className="flex items-center gap-0.5 rounded border border-line bg-ink-900/80 p-0.5"
      role="group"
      aria-label="Display currency"
    >
      {(["USD", "BHD"] as Currency[]).map((c) => {
        const active = currency === c;
        return (
          <button
            key={c}
            type="button"
            title={
              c === "USD"
                ? "Show every amount in US dollars"
                : "Show every amount in Bahraini dinars at the 0.376 peg — entries stay in USD"
            }
            aria-pressed={active}
            onClick={() => setCurrency(c)}
            className={`rounded px-2 py-[3px] text-[10px] font-semibold tracking-[0.06em] transition-colors ${
              active ? "bg-teal-500/20 text-teal-200" : "text-mist-400 hover:text-mist-200"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
