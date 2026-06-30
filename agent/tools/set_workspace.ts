/**
 * 这个工具只设置当前 Eve 会话的工作区，不修改 `.env`。
 * 例如用户说“检查 `E:\daima\gitee\foo`”，Agent 应先调用 `set_workspace`，
 * 后续 `inspect_project`、`search_text`、`read_workspace_file`、`run_safe_command` 都会使用这个目录。
 */
import { stat } from "fs/promises";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { setWorkspaceRoot } from "../lib/workspace.js";

export default defineTool({
  description:
    "Set the local project directory that subsequent maintenance tools should inspect, read, write, and verify.",
  inputSchema: z.object({
    path: z
      .string()
      .min(1)
      .describe("Absolute or process-relative path to the project workspace."),
  }),
  async execute({ path }) {
    try {
      const root = setWorkspaceRoot(path);
      // 文件的体积、创建时间、修改时间
      const stat_res = await stat(root);
      if (!stat_res.isDirectory()) {
        throw new Error(`Workspace is not a directory: ${root}`);
      }
      await appendAudit({
        type: "set_workspace",
        detail: { root },
      });
      return {
        root,
        message:
          "Workspace set for this session. Future tools will use this directory.",
      };
    } catch (error) {
      return {
        message: (error as Error).message,
      };
    }
  },
});
