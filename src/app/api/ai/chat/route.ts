import { NextResponse } from "next/server";
import { askGemini, geminiConfigured, type ChatTurn } from "@/lib/gemini";
import { buildProjectContext } from "@/lib/aiContext";

export const maxDuration = 60;

export async function POST(req: Request) {
  let payload: { messages?: ChatTurn[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (payload.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "model") && typeof m.text === "string" && m.text.trim().length > 0,
  );

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages supplied." }, { status: 400 });
  }

  // Keep the transcript bounded so a long session cannot blow the context window.
  const trimmed = messages.slice(-12).map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));

  const result = await askGemini(trimmed, buildProjectContext());

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        configured: geminiConfigured(),
        hint: geminiConfigured() ? undefined : "Set GEMINI_API_KEY in the project secrets.",
      },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ text: result.text, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
}

export async function GET() {
  return NextResponse.json({ configured: geminiConfigured(), model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
}
