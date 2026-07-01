/**
 * 保存报告
 */
import fs from "node:fs/promises";
import path from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { getWorksapceRoot } from "../lib/workspace.js";

export default defineTool({
  description: "Save the final codebase maintenance report as a Markdown file.",

  inputSchema: z.object({
    title: z.string().min(1),
    markdown: z.string().min(1),
  }),

  // 把最终维护报告保存成 Markdown 文件。
  async execute({ title, markdown }) {
    const root = getWorksapceRoot();
    const dir = path.join(root, ".codecare", "reports");

    // 简单生成安全文件名，避免标题中出现路径字符。
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    const filePath = path.join(dir, `${Date.now()}-${slug || "report"}.md`);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, markdown, "utf8");

    await appendAudit({
      type: "tool.save_report",
      detail: { title, path: filePath },
    });

    return {
      path: filePath,
    };
  },
});
