import google.generativeai as genai

from llm.base import BaseLLM
from llm.config import LLMConfig


class GeminiLLM(BaseLLM):
    """
    Google Gemini Provider
    """

    def __init__(self):
        genai.configure(api_key=LLMConfig.GEMINI_API_KEY)

        self.model = genai.GenerativeModel(
            LLMConfig.GEMINI_MODEL
        )

    def generate(self, prompt: str) -> str:
        response = self.model.generate_content(prompt)

        return response.text