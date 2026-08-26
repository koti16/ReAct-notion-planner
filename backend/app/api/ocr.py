from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.ocr_service import extract_text

router = APIRouter(prefix="/api", tags=["OCR"])

MAX_SIZE = 15 * 1024 * 1024


@router.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    data = await file.read()

    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 15 MB)")

    try:
        text = extract_text(file.filename or "", data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted")

    return {"filename": file.filename, "text": text}
