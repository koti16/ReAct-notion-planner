import { NextResponse } from "next/server";
import { verifyNotionConnection } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await verifyNotionConnection();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error("GET /api/notion/status error:", error);
    return NextResponse.json(
      {
        connected: false,
        hasToken: false,
        hasDatabaseId: false,
        error: error?.message || "Internal error verifying Notion connection",
      },
      { status: 500 }
    );
  }
}
