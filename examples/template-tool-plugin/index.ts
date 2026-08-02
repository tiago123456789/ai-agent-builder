import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";

export default (actions: Array<{ [key: string]: any }>) => {
  const tools: DynamicStructuredTool[] = [];

  tools.push(new DynamicStructuredTool({
    name: "tool_name_here",
    description: "Tool description",
    schema: z.object({
      // params required to execute the actions
    }),
    func: async (args: any) => {
      try {
        actions.push({
          type: "tool_name",
          status: "success",
          message: `Message here`,
          data: "JSON here",
        });
        return `Return the result as string here or empty string like ''`;
      } catch (error: any) {
        actions.push({
          type: "tool_name",
          status: "error",
          message: `Error executing tool: ${error.message}`,
        });
        return `Error executing tool: ${error.message}`;
      }
    },
  }));

  return tools;
};
