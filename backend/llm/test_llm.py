import os

from llm.factory import LLMFactory


if __name__ == "__main__" and os.getenv("RUN_LIVE_LLM_TEST") == "1":
    llm = LLMFactory.create()
    response = llm.generate("Explain what a ReAct agent is in one sentence.")
    print(response)