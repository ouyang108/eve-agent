import { defineState } from "eve/context";
export interface WorkspaceState {
  root?: string;
}

// 当前会话要维护的代码库根目录。
// defineState 是 Eve 的 durable per-session state：同一会话后续 turn 会记住它。
export const workspaceState = defineState(
  "codecare.workspace",
  (): WorkspaceState => ({}),
);
