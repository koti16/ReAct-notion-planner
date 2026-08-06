import os
from dotenv import load_dotenv

load_dotenv()


class LLMConfig:
    """
    Central configuration for all LLM providers.
    """

    PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    GROQ_MODEL = os.getenv(
        "GROQ_MODEL",
        "llama-3.3-70b-versatile"
    )

    GEMINI_MODEL = os.getenv(
        "GEMINI_MODEL",
        "gemini-2.5-flash"
    )

    OPENAI_MODEL = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.5"
    )

    TEMPERATURE = float(
        os.getenv("TEMPERATURE", "0.2")
    )

    MAX_TOKENS = int(
        os.getenv("MAX_TOKENS", "2048")
    )