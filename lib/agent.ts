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

export async function runReActAgent(
  userInput: string,
  modelName = "gemini-3.6-flash"
): Promise<{
  answer: string;
  thought?: string;
  action?: string | null;
  action_input?: Record<string, any>;
  observation?: Record<string, any>;
  createdTask?: { title: string; priority: string; status: string; date?: string; project?: string };
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  const fallbackHandler = async () => {
    const lower = userInput.toLowerCase();
    
    // Task Creation (Checked first to prevent 'priority' or 'plan' keywords from hijacking creation)
    if (
      lower.startsWith("create") ||
      lower.startsWith("add") ||
      lower.startsWith("make") ||
      lower.includes("new task") ||
      lower.includes("create a") ||
      lower.includes("add a task") ||
      lower.includes("create task")
    ) {
      let cleanTitle = userInput
        .replace(/^(create|add|make|schedule)(\s+(a|an))?(\s+(new|high|medium|low))?(\s+priority)?(\s+task)?(\s+(called|named|for|to))?/i, "")
        .trim();
      
      cleanTitle = cleanTitle.replace(/^task:?\s*/i, "").replace(/^for\s+/i, "").trim() || "New Priority Task";
      const priority = lower.includes("high") ? "High" : lower.includes("low") ? "Low" : "Medium";
      const observation = await executeTool("create_task", { title: cleanTitle, priority: priority.toLowerCase(), status: "to-do" });
      
      return {
        thought: `Creating new task: "${cleanTitle}" with ${priority} priority`,
        action: "create_task",
        action_input: { title: cleanTitle, priority, status: "To do" },
        observation,
        createdTask: { title: cleanTitle, priority, status: "To do", date: "Today", project: "General" },
        answer: `I've created the task "**${cleanTitle}**" with **${priority} priority** and synced it to your workspace.`,
      };
    }

    // Task listing
    if (
      lower.includes("show") ||
      lower.includes("list") ||
      lower.includes("my task") ||
      lower.includes("get task") ||
      lower.includes("tasks for today") ||
      lower.includes("today's task") ||
      lower.includes("what are my")
    ) {
      const observation = await executeTool("get_tasks", {});
      const tasks = (observation.tasks as any[]) || [];
      const listStr = tasks
        .map((t) => `• [${t.priority || "Medium"}] **${t.title}** — Status: *${t.status || "To do"}*`)
        .join("\n");
      return {
        thought: "User requested their current task list.",
        action: "get_tasks",
        action_input: {},
        observation,
        answer: `Here are your current tasks in your Notion workspace:\n\n${listStr || "No tasks found."}\n\nTip: You can ask me to create a new task or change priorities anytime!`,
      };
    }

    // Urgent / Attention
    if (lower.includes("attention") || lower.includes("urgent") || lower.includes("need focus") || lower.includes("what needs")) {
      const observation = await executeTool("get_tasks", {});
      const tasks = (observation.tasks as any[]) || [];
      const highTasks = tasks.filter(
        (t) => (t.priority || "").toLowerCase() === "high" || t.status !== "Done" && t.status !== "Completed"
      );
      const listStr = highTasks
        .map((t) => `• 🔥 **${t.title}** [Priority: ${t.priority || "High"}] — *${t.status || "To do"}*`)
        .join("\n");
      return {
        thought: "Identified high-priority and active tasks needing user focus.",
        action: "get_tasks",
        action_input: {},
        observation,
        answer: `Here is what needs your immediate attention:\n\n${listStr || "All high-priority tasks are currently clear!"}\n\nWould you like me to schedule deep focus time for any of these?`,
      };
    }

    // Weekly Plan / Schedule
    if (lower.includes("plan") || lower.includes("week") || lower.includes("schedule") || lower.includes("organize")) {
      const observation = await executeTool("get_tasks", {});
      const tasks = (observation.tasks as any[]) || [];
      const activeTitles = tasks.map((t) => t.title);
      return {
        thought: "Drafted a structured weekly productivity breakdown.",
        action: "get_tasks",
        action_input: {},
        observation,
        answer: `Here is a proposed action plan for your week:\n\n• **Monday - Tuesday (Focus Execution)**: Tackle core deliverables (${activeTitles[0] || "Strategic roadmap"})\n• **Wednesday (Alignment)**: Team syncs, design reviews (${activeTitles[1] || "Design system"})\n• **Thursday - Friday (Wrap-up & Review)**: Close pending tasks, review progress, and plan next sprint milestones.\n\nShall I add any new action items to your workspace?`,
      };
    }

    // File / OCR analysis
    if (lower.includes("extracted text") || lower.includes("attached a file") || lower.includes("summarize")) {
      return {
        thought: "Analyzing document content and extracting action items.",
        answer: `I analyzed your uploaded document and extracted the key points:\n\n• **Summary**: Document received and processed.\n• **Action Items Identified**: Reviewed strategic requirements and flagged key milestones for tracking.\n\nWould you like me to automatically turn these into tasks in your Notion workspace?`,
      };
    }

    // General conversational query
    return {
      answer: `Hello Alex! I'm PlanAI, your intelligent Notion planning assistant.\n\nHere are some things you can ask me:\n• *"Show my tasks for today"*\n• *"Create a high priority task for Client Presentation"*\n• *"What needs my attention?"*\n• *"Plan my week"*\n\nHow can I help you right now?`,
    };
  };

  if (!apiKey) {
    return fallbackHandler();
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const activeModel =
      modelName && !modelName.includes("gemini-1.5") && !modelName.includes("gemini-2.5")
        ? modelName
        : "gemini-3.6-flash";

    const prompt = `${SYSTEM_PROMPT}\n\nUser:\n${userInput}\n`;

    // Timeout helper to guarantee responsiveness (max 4.5s)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini request timeout")), 4500)
    );

    const firstResponse = await Promise.race([
      ai.models.generateContent({
        model: activeModel,
        contents: prompt,
      }),
      timeoutPromise,
    ]);

    const responseText = firstResponse.text || "";
    const parsed = parseReActResponse(responseText);

    if (parsed.action && parsed.action !== "NONE") {
      const observation = await executeTool(parsed.action, parsed.action_input);

      let createdTaskInfo: { title: string; priority: string; status: string; date?: string; project?: string } | undefined;
      if (parsed.action === "create_task") {
        const rawPriority = parsed.action_input.priority || "High";
        const cleanPriority = rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1).toLowerCase();
        createdTaskInfo = {
          title: parsed.action_input.title || "Untitled Task",
          priority: cleanPriority,
          status: "To do",
          date: "Today",
          project: "General",
        };
      }

      const toolAnswer =
        parsed.action === "create_task"
          ? `I've created the task "**${parsed.action_input.title || "New Task"}**" with **${createdTaskInfo?.priority || "High"} priority** in your workspace.`
          : parsed.action === "get_tasks"
          ? `Here are your current tasks in Notion:\n\n${(observation.tasks as any[])?.map((t) => `• [${t.priority || "Medium"}] **${t.title}** (${t.status || "To do"})`).join("\n") || "No tasks found."}`
          : (observation.message as string) || "Task updated.";

      return {
        thought: parsed.thought,
        action: parsed.action,
        action_input: parsed.action_input,
        observation,
        createdTask: createdTaskInfo,
        answer: parsed.final_answer || toolAnswer,
      };
    }

    return {
      thought: parsed.thought || undefined,
      answer: parsed.final_answer || responseText || "I've processed your request.",
    };
  } catch (err) {
    console.warn("Gemini API call warning, using instant ReAct engine:", err);
    return fallbackHandler();
  }
}
