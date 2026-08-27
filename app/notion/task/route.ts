import { NextRequest, NextResponse } from "next/server";
import { createTask, updateTaskStatus, archiveTask } from "@/src/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, status = "to-do", priority = "high" } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const result = await createTask(title, status, priority);
    return NextResponse.json({
      message: "Task created successfully",
      id: result.id,
    });
  } catch (error: any) {
    console.error("POST /notion/task error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { page_id, status } = body;

    if (!page_id || !status) {
      return NextResponse.json({ error: "page_id and status are required" }, { status: 400 });
    }

    await updateTaskStatus(page_id, status);
    return NextResponse.json({ message: "Task updated successfully" });
  } catch (error: any) {
    console.error("PUT /notion/task error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { page_id } = body;

    if (!page_id) {
      return NextResponse.json({ error: "page_id is required" }, { status: 400 });
    }

    await archiveTask(page_id);
    return NextResponse.json({ message: "Task archived successfully" });
  } catch (error: any) {
    console.error("DELETE /notion/task error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
