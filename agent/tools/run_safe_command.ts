/**
 * 安全命令执行
 */
import { spawn } from "node:child_process";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { appendAudit } from "../lib/audit.js";
import { checkCommandPolicy } from "../lib/command-policy.js";
import { resolveInsideWorkspace } from "../lib/workspace.js";

export default defineTool({
  description:
    "Run a safe shell command inside the workspace. Destructive, network, deploy, and publish commands are blocked.",
  inputSchema: z.object({
    command: z
      .string()
      .min(1)
      .describe("Command to run, such as npm test or pnpm typecheck."),
    cwd: z
      .string()
      .default(".")
      .describe("Workspace-relative working directory."),
    timeoutMs: z.number().int().positive().max(120_000).default(30_000),
  }),
  async execute({ command, cwd, timeoutMs }) {
    const policy = checkCommandPolicy(command);
    // 命令是否被允许执行
    if (!policy.allowed) {
      await appendAudit({
        type: "tool.run_safe_command.blocked",
        detail: { command, reason: policy.reason },
      });

      return {
        ok: false,
        blocked: true,
        reason: policy.reason,
      };
    }
    const workingDirectory = resolveInsideWorkspace(cwd);

    const result = await new Promise<{
      exitCode: number | null;
      output: string;
    }>((resolve, reject) => {
      const child = spawn(command, {
        cwd: workingDirectory,
        shell: true,
        windowsHide: true,
      });

      let output = "";

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Command timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const append = (chunk: Buffer) => {
        output += chunk.toString("utf8");

        // 命令输出不能无限进入上下文，否则 Agent 会被日志淹没。
        if (output.length > 80_000) {
          output = output.slice(0, 80_000) + "\n[output truncated]";
          child.kill("SIGTERM");
        }
      };

      child.stdout.on("data", append);
      child.stderr.on("data", append);

      child.on("error", reject);

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        resolve({ exitCode, output });
      });
    });

    await appendAudit({
      type: "tool.run_safe_command",
      detail: { command, cwd, exitCode: result.exitCode },
    });

    return {
      ok: result.exitCode === 0,
      exitCode: result.exitCode,
      output: result.output || `Command exited with code ${result.exitCode}`,
    };
  },
});
