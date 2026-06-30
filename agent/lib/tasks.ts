/**
 * 任务状态管理
 */

import { getWorksapceRoot } from "./workspace.js";
import { join, dirname } from "path";
import { readFile, mkdir, writeFile } from "fs/promises";

/**
 * 任务状态
 * @description 任务状态
 * @enum {string}
 * @property {string} pending - 待处理
 * @property {string} in_progress - 进行中
 * @property {string} completed - 已完成
 * @property {string} failed - 失败
 * @property {string} skipped - 跳过
 */
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";
/**
 * 风险等级
 * @description 风险等级
 * @enum {string}
 * @property {string} low - 低风险
 * @property {string} medium - 中等风险
 * @property {string} high - 高风险
 */
export type RiskLevel = "low" | "medium" | "high";

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  risk: RiskLevel;
  evidence: string[];
  result?: string;
  createdAt: string;
  updatedAt: string;
}

function tasksPath() {
  return join(getWorksapceRoot(), ".codecare", "tasks.json");
}

export async function listTasks() {
  try {
    return JSON.parse(await readFile(tasksPath(), "utf8")) as AgentTask[];
  } catch (error) {
    // 第一次没有任务
    return [];
  }
}

/**
 * 更新或创建任务
 * @description 更新或创建任务
 * @param input 任务信息
 * @returns 任务信息
 */
export async function upsertTask(input: {
  id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  risk: RiskLevel;
  evidence?: string[];
  result?: string;
}) {
  const tasks = await listTasks();
  const now = new Date().toISOString();

  const existing = input.id
    ? tasks.find((task) => task.id === input.id)
    : undefined;

  if (existing) {
    existing.title = input.title;
    existing.description = input.description;
    existing.status = input.status;
    existing.risk = input.risk;
    existing.evidence = input.evidence ?? existing.evidence;
    existing.result = input.result ?? existing.result;
    existing.updatedAt = now;
    await saveTasks(tasks);
    return existing;
  }

  const task: AgentTask = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    status: input.status,
    risk: input.risk,
    evidence: input.evidence ?? [],
    result: input.result,
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

async function saveTasks(tasks: AgentTask[]) {
  const filePath = tasksPath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(tasks, null, 2), "utf8");
}
