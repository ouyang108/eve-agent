/**
 * 任务更新
 */
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { upsertTask } from "../lib/tasks.js";

export default defineTool({
  description: "Create or update a tracked maintenance task.",

  inputSchema: z.object({
    id: z
      .string()
      .optional()
      .describe("Existing task id. Omit to create a new task."),
    title: z.string().min(1),
    description: z.string().min(1),
    status: z.enum([
      "pending",
      "in_progress",
      "completed",
      "failed",
      "skipped",
    ]),
    risk: z.enum(["low", "medium", "high"]),
    evidence: z.array(z.string()).default([]),
    result: z.string().optional(),
  }),

  // 中文注释：创建或更新任务状态，让长流程维护工作有可追踪的进度。
  async execute(input) {
    const task = await upsertTask(input);

    await appendAudit({
      type: "tool.update_task",
      detail: {
        id: task.id,
        title: task.title,
        status: task.status,
        risk: task.risk,
      },
    });

    return task;
  },
});
