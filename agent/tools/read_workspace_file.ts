import { defineTool } from "eve/tools";
import { z } from "zod";
export default defineTool({
  description: "Read the content of a file",
  inputSchema: z.object({
    file_path: z.string().describe("The path to the file"),
  }),
  async execute({ file_path }) {
    console.error("read_workspace_file", file_path);
    return {
      content: null,
    };
  },
});
