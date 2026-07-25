import { db } from "../db/knex";
import type { GroupTool } from "../types";

export class GroupToolsRepository {
  private rowToGroupTool(row: any): GroupTool {
    return {
      id: row.id,
      groupToolsAllowedId: row.group_tools_allowed_id,
      toolId: row.tool_id,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listByGroupId(groupId: string): Promise<GroupTool[]> {
    const rows = await db("group_tools")
      .where({ group_tools_allowed_id: groupId })
      .orderBy("created_at", "desc");
    return rows.map(this.rowToGroupTool);
  }

  async listAllowedToolIdsByGroupId(groupId: string): Promise<string[]> {
    const rows = await db("group_tools")
      .where({ group_tools_allowed_id: groupId, type: "TOOL" })
      .select("tool_id");
    return rows.map((r: any) => r.tool_id);
  }

  async listAllowedMcpIdsByGroupId(groupId: string): Promise<string[]> {
    const rows = await db("group_tools")
      .where({ group_tools_allowed_id: groupId, type: "MCP" })
      .select("tool_id");
    return rows.map((r: any) => r.tool_id);
  }

  async linkTools(
    groupId: string,
    entries: Array<{ toolId: string; type: "TOOL" | "MCP" }>,
  ): Promise<void> {
    const inserts = entries.map((e) => ({
      group_tools_allowed_id: groupId,
      tool_id: e.toolId,
      type: e.type,
    }));
    await db("group_tools").insert(inserts).onConflict(["group_tools_allowed_id", "tool_id", "type"]).ignore();
  }

  async unlinkTool(groupId: string, toolId: string, type: string): Promise<boolean> {
    const deleted = await db("group_tools")
      .where({ group_tools_allowed_id: groupId, tool_id: toolId, type })
      .del();
    return deleted > 0;
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    await db("group_tools").where({ group_tools_allowed_id: groupId }).del();
  }
}

export const groupToolsRepository = new GroupToolsRepository();
