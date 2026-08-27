import { NextRequest, NextResponse } from "next/server";
import { runReActAgent } from "@/src/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await runReActAgent(message);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        answer: "Sorry, an unexpected error occurred while processing your request.",
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
