import json

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

            follow_up = f"""
{prompt}

Assistant:
{response}

Observation:
{json.dumps(observation, default=str)}

Use the Observation to write the Final Answer for the user.
If the Observation contains tasks, list them clearly.
If it reports an error, explain it simply.
"""

            final_response = self.llm.generate(follow_up)
            final_parsed = ReActParser.parse(final_response)

            answer = final_parsed["final_answer"]

            return {
                "thought": parsed["thought"],
                "action": parsed["action"],
                "action_input": parsed["action_input"],
                "observation": observation,
                "answer": answer or observation.get("message", "Done.")
            }

        return {
            "answer": parsed["final_answer"]
        }
