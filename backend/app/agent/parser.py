import json
import re


class ReActParser:

    @staticmethod
    def parse(response: str) -> dict:
        result = {
            "thought": "",
            "action": None,
            "action_input": {},
            "final_answer": ""
        }

        thought = re.search(r"Thought:\s*(.*?)\nAction:", response, re.S)
        action = re.search(r"Action:\s*(.*?)\nAction Input:", response, re.S)
        action_input = re.search(
            r"Action Input:\s*(.*?)\n(?:Observation:|Final Answer:)",
            response,
            re.S
        )
        final = re.search(r"Final Answer:\s*(.*)", response, re.S)

        if thought:
            result["thought"] = thought.group(1).strip()

        if action:
            result["action"] = action.group(1).strip()
            
        if action_input:
            text = action_input.group(1).strip()

        if text and text != "{}":
            try:
                result["action_input"] = json.loads(text)
            except json.JSONDecodeError:
                result["action_input"] = {
                "title": text
            }
        if final:
            result["final_answer"] = final.group(1).strip()

        return result