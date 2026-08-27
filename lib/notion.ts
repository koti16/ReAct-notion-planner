export interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface NotionConnectionStatus {
  connected: boolean;
  hasToken: boolean;
  hasDatabaseId: boolean;
  workspaceName?: string;
  error?: string;
}

// In-memory task storage fallback when NOTION_TOKEN is not configured
let localTasks: NotionTask[] = [
  { id: "task-1", title: "Finalize Q3 product strategy", status: "In progress", priority: "High" },
  { id: "task-2", title: "Review design system updates", status: "Done", priority: "Medium" },
  { id: "task-3", title: "Prepare weekly team update", status: "to-do", priority: "Low" },
  { id: "task-4", title: "Research onboarding patterns", status: "to-do", priority: "Medium" },
];

export async function verifyNotionConnection(): Promise<NotionConnectionStatus> {
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  const hasToken = Boolean(token && token.trim());
  const hasDatabaseId = Boolean(dbId && dbId.trim());

  if (!hasToken || !hasDatabaseId) {
    let errorMsg = "Credentials missing in environment variables.";
    if (!hasToken && !hasDatabaseId) {
      errorMsg = "Both NOTION_TOKEN and NOTION_DATABASE_ID are not set.";
    } else if (!hasToken) {
      errorMsg = "NOTION_TOKEN is missing.";
    } else {
      errorMsg = "NOTION_DATABASE_ID is missing.";
    }

    return {
      connected: false,
      hasToken,
      hasDatabaseId,
      error: errorMsg,
    };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const title =
        data.title?.[0]?.plain_text ||
        data.title?.[0]?.text?.content ||
        "Notion Workspace Database";

      return {
        connected: true,
        hasToken: true,
        hasDatabaseId: true,
        workspaceName: title,
      };
    } else {
      let detail = "Could not reach Notion database.";
      try {
        const json = await res.json();
        if (json.message) detail = json.message;
      } catch {}

      return {
        connected: false,
        hasToken: true,
        hasDatabaseId: true,
        error: detail,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      hasToken: true,
      hasDatabaseId: true,
      error: err?.message || "Network error while connecting to Notion.",
    };
  }
}

export async function getTasks(): Promise<NotionTask[]> {
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    return localTasks;
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.warn("Notion query failed, using local store:", await res.text());
      return localTasks;
    }

    const data = await res.json();
    return (data.results || []).map((page: any) => {
      const titleProp = page.properties?.Name || page.properties?.Title || page.properties?.Task;
      const title =
        titleProp?.title?.[0]?.plain_text ||
        titleProp?.title?.[0]?.text?.content ||
        "Untitled Task";

      const statusProp = page.properties?.Status || page.properties?.State;
      const status = statusProp?.status?.name || statusProp?.select?.name || "to-do";

      const priorityProp = page.properties?.Priority;
      const priority = priorityProp?.select?.name || "Medium";

      return {
        id: page.id,
        title,
        status,
        priority,
      };
    });
  } catch (err) {
    console.error("Notion getTasks error:", err);
    return localTasks;
  }
}

export async function createTask(
  title: string,
  status: string = "to-do",
  priority: string = "High"
): Promise<{ id: string; title: string }> {
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  const id = `task-${Date.now()}`;
  const newTask: NotionTask = { id, title, status, priority };
  localTasks = [newTask, ...localTasks];

  if (!token || !dbId) {
    return { id, title };
  }

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name: {
            title: [{ text: { content: title } }],
          },
          Status: {
            status: { name: status },
          },
          Priority: {
            select: { name: priority },
          },
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { id: data.id, title };
    }
  } catch (err) {
    console.error("Notion createTask error:", err);
  }

  return { id, title };
}

export async function updateTaskStatus(page_id: string, status: string): Promise<void> {
  localTasks = localTasks.map((t) => (t.id === page_id ? { ...t, status } : t));

  const token = process.env.NOTION_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          Status: {
            status: { name: status },
          },
        },
      }),
    });
  } catch (err) {
    console.error("Notion updateTaskStatus error:", err);
  }
}

export async function archiveTask(page_id: string): Promise<void> {
  localTasks = localTasks.filter((t) => t.id !== page_id);

  const token = process.env.NOTION_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archived: true,
      }),
    });
  } catch (err) {
    console.error("Notion archiveTask error:", err);
  }
}
