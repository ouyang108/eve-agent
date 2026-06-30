import { relative, resolve, sep } from "path";
import { workspaceState } from "./workspace-state";

/**
 * 获取工作区根目录
 * @returns 工作区根目录
 */
export function getWorksapceRoot() {
  const state = workspaceState.get();

  // 优先使用 set_workspace 在当前会话里设置的目录。
  // CODECARE_WORKSPACE 只是默认值，方便固定维护一个项目时少传参数。
  // 如果两者都没有，就默认使用当前进程目录。
  return resolve(state.root ?? process.env.CODECARE_WORKSPACE ?? process.cwd());
}
export function setWorkspaceRoot(root: string) {
  const resolved = resolve(root);
  workspaceState.update(() => ({ root: resolved }));
  return resolved;
}

export function resolveInsideWorkspace(path: string) {
  const root = getWorksapceRoot();
  //   解析路径
  const target = resolve(root, path);

  //   防止逃逸到工作区外面
  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error("Path escaped the workspace root");
  }
  return target;
}

export function toWorkspaceRelative(absolutePath: string): string {
  return relative(getWorksapceRoot(), absolutePath);
}
