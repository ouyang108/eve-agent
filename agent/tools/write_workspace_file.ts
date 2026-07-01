/**
 * 写入工作空间文件 需要审批
 */
import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { backupFile } from "../lib/backup.js";
import { resolveInsideWorkspace } from "../lib/workspace.js";
import { dirname } from "path";
import { mkdir, writeFile } from "fs/promises";

export default defineTool({
  description:
    "Write a UTF-8 text file inside the workspace. This tool creates a backup before writing and always requires human approval.",
  inputSchema: z.object({
    path: z.string().min(1).describe("Workspace-relative file path."),
    content: z.string().describe("Full new file content."),
    reason: z.string().min(1).describe("Why this file needs to be changed."),
  }),
  needsApproval: always(),
  // 写入workspace文件：写入前备份
  async execute({ path, content, reason }) {
    try {
      //   备份文件
      const backupId = await backupFile(path);
      const filePath = resolveInsideWorkspace(path);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf8");
      //  写入审计记录
      await appendAudit({
        type: "tool.write_workspace_file",
        detail: {
          path,
          reason,
          backupId,
          bytes: Buffer.byteLength(content, "utf8"),
        },
      });
      return {
        path,
        backupId,
        bytes: Buffer.byteLength(content, "utf8"),
        message: "File written. Run verification before finalizing.",
      };
    } catch (error) {
      return {
        message: `Error writing file: ${error}`,
      };
    }
  },
});
