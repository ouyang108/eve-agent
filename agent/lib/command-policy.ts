/**
 * 命令策略
 */
export interface CommandPolicyResult {
  allowed: boolean;
  reason?: string;
}
const blockedFragments = [
  "rm -rf /",
  "format ",
  "shutdown",
  "reboot",
  "diskpart",
  "reg delete",
  "npm publish",
  "pnpm publish",
  "yarn publish",
  "vercel deploy",
  "eve deploy",
];

const networkFragments = ["curl ", "wget ", "ssh ", "scp "];

/**
 * 检查命令策略
 * @param command 命令
 * @returns 命令策略结果
 */
export function checkCommandPolicy(command: string): CommandPolicyResult {
  const normalizedCommand = command.trim().toLowerCase();
  //    // 直接拒绝明显破坏性或生产发布类命令。
  for (const fragment of blockedFragments) {
    if (normalizedCommand.includes(fragment)) {
      return {
        allowed: false,
        reason: `命令包含 ${fragment}`,
      };
    }
  }
  //   默认不让agent访问网络
  for (const fragment of networkFragments) {
    if (normalizedCommand.includes(fragment)) {
      return {
        allowed: false,
        reason: `Network command blocked: ${fragment}`,
      };
    }
  }
  return { allowed: true };
}
