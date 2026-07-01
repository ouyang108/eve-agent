/**
 * 持久化记忆
 */
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { rememberFact } from "../lib/memory.js";

export default defineTool({
  description:
    "Store a verified project, user, or session memory. Only store facts confirmed by tools or explicit user preferences.",

  inputSchema: z.object({
    scope: z.enum(["project", "user", "session"]),
    key: z.string().min(1),
    value: z.string().min(1),
    confidence: z.number().min(0).max(1).default(0.8),
  }),

  // 中文注释：保存一条已经由工具或用户确认过的事实，供后续会话复用。
  async execute(input) {
    const item = await rememberFact(input);

    await appendAudit({
      type: "tool.remember_fact",
      detail: { scope: item.scope, key: item.key, confidence: item.confidence },
    });

    return item;
  },
});
