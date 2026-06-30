import { join, dirname } from "path";
import { mkdir, appendFile, readFile } from "fs/promises";
import { getWorksapceRoot } from "./workspace";

/**
 * 审计记录
 * @param type 审计类型
 * @param detail 审计详情
 * @param createdAt 审计时间
 */
export interface AudioRecord {
  type: string;
  detail: unknown;
  createdAt?: string;
}
function auditPath() {
  return join(getWorksapceRoot(), ".codecare", "audit.log");
}
// 写入审计记录 为了后面列出所有操作记录
export async function appendAudit(record: AudioRecord) {
  const filePath = auditPath();

  //   日志
  const line = JSON.stringify({
    ...record,
    createdAt: record.createdAt ?? new Date().toISOString(),
  });
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, line + "\n", "utf8");
}
// 把以前发生过的操作记录读出来
/**
 * 读取审计日志，返回已经解析好的 JSONL 记录列表。
 */
export async function readAudit() {
  try {
    const content = await readFile(auditPath(), "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean) //去掉空行
      .map((line) => JSON.parse(line) as AudioRecord);
  } catch (error) {
    // 第一次运行，没有审计日志
    return [];
  }
}
