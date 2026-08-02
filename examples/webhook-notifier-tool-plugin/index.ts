import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";
import axios from "axios"

export default (actions: Array<{ [key: string]: any }>) => {
  const tools: DynamicStructuredTool[] = [];

  tools.push(new DynamicStructuredTool({
    name: "tool_name_here",
    description: "Tool description",
    schema: z.object({
      method: z.enum(["POST", "GET", "PUT", "DELETE"]),
      url: z.string(),
      headers: z.record(z.string()).optional(),
      body: z.string().optional(),
      // params required to execute the actions
    }),
    func: async (args: any) => {
      try {
        const response = await axios.request({
          method: args.method,
          url: args.url,
          headers: args.headers,
          data: args.body,
        });
        actions.push({
          type: "webhook_notifier",
          status: "success",
          message: `Webhook sent successfully`,
          data: response.data || {},
        });
        return `Webhook notification sent successfully`;
      } catch (error: any) {
        actions.push({
          type: "webhook_notifier",
          status: "error",
          message: `Error executing tool: ${error.message}`,
        });
        return `Error executing tool: ${error.message}`;
      }
    },
  }));

  return tools;
};
