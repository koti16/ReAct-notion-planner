import os

from app.agent.react_agent import ReActAgent


if __name__ == "__main__" and os.getenv("RUN_LIVE_AGENT_TEST") == "1":
    agent = ReActAgent()

    result = agent.run("Create a task called Complete React Notion Planner with high priority.")
    

    print(result)