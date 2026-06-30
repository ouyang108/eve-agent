// 沙箱
import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";
// 隔离agent执行环境
export default defineSandbox({
  backend: vercel({
    // 选择vercel的nodejs运行时
    runtime: "nodejs",
  }),
});
