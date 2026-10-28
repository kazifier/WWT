/** Minimal Gemini client using the REST API — no SDK dependency. */
import { SYSTEM_PROMPT } from "./aiContext";

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface GeminiResult {
  ok: boolean;
  text: string;
  error?: string;
  status?: number;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askGemini(turns: ChatTurn[], context: string): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      ok: false,
      status: 501,
      text: "",
      error:
        "GEMINI_API_KEY is not set on the server. Add it as a project secret (never with a NEXT_PUBLIC_ prefix) and restart the server.",
    };
  }

  const body = {
    systemInstruction: {
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${context}` }],
    },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 2400,
      topP: 0.9,
    },
    safetySettings: [],
  };

  try {
    const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      let message = `Gemini returned HTTP ${res.status}.`;
      try {
        const parsed = JSON.parse(detail);
        message = parsed?.error?.message ?? message;
      } catch {
        /* keep the default message */
      }
      return { ok: false, status: res.status, text: "", error: message };
    }

    const json = await res.json();
    const text: string =
      json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";

    if (!text) {
      const reason = json?.candidates?.[0]?.finishReason;
      return { ok: false, status: 502, text: "", error: `Gemini returned an empty response${reason ? ` (${reason})` : ""}.` };
    }
    return { ok: true, text };
  } catch (err) {
    return { ok: false, status: 500, text: "", error: err instanceof Error ? err.message : "Unknown network error" };
  }
}
