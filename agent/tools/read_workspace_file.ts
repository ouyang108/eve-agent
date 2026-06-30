/**
 * 读取工作空间文件
 */
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { resolveInsideWorkspace } from "../lib/workspace.js";
import { readFile } from "fs/promises";
export default defineTool({
  description: "Read a UTF-8 text file inside the configured workspace.",
  inputSchema: z.object({
    path: z.string().min(1).describe("Workspace-relative file path."),
    maxBytes: z.number().int().positive().default(120_000),
  }),
  async execute({ path, maxBytes }) {
    try {
      // 解析路径
      const filePath = resolveInsideWorkspace(path);
      const buffer = await readFile(filePath);
      await appendAudit({
        type: "tool.read_workspace_file",
        detail: { path, bytes: buffer.byteLength },
      });
      return {
        path,
        content: buffer.subarray(0, maxBytes).toString("utf8"),
        bytes: buffer.byteLength,
        // 是否截断
        truncated: buffer.byteLength > maxBytes,
      };
    } catch (error) {
      return {
        message: (error as Error).message,
      };
    }
  },
});
