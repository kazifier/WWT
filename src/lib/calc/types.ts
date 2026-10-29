/** Shared types for the calculation engine. */

export interface CalcInput {
  label: string;
  symbol?: string;
  value: string;
  unit: string;
  basis?: string;
}

export interface CalcStep {
  label: string;
  formula: string;
  substitution?: string;
  result: string;
}

export interface CalcCheck {
  label: string;
  required: string;
  actual: string;
  pass: boolean;
  clause: string;
}

export interface CalcSheet {
  id: string;
  title: string;
  discipline:
    | "Process"
    | "Mechanical"
    | "Rotating"
    | "Piping"
    | "Instruments"
    | "Electrical"
    | "Insulation"
    | "Structural"
    | "Civil"
    | "Cost";
  clause: string;
  intent: string;
  inputs: CalcInput[];
  steps: CalcStep[];
  results: CalcInput[];
  checks: CalcCheck[];
}

export const fmt = (v: number, d = 1): string =>
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const r2 = (v: number): number => Math.round(v * 100) / 100;
export const r1 = (v: number): number => Math.round(v * 10) / 10;
export const r0 = (v: number): number => Math.round(v);
export const ceilTo = (v: number, step: number): number => Math.ceil(v / step) * step;
