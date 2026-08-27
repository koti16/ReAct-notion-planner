import { NextRequest, NextResponse } from "next/server";
import { extractDocumentText } from "@/src/lib/ocr";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ detail: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ detail: "File too large (max 15 MB)" }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await extractDocumentText(file.name || "uploaded-file", buffer, file.type);

    if (!text.trim()) {
      return NextResponse.json({ detail: "No text could be extracted" }, { status: 422 });
    }

    return NextResponse.json({
      filename: file.name,
      text,
    });
  } catch (error: any) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { detail: error?.message || "Could not read file" },
      { status: 500 }
    );
  }
}
