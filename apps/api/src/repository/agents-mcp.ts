import { db } from "../db/knex";
import type { Mcp } from "../types";

export class AgentMcpRepository {
  private rowToMcp(row: any): Mcp {
    return {
      id: row.id,
      description: row.description ?? null,
      url: row.url,
      headers: row.headers ?? null,
      createdAt: row.created_at,
    };
  }

  async linkAgentMcps(
    agentId: string,
    mcpIds: string[],
  ): Promise<void> {
    const rows = mcpIds.map((mcpId) => ({
      agent_id: agentId,
      mcp_id: mcpId,
    }));
    await db("agents_mcp").insert(rows).onConflict(["agent_id", "mcp_id"]).ignore();
  }

  async listAgentMcps(agentId: string): Promise<Mcp[]> {
    const rows = await db("mcps")
      .join("agents_mcp", "mcps.id", "agents_mcp.mcp_id")
      .where("agents_mcp.agent_id", agentId)
      .select("mcps.*");
    return rows.map(this.rowToMcp);
  }

  async unlinkAgentMcp(
    agentId: string,
    mcpId: string,
  ): Promise<boolean> {
    const deleted = await db("agents_mcp")
      .where({ agent_id: agentId, mcp_id: mcpId })
      .del();
    return deleted > 0;
  }
}

export const agentMcpRepository = new AgentMcpRepository();
