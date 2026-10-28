import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4">
      {eyebrow && <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-400">{eyebrow}</div>}
      <h2 className="mt-1 text-lg font-semibold text-mist-200">{title}</h2>
      {children && <div className="mt-1 max-w-4xl text-[13px] leading-relaxed text-mist-400">{children}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="card px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">{label}</div>
      <div className={`mt-1 font-mono text-xl ${accent ? "text-teal-300" : "text-mist-200"}`}>
        {value}
        {unit && <span className="ml-1 text-[11px] font-sans text-mist-400">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-[11px] leading-snug text-mist-400">{sub}</div>}
    </div>
  );
}

const tones: Record<string, string> = {
  teal: "bg-teal-500/15 text-teal-300 border border-teal-500/30",
  amber: "bg-amber-l/15 text-amber-l border border-amber-l/30",
  rust: "bg-rust/15 text-rust border border-rust/30",
  slate: "bg-ink-700 text-mist-300 border border-ink-600",
  green: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  violet: "bg-violet-500/10 text-violet-300 border border-violet-500/25",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`pill ${tones[tone] ?? tones.slate}`}>{children}</span>;
}

export function Check({ pass }: { pass: boolean }) {
  return (
    <span className={pass ? "text-emerald-400" : "text-rust"} title={pass ? "Satisfied" : "Not satisfied"}>
      {pass ? "✓" : "✗"}
    </span>
  );
}

export function Bar({ value, max, tone = "teal" }: { value: number; max: number; tone?: "teal" | "amber" | "rust" }) {
  const pct = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  const color = tone === "teal" ? "bg-teal-500" : tone === "amber" ? "bg-amber-l" : "bg-rust";
  return (
    <div className="h-1.5 w-full rounded-full bg-ink-700">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function KeyValue({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line/70">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-[11px] uppercase tracking-wide text-mist-400">{r.label}</dt>
          <dd className="text-right font-mono text-[12px] text-mist-200">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Callout({ title, children, tone = "teal" }: { title: string; children: ReactNode; tone?: "teal" | "amber" | "rust" }) {
  const border = tone === "teal" ? "border-l-teal-500" : tone === "amber" ? "border-l-amber-l" : "border-l-rust";
  return (
    <div className={`border-l-2 ${border} bg-ink-850/60 px-3 py-2`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-mist-300">{title}</div>
      <div className="mt-1 text-[12px] leading-relaxed text-mist-400">{children}</div>
    </div>
  );
}

export const money = (v: number): string =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

export const usd = (v: number): string => `$${Math.round(v).toLocaleString("en-US")}`;

export const nf = (v: number, d = 1): string =>
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
