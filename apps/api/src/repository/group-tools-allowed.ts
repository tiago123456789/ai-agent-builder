import { db } from "../db/knex";
import type { GroupToolsAllowed } from "../types";

export class GroupToolsAllowedRepository {
  private rowToGroup(row: any): GroupToolsAllowed {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async list(): Promise<GroupToolsAllowed[]> {
    const rows = await db("group_tools_allowed").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToGroup);
  }

  async getById(id: string): Promise<GroupToolsAllowed | null> {
    const row = await db("group_tools_allowed").where({ id }).first();
    return row ? this.rowToGroup(row) : null;
  }

  async create(data: { title: string; description: string }): Promise<GroupToolsAllowed> {
    const [row] = await db("group_tools_allowed")
      .insert({ title: data.title, description: data.description })
      .returning("*");
    return this.rowToGroup(row);
  }

  async update(id: string, data: { title?: string; description?: string }): Promise<GroupToolsAllowed | null> {
    const update: Record<string, any> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    update.updated_at = db.fn.now();

    const [row] = await db("group_tools_allowed").where({ id }).update(update).returning("*");
    return row ? this.rowToGroup(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db("group_tools_allowed").where({ id }).del();
    return deleted > 0;
  }
}

export const groupToolsAllowedRepository = new GroupToolsAllowedRepository();
