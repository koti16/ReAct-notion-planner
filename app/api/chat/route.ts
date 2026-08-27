import { NextRequest, NextResponse } from "next/server";
import { runReActAgent } from "@/lib/agent";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest | Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;
    const model = body?.model || "gemini-3.6-flash";

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required", answer: "Please enter a message to get started." },
        { status: 400 }
      );
    }

    const result = await runReActAgent(message.trim(), model);

    return NextResponse.json({
      answer: result.answer || "I have processed your request.",
      thought: result.thought,
      action: result.action,
      action_input: result.action_input,
      observation: result.observation,
      createdTask: result.createdTask,
    });
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

