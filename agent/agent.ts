import { defineAgent } from "eve";
import { deepseek } from "@ai-sdk/deepseek";
export default defineAgent({
  // model: "deepseek/deepseek-v4-flash"
  model: deepseek("deepseek-chat"),
  description:
    // 本地代码库维护智能体，用于扫描项目、计划工作、安全编辑文件、运行验证和编写简洁的报告。
    "A local codebase maintenance agent that scans projects, plans work, safely edits files, runs verification, and writes concise reports.",
});
