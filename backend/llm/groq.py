from groq import Groq

from llm.base import BaseLLM
from llm.config import LLMConfig


class GroqLLM(BaseLLM):
    """
    Groq LLM Provider
    """

    def __init__(self):
        self.client = Groq(
            api_key=LLMConfig.GROQ_API_KEY
        )

    def generate(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=LLMConfig.GROQ_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=LLMConfig.TEMPERATURE,
            max_tokens=LLMConfig.MAX_TOKENS
        )

        return response.choices[0].message.content or ""