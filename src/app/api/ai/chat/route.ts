import { NextResponse } from "next/server";
import { geminiConfigured, type ChatTurn } from "@/lib/gemini";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    configured: geminiConfigured(),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "POST not supported in static export" },
    { status: 405 }
  );
}