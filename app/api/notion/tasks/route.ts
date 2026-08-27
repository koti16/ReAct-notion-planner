import { NextResponse } from "next/server";
import { getTasks } from "@/lib/notion";

export async function GET() {
  try {
    const tasks = await getTasks();
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("GET /api/notion/tasks error:", error);
    return NextResponse.json({ tasks: [], error: error?.message }, { status: 500 });
  }
}
