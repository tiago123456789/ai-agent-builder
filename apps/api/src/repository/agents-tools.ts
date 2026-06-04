import { db } from "../db/knex";
import type { Tool } from "../types";

export class AgentToolsRepository {
  private rowToTool(row: any): Tool {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      tool: row.tool,
      package: row.package ?? null,
      isNative: row.is_native,
      createdAt: row.created_at,
    };
  }

  async linkTools(
    agentId: string,
    toolIds: string[],
  ): Promise<void> {
    const rows = toolIds.map((toolId) => ({
      agent_id: agentId,
      tool_id: toolId,
    }));
    await db("agents_tools").insert(rows).onConflict(["agent_id", "tool_id"]).ignore();
  }

  async listAgentTools(agentId: string): Promise<Tool[]> {
    const rows = await db("tools")
      .join("agents_tools", "tools.id", "agents_tools.tool_id")
      .where("agents_tools.agent_id", agentId)
      .select("tools.*");
    return rows.map(this.rowToTool);
  }

  async unlinkTool(
    agentId: string,
    toolId: string,
  ): Promise<boolean> {
    const deleted = await db("agents_tools")
      .where({ agent_id: agentId, tool_id: toolId })
      .del();
    return deleted > 0;
  }
}

export const agentToolsRepository = new AgentToolsRepository();
