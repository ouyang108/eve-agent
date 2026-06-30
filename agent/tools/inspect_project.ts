/**
 * 扫描项目工具
 */
import { join } from "path";
import { readFile, access } from "fs/promises";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { getWorksapceRoot } from "../lib/workspace.js";

async function exists(filePath: string) {
  try {
    // 能不能访问 用来判断某个文件或目录是否存在
    await access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export default defineTool({
  description:
    "Inspect the workspace and return project type, important files, package manager, and available scripts.",
  inputSchema: z.object({}),
  async execute() {
    try {
      const root = getWorksapceRoot();
      const data: Record<string, unknown> = {};
      const facts: string[] = [];
      const packageJsonPath = join(root, "package.json");
      if (await exists(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
        facts.push("Detected Node.js project."); //zh: 检测到 Node.js 项目。
        // 包管理器判断影响后续应该运行 npm、pnpm 还是 yarn。
        data.packageManager = (await exists(join(root, "pnpm-lock.yaml")))
          ? "pnpm"
          : (await exists(join(root, "yarn.lock")))
            ? "yarn"
            : "npm";

        data.scripts = packageJson.scripts ?? {};
        data.packageName = packageJson.name;
      }
      if (await exists(join(root, "pyproject.toml"))) {
        facts.push("Detected Python project.");
      }

      if (await exists(join(root, "Cargo.toml"))) {
        facts.push("Detected Rust project.");
      }
      for (const file of [
        "README.md",
        "tsconfig.json",
        "vite.config.ts",
        ".env.example",
      ]) {
        if (await exists(join(root, file))) {
          facts.push(`Found ${file}.`);
        }
      }
      await appendAudit({
        type: "inspect_project",
        detail: { facts, data },
      });
      return {
        facts,
        data,
      };
    } catch (error) {
      return {
        message: (error as Error).message,
      };
    }
  },
});
