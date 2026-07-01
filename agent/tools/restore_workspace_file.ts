/**
 * 文件恢复 需要审批
 */

import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { backupExists, backupFile, restoreFile } from "../lib/backup.js";

export default defineTool({
  description:
    "Restore a workspace file from a previous backup. This writes to the workspace and always requires human approval.",
  inputSchema: z.object({
    path: z
      .string()
      .min(1)
      .describe("Workspace-relative file path to restore."),
    backupId: z
      .string()
      .min(1)
      .describe(
        "Backup id returned by list_file_backups or write_workspace_file.",
      ),
    reason: z.string().min(1).describe("Why this restore is needed."),
  }),
  needsApproval: always(),
  async execute({ path, backupId, reason }) {
    try {
      if (!(await backupExists(backupId))) {
        return {
          ok: false,
          path,
          backupId,
          error: `Backup not found: ${backupId}`,
        };
      }

      // 恢复也是写操作，所以也需要备份
      const preRestoreBackupId = await backupFile(path);
      await restoreFile(backupId, path);
      await appendAudit({
        type: "tool.restore_workspace_file",
        detail: { path, backupId, reason, preRestoreBackupId },
      });
      return {
        ok: true,
        path,
        backupId,
        preRestoreBackupId,
        message: "File restored from backup. Run verification before finalizing.",
      };
    } catch (error) {
      return {
        ok: false,
        path,
        backupId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
