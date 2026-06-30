import { dirname, join } from "path";
import { mkdir, writeFile, readFile } from "fs/promises";
import { getWorksapceRoot } from "./workspace";
export interface MemoryItem {
  id: string;
  scope: "project" | "user" | "session";
  key: string;
  value: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

function memoryPath(): string {
  return join(getWorksapceRoot(), ".codecare", "memory.json");
}

export async function listMemory() {
  try {
    const content = await readFile(memoryPath(), "utf8");
    return JSON.parse(content) as MemoryItem[];
  } catch (error) {
    // 第一次没有
    return [];
  }
}
export async function rememberFact(
  input: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">,
) {
  const items = await listMemory();
  const now = new Date().toISOString();

  // 同一个 scope + key 只保留一条，避免记忆无限膨胀。
  const existing = items.find(
    (item) => item.scope === input.scope && item.key === input.key,
  );
  if (existing) {
    existing.value = input.value;
    existing.confidence = input.confidence;
    existing.updatedAt = now;
    await saveMemory(items);
    return existing;
  }
  const item: MemoryItem = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  items.push(item);
  await saveMemory(items);
  return item;
}
async function saveMemory(items: MemoryItem[]): Promise<void> {
  const filePath = memoryPath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(items, null, 2), "utf8");
}
