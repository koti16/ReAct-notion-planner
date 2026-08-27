import { Client } from "@notionhq/client";

export interface TaskRecord {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
}

// In-memory fallback database when Notion credentials are not configured or unreachable
const inMemoryTasks: TaskRecord[] = [
  { id: "task-1", title: "Finalize Q3 product strategy", status: "In progress", priority: "High" },
  { id: "task-2", title: "Review design system updates", status: "Done", priority: "Medium" },
  { id: "task-3", title: "Prepare weekly team update", status: "to-do", priority: "Low" },
  { id: "task-4", title: "Research onboarding patterns", status: "to-do", priority: "Medium" },
];

const STATUS_MAP: Record<string, string> = {
  "to do": "to-do",
  "to-do": "to-do",
  "todo": "to-do",
  "not started": "Not started",
  "in progress": "In progress",
  "completed": "Done",
  "complete": "Done",
  "done": "Done",
};

const PRIORITY_MAP: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function normStatus(status?: string | null): string {
  return STATUS_MAP[(status || "").trim().toLowerCase()] || "to-do";
}

function normPriority(priority?: string | null): string {
  const p = (priority || "").trim().toLowerCase();
  return PRIORITY_MAP[p] || "Medium";
}

function getNotionClient() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return null;
  }
  return {
    client: new Client({ auth: token }),
    databaseId,
  };
}

export async function getTasks(): Promise<TaskRecord[]> {
  const config = getNotionClient();
  if (!config) {
    return [...inMemoryTasks];
  }

  try {
    const response = await config.client.databases.query({
      database_id: config.databaseId,
    });

    const tasks: TaskRecord[] = [];
    for (const page of response.results as any[]) {
      const properties = page.properties || {};
      let title = "Untitled";
      if (properties.Task?.title?.[0]?.text?.content) {
        title = properties.Task.title[0].text.content;
      } else if (properties.Name?.title?.[0]?.text?.content) {
        title = properties.Name.title[0].text.content;
      } else if (properties.title?.title?.[0]?.text?.content) {
        title = properties.title.title[0].text.content;
      }

      let status: string | null = null;
      if (properties.Status?.status?.name) {
        status = properties.Status.status.name;
      } else if (properties.Status?.select?.name) {
        status = properties.Status.select.name;
      }

      let priority: string | null = null;
      if (properties.Priority?.select?.name) {
        priority = properties.Priority.select.name;
      }

      tasks.push({
        id: page.id,
        title,
        status,
        priority,
      });
    }

    return tasks;
  } catch (error) {
    console.warn("Notion query failed, using in-memory store:", error);
    return [...inMemoryTasks];
  }
}

export async function createTask(title: string, status = "to-do", priority = "high"): Promise<{ id: string }> {
  const config = getNotionClient();
  const normalizedStatus = normStatus(status);
  const normalizedPriority = normPriority(priority);

  if (config) {
    try {
      const response = await config.client.pages.create({
        parent: { database_id: config.databaseId },
        properties: {
          Task: {
            title: [
              {
                text: { content: title },
              },
            ],
          },
          Status: {
            status: { name: normalizedStatus },
          },
          Priority: {
            select: { name: normalizedPriority },
          },
        } as any,
      });
      const id = response.id;
      inMemoryTasks.unshift({ id, title, status: normalizedStatus, priority: normalizedPriority });
      return { id };
    } catch (error) {
      console.warn("Notion create_task failed, creating in-memory:", error);
    }
  }

  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  inMemoryTasks.unshift({ id, title, status: normalizedStatus, priority: normalizedPriority });
  return { id };
}

export async function updateTaskStatus(pageId: string, status: string): Promise<boolean> {
  const config = getNotionClient();
  const normalizedStatus = normStatus(status);

  // Update in-memory
  const found = inMemoryTasks.find((t) => t.id === pageId);
  if (found) {
    found.status = normalizedStatus;
  }

  if (config) {
    try {
      await config.client.pages.update({
        page_id: pageId,
        properties: {
          Status: {
            status: { name: normalizedStatus },
          },
        } as any,
      });
      return true;
    } catch (error) {
      console.warn("Notion update_task_status failed:", error);
    }
  }

  return true;
}

export async function archiveTask(pageId: string): Promise<boolean> {
  const config = getNotionClient();

  const idx = inMemoryTasks.findIndex((t) => t.id === pageId);
  if (idx !== -1) {
    inMemoryTasks.splice(idx, 1);
  }

  if (config) {
    try {
      await config.client.pages.update({
        page_id: pageId,
        archived: true,
      });
      return true;
    } catch (error) {
      console.warn("Notion archive_task failed:", error);
    }
  }

  return true;
}
