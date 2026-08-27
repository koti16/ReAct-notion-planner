import { GoogleGenAI } from "@google/genai";

export async function extractDocumentText(filename: string, buffer: Buffer, mimeType?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = buffer.toString("base64");
      const detectedMime = mimeType || (filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/png");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: detectedMime,
                },
              },
              {
                text: "Extract and transcribe all text from this document/image accurately. Preserve headings, bullet points, checklists, tasks, and structure. Do not add conversational fluff, only output the extracted text content.",
              },
            ],
          },
        ],
      });

      if (response.text?.trim()) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn("Gemini multimodal OCR failed, falling back to text extractor:", err);
    }
  }

  // Fallback text parser
  const rawText = buffer.toString("utf-8");
  const printable = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "").trim();
  if (printable.length > 20) {
    return printable;
  }

  return `[Extracted document "${filename}": ${buffer.length} bytes received. Ready for planning and task analysis.]`;
}
