/**
 * 备份管理
 */
import { dirname, join } from "path";
import { mkdir, access, copyFile } from "fs/promises";
import { getWorksapceRoot, resolveInsideWorkspace } from "./workspace";

/**
 * 备份文件
 * @param relativePath 相对路径
 * @returns 备份路径
 */
export async function backupFile(relativePath: string) {
  //   获取工作区根目录
  const root = getWorksapceRoot();
  //   解析路径
  const source = resolveInsideWorkspace(relativePath);
  //   新文件不存在时不备份
  try {
    // 能不能访问 用来判断某个文件或目录是否存在
    await access(source);
  } catch (error) {
    return null;
  }

  const backupId = `${Date.now()}-${relativePath.replace(/[\\/]/g, "__")}`;
  const target = join(root, ".codecare", "backups", backupId);

  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  return backupId;
}

/**
 * 恢复文件
 * @param backupId 备份ID
 * @param relativePath 相对路径
 */
export async function restoreFile(backupId: string, relativePath: string) {
  const backup = await resolveBackupPath(backupId);
  const target = resolveInsideWorkspace(relativePath);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(backup, target); // 复制备份文件到目标路径
}

/**
 * 解析备份文件路径。
 * 同时兼容早期写错的 .codecare/backup 目录和现在正确的 .codecare/backups 目录。
 * @param backupId 备份ID
 * @returns 备份文件路径
 */
export async function resolveBackupPath(backupId: string) {
  const root = getWorksapceRoot();
  const candidates = [
    join(root, ".codecare", "backups", backupId),
    join(root, ".codecare", "backup", backupId),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // 继续检查下一个候选路径
    }
  }

  throw new Error(`Backup not found: ${backupId}`);
}

/**
 * 检查某个备份是否存在。
 * @param backupId 备份ID
 * @returns 是否存在
 */
export async function backupExists(backupId: string) {
  try {
    await resolveBackupPath(backupId);
    return true;
  } catch (error) {
    return false;
  }
}
