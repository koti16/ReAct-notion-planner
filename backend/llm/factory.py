from llm.config import LLMConfig

from llm.groq import GroqLLM
from llm.gemini import GeminiLLM
from llm.ollama import OllamaLLM


class LLMFactory:

    @staticmethod
    def create():

        provider = LLMConfig.PROVIDER.lower()

        if provider == "groq":
            return GroqLLM()

        elif provider == "gemini":
            return GeminiLLM()

        elif provider == "ollama":
            return OllamaLLM()

        raise ValueError(
            f"Unsupported provider: {provider}"
        )