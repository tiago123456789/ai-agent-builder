import { db } from "../db/knex";
import type { Mcp } from "../types";

export class McpsRepository {
  private rowToMcp(row: any): Mcp {
    return {
      id: row.id,
      description: row.description ?? null,
      url: row.url,
      headers: row.headers ?? null,
      createdAt: row.created_at,
    };
  }

  async listMcps(): Promise<Mcp[]> {
    const rows = await db("mcps").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToMcp);
  }

  async createMcp(data: {
    description?: string;
    url: string;
    headers?: Record<string, string>;
  }): Promise<Mcp> {
    const [row] = await db("mcps")
      .insert({
        description: data.description ?? null,
        url: data.url,
        headers: data.headers ?? null,
      })
      .returning("*");
    return this.rowToMcp(row);
  }

  async deleteMcp(id: string): Promise<boolean> {
    const deleted = await db("mcps").where({ id }).del();
    return deleted > 0;
  }
}

export const mcpsRepository = new McpsRepository();
