import { GoogleGenAI } from "@google/genai";
import { createTask, getTasks } from "./notion";

const SYSTEM_PROMPT = `
You are ReAct Planner, an intelligent task management assistant.

Your goal is to help users manage tasks inside their Notion workspace.

You have access to external tools.

========================
AVAILABLE TOOLS
========================

1. create_task

Description:
Creates a new task in the user's Notion database.

Arguments:
{
    "title": string,
    "priority": "low" | "medium" | "high",
    "status": "to-do" | "in progress" | "done"
}

------------------------------------------------

2. get_tasks

Description:
Returns all tasks from the user's Notion database.

Arguments:
{}

========================
RULES
========================

1. Think before taking an action.

2. If a tool is required, use it.

3. Never invent tool results.

4. Use only ONE action at a time.

5. Use only the tools listed above.

6. Always produce valid JSON inside Action Input.

7. Keep the Thought concise.

8. Always use the exact output format below.

========================
OUTPUT FORMAT
========================

Thought:
<brief reasoning>

Action:
<tool name or NONE>

Action Input:
<valid JSON object>

Final Answer:
<answer for the user>

========================
EXAMPLES
========================

Example 1

User:
Create a task called Learn LangGraph.

Assistant:

Thought:
The user wants to create a new task.

Action:
create_task

Action Input:
{
    "title": "Learn LangGraph",
    "status": "to-do",
    "priority": "high"
}

Final Answer:

------------------------------------------------

Example 2

User:
Show my tasks.

Assistant:

Thought:
The user wants to view all tasks.

Action:
get_tasks

Action Input:
{}

Final Answer:

------------------------------------------------

Example 3

User:
Hello

Assistant:

Thought:
The user is greeting me, so no tool is required.

Action:
NONE

Action Input:
{}

Final Answer:
Hello! How can I help you manage your tasks today?

========================
IMPORTANT
========================

Never skip the required format.
Never call tools that do not exist.
Always produce valid JSON inside Action Input.
Never place explanations outside the required sections.
`;

export interface ParsedReAct {
  thought: string;
  action: string | null;
  action_input: Record<string, any>;
  final_answer: string;
}

export function parseReActResponse(response: string): ParsedReAct {
  const result: ParsedReAct = {
    thought: "",
    action: null,
    action_input: {},
    final_answer: "",
  };

  const thoughtMatch = response.match(/Thought:\s*([\s\S]*?)(?=\nAction:|$)/i);
  const actionMatch = response.match(/Action:\s*([\s\S]*?)(?=\nAction Input:|$)/i);
  const actionInputMatch = response.match(/Action Input:\s*([\s\S]*?)(?=\n(?:Observation:|Final Answer:)|$)/i);
  const finalAnswerMatch = response.match(/Final Answer:\s*([\s\S]*)$/i);

  if (thoughtMatch) result.thought = thoughtMatch[1].trim();
  if (actionMatch) result.action = actionMatch[1].trim();

  if (actionInputMatch) {
    const text = actionInputMatch[1].trim();
    if (text && text !== "{}") {
      try {
        result.action_input = JSON.parse(text);
      } catch {
        result.action_input = { title: text };
      }
    }
  }

  if (finalAnswerMatch) {
    result.final_answer = finalAnswerMatch[1].trim();
  }

  return result;
}

async function executeTool(action: string, actionInput: Record<string, any>): Promise<Record<string, any>> {
  if (action === "create_task") {
    const res = await createTask(
      actionInput.title || "Untitled Task",
      actionInput.status || "to-do",
      actionInput.priority || "high"
    );
    return {
      success: true,
      message: `Task "${actionInput.title || "Untitled Task"}" created successfully.`,
      task_id: res.id,
    };
  }

  if (action === "get_tasks") {
    const tasks = await getTasks();
    return {
      success: true,
      message: "Tasks retrieved successfully.",
      tasks,
    };
  }

  return {
    success: false,
    message: `Unknown action: ${action}`,
  };
}

export async function runReActAgent(userInput: string): Promise<{
  answer: string;
  thought?: string;
  action?: string | null;
  action_input?: Record<string, any>;
  observation?: Record<string, any>;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Graceful fallback agent when API key is not yet set
    const lower = userInput.toLowerCase();
    if (lower.includes("show") || lower.includes("list") || lower.includes("my tasks") || lower.includes("get tasks")) {
      const observation = await executeTool("get_tasks", {});
      const tasks = (observation.tasks as any[]) || [];
      const listStr = tasks.map((t) => `• [${t.priority || "Medium"}] ${t.title} (${t.status || "To do"})`).join("\n");
      return {
        thought: "User requested their current task list.",
        action: "get_tasks",
        action_input: {},
        observation,
        answer: `Here are your current tasks in Notion:\n\n${listStr || "No tasks found."}`,
      };
    }

    if (lower.startsWith("create") || lower.startsWith("add") || lower.includes("new task")) {
      const cleanTitle = userInput
        .replace(/^(create|add|make|schedule)(\s+(a|an))?(\s+(new|high|medium|low))?(\s+task)?(\s+(called|named|for))?/i, "")
        .trim() || "New Planning Task";
      const priority = lower.includes("high") ? "high" : lower.includes("low") ? "low" : "medium";
      const observation = await executeTool("create_task", { title: cleanTitle, priority, status: "to-do" });
      return {
        thought: `User wants to create a new task: ${cleanTitle}`,
        action: "create_task",
        action_input: { title: cleanTitle, priority, status: "to-do" },
        observation,
        answer: `I've created the task "${cleanTitle}" with ${priority} priority in your Notion workspace.`,
      };
    }

    return {
      answer: `Hello! I'm your ReAct Notion planning assistant. You can ask me to view your tasks, create new tasks, plan your schedule, or analyze attachments.\n\n(Tip: Add GEMINI_API_KEY to enable full conversational intelligence)`,
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `${SYSTEM_PROMPT}\n\nUser:\n${userInput}\n`;

  const firstResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const responseText = firstResponse.text || "";
  const parsed = parseReActResponse(responseText);

  if (parsed.action && parsed.action !== "NONE") {
    const observation = await executeTool(parsed.action, parsed.action_input);

    const followUp = `${prompt}\n\nAssistant:\n${responseText}\n\nObservation:\n${JSON.stringify(
      observation,
      null,
      2
    )}\n\nUse the Observation to write the Final Answer for the user.\nIf the Observation contains tasks, list them clearly.\nIf it reports an error, explain it simply.`;

    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: followUp,
    });

    const finalResponseText = finalResponse.text || "";
    const finalParsed = parseReActResponse(finalResponseText);

    return {
      thought: parsed.thought,
      action: parsed.action,
      action_input: parsed.action_input,
      observation,
      answer: finalParsed.final_answer || finalResponseText || (observation.message as string) || "Done.",
    };
  }

  return {
    thought: parsed.thought || undefined,
    answer: parsed.final_answer || responseText || "I couldn't generate an answer.",
  };
}
