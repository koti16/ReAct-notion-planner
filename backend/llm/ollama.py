import ollama

from llm.base import BaseLLM
from llm.config import LLMConfig


class OllamaLLM(BaseLLM):
    """
    Ollama Local LLM
    """

    def generate(self, prompt: str) -> str:
        response = ollama.chat(
            model=LLMConfig.OLLAMA_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response["message"]["content"]