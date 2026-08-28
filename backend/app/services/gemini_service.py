import os

from google import genai
from google.genai import errors as genai_errors


def get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing.")
    return genai.Client(api_key=api_key)


def generate_answer(prompt: str, model: str | None = None) -> str:
    client = get_client()
    preferred = (model or os.getenv("GEMINI_MODEL", "gemini-3.6-flash")).strip()
    candidates = [preferred] if preferred else ["gemini-3.6-flash"]
    if preferred != "gemini-3.6-flash":
        candidates.append("gemini-3.6-flash")

    last_error: Exception | None = None
    for selected_model in candidates:
        try:
            response = client.models.generate_content(
                model=selected_model,
                contents=prompt,
            )
            return getattr(response, "text", str(response))
        except genai_errors.ClientError as exc:
            last_error = exc
            if getattr(exc, "status_code", 0) != 404:
                raise

    if last_error:
        raise last_error

    raise RuntimeError("Gemini generation failed without a response.")
