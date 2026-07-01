// 沙箱
import { defaultBackend, defineSandbox } from "eve/sandbox";

// 隔离 agent 执行环境。
// 本地开发不要强制使用 Vercel Sandbox，否则会依赖 Vercel CLI / 凭据 / 远程 prewarm。
// defaultBackend 会按环境自动选择：Vercel 部署环境用 Vercel，本地优先 Docker / microsandbox / just-bash。
export default defineSandbox({
  backend: defaultBackend(),
});
