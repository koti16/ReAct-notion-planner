from llm.factory import LLMFactory

llm = LLMFactory.create()

response = llm.generate(
    "Explain what a ReAct agent is in one sentence."
)

print(response)