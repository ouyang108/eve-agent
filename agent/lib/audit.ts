import { join, dirname } from "path";
import { mkdir, appendFile } from "fs/promises";
import { getWorksapceRoot } from "./workspace";

export interface AudioRecord {
  type: string;
  detail: unknown;
  createdAt?: string;
}

export async function appendAudit(record: AudioRecord) {
  const root = getWorksapceRoot();
  const filePath = join(root, ".codecare", "audit.log");

  //   日志
  const line = JSON.stringify({
    ...record,
    createdAt: record.createdAt ?? new Date().toISOString(),
  });
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, line + "\n", "utf8");
}
