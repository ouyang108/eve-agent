/**
 * 文本搜索
 */
import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";
import { spawn } from "node:child_process";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { resolveInsideWorkspace } from "../lib/workspace.js";
// 忽略的目录
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".eve",
]);

/**
 * 文本搜索 递归搜索目录下的所有文件
 * @param query 搜索查询
 * @param root 搜索根目录
 * @returns 搜索结果
 */
async function nodeSearchFallback(query: string, root: string) {
  const pattern = new RegExp(query, "i");
  const results: string[] = [];
  async function walk(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const content = await readFile(fullPath, "utf8").catch(() => null);
      if (content === null) {
        continue;
      }

      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          results.push(`${relative(root, fullPath)}:${index + 1}:${line}`);
        }
      });
    }
  }
  await walk(root);
  return results.join("\n");
}
/**
 * 文本搜索 ripgrep
 * @param query 搜索查询
 * @param cwd 搜索根目录
 * @returns 搜索结果
 */
function runRg(query: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 优先使用 ripgrep，因为它快，并且适合大型代码库。
    const child = spawn(
      "rg",
      ["-n", "--hidden", "--glob", "!node_modules", query],
      {
        cwd,
        shell: false,
        windowsHide: true,
      },
    );

    let output = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", async (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        // 用户机器没有安装 rg 时，退回到 Node.js 递归搜索。
        try {
          resolve(await nodeSearchFallback(query, cwd));
        } catch (fallbackError) {
          reject(fallbackError);
        }
        return;
      }

      reject(error);
    });

    child.on("close", (code) => {
      // rg 找不到结果时退出码是 1，这不是工具错误。
      if (code && code > 1) {
        reject(new Error(stderr || `rg failed with code ${code}`));
        return;
      }

      resolve(output);
    });
  });
}

export default defineTool({
  description:
    "Search text in the workspace using ripgrep, with a Node.js fallback when rg is unavailable.",
  inputSchema: z.object({
    query: z.string().min(1).describe("The regex or plain text to search for."),
    path: z
      .string()
      .default(".")
      .describe("Workspace-relative directory to search."),
  }),
  // 在当前 workspace 的指定目录中搜索文本或正则，并返回匹配结果。
  async execute({ query, path }) {
    const cwd = resolveInsideWorkspace(path);
    const output = await runRg(query, cwd);
    await appendAudit({
      type: "tool.search_text",
      detail: { query, path, hasMatches: output.length > 0 },
    });
    // 限制返回长度，避免把 Agent 上下文撑爆。
    return {
      matches: output.slice(0, 20_000) || "No matches.",
      truncated: output.length > 20_000,
    };
  },
});
