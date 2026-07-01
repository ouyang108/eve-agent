/**
 * 列出文件备份
 */
import { defineTool } from "eve/tools";
import { z } from "zod";
import { readAudit } from "../lib/audit.js";
import { toWorkspaceRelative } from "../lib/workspace.js";

function normalizePath(value: string) {
  return value.replaceAll("\\", "/");
}

function toComparablePath(value: string) {
  try {
    return normalizePath(toWorkspaceRelative(value));
  } catch {
    return normalizePath(value);
  }
}

export default defineTool({
  description:
    "List backup versions created before previous writes. Use this before restoring a file to an earlier version.",
  inputSchema: z.object({
    path: z
      .string()
      .optional()
      .describe("Optional workspace-relative file path to filter backups."),
    limit: z.number().int().positive().max(10).default(5),
  }),
  async execute({ path, limit }) {
    try {
      const records = await readAudit();
      const requestedPath = path ? normalizePath(path) : undefined;
      const backups = records
        .filter((record) => record.type === "tool.write_workspace_file")
        .map((record) => {
          const detail = record.detail as {
            path?: string;
            reason?: string;
            backupId?: string | null;
          };
          const itemPath = detail.path ? toComparablePath(detail.path) : undefined;

          return {
            path: itemPath,
            reason: detail.reason,
            backupId: detail.backupId,
            createdAt: record.createdAt,
          };
        })
        .filter((item) => item.backupId && item.path)
        .filter((item) =>
          requestedPath
            ? item.path === requestedPath || item.path?.endsWith(`/${requestedPath}`)
            : true,
        )
        .reverse()
        .slice(0, limit);

      return {
        ok: true,
        backups,
        message:
          backups.length > 0
            ? "Choose a backupId to restore, or ask the user which version to restore."
            : "No backups found.",
      };
    } catch (error) {
      return {
        ok: false,
        backups: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
