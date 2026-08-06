from llm.factory import LLMFactory

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.parser import ReActParser
from app.agent.executor import ToolExecutor


class ReActAgent:

    def __init__(self):
        self.llm = LLMFactory.create()

    def run(self, user_input: str):

        prompt = f"""
{SYSTEM_PROMPT}

User:
{user_input}
"""

        response = self.llm.generate(prompt)

        parsed = ReActParser.parse(response)

        if parsed["action"] and parsed["action"] != "NONE":

            observation = ToolExecutor.execute(
                parsed["action"],
                parsed["action_input"]
            )

            return {
                "thought": parsed["thought"],
                "action": parsed["action"],
                "action_input": parsed["action_input"],
                "observation": observation
            }

        return {
            "answer": parsed["final_answer"]
        }