import io
import os

import pymupdf
import pytesseract
from PIL import Image

TESSERACT_CMD = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


def extract_text(filename: str, data: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        return _extract_pdf(data)
    image = Image.open(io.BytesIO(data))
    return pytesseract.image_to_string(image).strip()


def _extract_pdf(data: bytes) -> str:
    doc = pymupdf.open(stream=data, filetype="pdf")
    parts = []
    for page in doc:
        text = page.get_text().strip()
        if text:
            parts.append(text)
        else:
            pix = page.get_pixmap(dpi=200)
            image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            parts.append(pytesseract.image_to_string(image).strip())
    doc.close()
    return "\n\n".join(p for p in parts if p)
