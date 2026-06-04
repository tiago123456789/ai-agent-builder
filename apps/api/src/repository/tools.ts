import { db } from "../db/knex";
import type { Tool } from "../types";

export class ToolsRepository {
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

  async listTools(): Promise<Tool[]> {
    const rows = await db("tools").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToTool);
  }

  async getToolById(id: string): Promise<Tool | null> {
    const row = await db("tools").where({ id }).first();
    return row ? this.rowToTool(row) : null;
  }

  async createTool(data: {
    name: string;
    description?: string;
    tool: string;
    package?: string;
    isNative?: boolean;
  }): Promise<Tool> {
    const [row] = await db("tools")
      .insert({
        name: data.name,
        description: data.description ?? null,
        tool: data.tool,
        package: data.package ?? null,
        is_native: data.isNative ?? false,
      })
      .returning("*");
    return this.rowToTool(row);
  }

  async deleteTool(id: string): Promise<boolean> {
    const deleted = await db("tools").where({ id }).del();
    return deleted > 0;
  }
}

export const toolsRepository = new ToolsRepository();
