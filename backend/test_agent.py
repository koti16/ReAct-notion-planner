from app.agent.react_agent import ReActAgent

agent = ReActAgent()

result = agent.run(
    "Create a task called Learn LangGraph."
)

print(result)