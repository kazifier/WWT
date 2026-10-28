"use client";

import { useEffect, useRef, useState } from "react";
import { Card, SectionTitle, Badge, Callout } from "@/components/ui";

interface Msg {
  role: "user" | "model";
  text: string;
}

const starters = [
  "Why does Option 1 fail the river discharge limits, and what would fix it?",
  "Draft clarification CL-003 to ABG with a requested response date.",
  "Justify the RO vendor recommendation to MRC in three paragraphs.",
  "Which items can RAMSIS manufacture and what must be bought, and why?",
  "Explain the aeration blower sizing to a non-process reviewer.",
  "What are the top five risks in the make scope?",
  "Summarise the two design-basis contradictions that carry cost impact.",
  "Write the technical query for the missing silica limit in the inlet analysis.",
];

const NOTE =
  "Answers are grounded in this dossier only — the calculation sheets, equipment register, vendor list analysis and estimate. The assistant is instructed not to invent vendors, clauses or prices.";

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{ configured: boolean; model: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ configured: false, model: "gemini-2.5-flash" }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed with HTTP ${res.status}.`);
      } else {
        setMessages([...next, { role: "model", text: data.text }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  const notConfigured = config && !config.configured;

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Section 9" title="Gemini engineering assistant">
        A grounded chat over this dossier. The server injects the full project context — blended inlet analysis,
        every calculation result, the equipment register, vendor rules and the estimate — into each request, so
        answers stay consistent with the numbers on the other pages.
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={config?.configured ? "green" : "amber"}>
          {config ? (config.configured ? `Live · ${config.model}` : "Not configured") : "Checking…"}
        </Badge>
        <Badge tone="slate">Server-side key only</Badge>
        <Badge tone="slate">Transcript kept in the browser session</Badge>
      </div>

      {notConfigured && (
        <Callout title="Gemini is not configured on this deployment" tone="amber">
          Add <span className="font-mono text-mist-300">GEMINI_API_KEY</span> as a server-side secret (never with a{" "}
          <span className="font-mono">NEXT_PUBLIC_</span> prefix, which would expose it to the browser) and restart
          the app. The assistant calls the Gemini REST API directly from a route handler — no other service or key is
          involved.
        </Callout>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="flex h-[640px] flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="rounded border border-line/70 bg-ink-900/40 p-4">
                <div className="text-[12px] font-semibold text-mist-200">Ask about the package</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-mist-400">{NOTE}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-mist-400">
                  Useful things to ask: why a size came out where it did, what a clause requires, which vendor to
                  propose for an unlisted item, or to draft a clarification in issue-ready form.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[86%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-[12px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-teal-500/15 text-mist-200"
                      : "border border-line bg-ink-900/70 text-mist-300"
                  }`}
                >
                  {m.role === "model" && (
                    <div className="mb-1 text-[9.5px] uppercase tracking-[0.14em] text-teal-400">Assistant</div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-line bg-ink-900/70 px-3.5 py-2.5 text-[12px] text-mist-400">
                  Reading the dossier…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded border border-rust/40 bg-rust/10 px-3 py-2 text-[11.5px] text-rust">{error}</div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={2}
                placeholder="Ask about a calculation, a clause, a vendor or the estimate…"
                className="flex-1 resize-none rounded border border-ink-600 bg-ink-850 px-2.5 py-2 text-[12px] text-mist-200 placeholder:text-mist-400/60 focus:border-teal-500/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="self-stretch rounded bg-teal-500 px-4 text-[12px] font-semibold text-ink-950 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-mist-400"
              >
                Send
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-mist-400">
              <span>Enter to send · Shift+Enter for a new line</span>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="hover:text-mist-200">
                  Clear conversation
                </button>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Start here</div>
            <div className="mt-2 space-y-1.5">
              {starters.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy}
                  className="w-full rounded border border-line/70 bg-ink-900/40 px-2.5 py-1.5 text-left text-[11px] leading-snug text-mist-300 transition-colors hover:border-teal-500/40 hover:text-mist-200 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-400">Grounding</div>
            <ul className="mt-2 space-y-1.5 text-[10.5px] leading-relaxed text-mist-400">
              <li>RFQ {`2024B047-MR-0022 Rev B`} — scope, inlet, outlet limits, technical requirements</li>
              <li>BOD-0001 Rev 1 and BOD-0002 Rev 0 — mechanical design basis</li>
              <li>B047-ABG-03-PR-LAY-0001 Rev 4 — hazardous area classification</li>
              <li>MRC approved vendor list R1 — governing status and vendor names</li>
              <li>All 18 calculation sheets and the full equipment register</li>
              <li>The cost model and its stated assumptions</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
