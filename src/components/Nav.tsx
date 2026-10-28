"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/basis", label: "Design basis" },
  { href: "/calculations", label: "Calculations" },
  { href: "/equipment", label: "Equipment" },
  { href: "/make-buy", label: "Make / buy" },
  { href: "/mto", label: "BOM / MTO" },
  { href: "/procurement", label: "Procurement" },
  { href: "/estimate", label: "Estimate" },
  { href: "/model", label: "Model & drawings" },
  { href: "/assistant", label: "AI assistant" },
  { href: "/documents", label: "Documents" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-950/95 backdrop-blur">
      <div className="mx-auto max-w-[1500px] px-4">
        <div className="flex h-14 items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-500 font-bold text-ink-950">R</div>
            <div className="leading-tight">
              <div className="text-[12px] font-semibold tracking-wide text-mist-200">RAMSIS ENGINEERING</div>
              <div className="text-[9.5px] uppercase tracking-[0.16em] text-mist-400">B047 · WWT package</div>
            </div>
          </Link>
          <div className="ml-auto hidden items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-mist-400 md:flex">
            <span>Diwanya Refinery · Iraq</span>
            <span className="text-ink-600">|</span>
            <span>500 m³/h</span>
          </div>
        </div>
        <nav className="-mx-1 flex gap-0.5 overflow-x-auto pb-0.5">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-t px-3 py-2 text-[11.5px] font-medium transition-colors ${
                  active
                    ? "border-b-2 border-teal-500 text-teal-300"
                    : "border-b-2 border-transparent text-mist-400 hover:text-mist-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
