import { db } from "../db/knex";
import type { ControlGroupRag } from "../types";

export class ControlGroupRagRepository {
  private rowToControlGroupRag(row: any): ControlGroupRag {
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async list(): Promise<ControlGroupRag[]> {
    const rows = await db("control_group_rag").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToControlGroupRag);
  }

  async getById(id: string): Promise<ControlGroupRag | null> {
    const row = await db("control_group_rag").where({ id }).first();
    return row ? this.rowToControlGroupRag(row) : null;
  }

  async create(data: { title: string }): Promise<ControlGroupRag> {
    const [row] = await db("control_group_rag")
      .insert({ title: data.title })
      .returning("*");
    return this.rowToControlGroupRag(row);
  }

  async update(id: string, data: { title?: string }): Promise<ControlGroupRag | null> {
    const update: Record<string, any> = {};
    if (data.title !== undefined) update.title = data.title;
    update.updated_at = db.fn.now();

    const [row] = await db("control_group_rag").where({ id }).update(update).returning("*");
    return row ? this.rowToControlGroupRag(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db("control_group_rag").where({ id }).del();
    return deleted > 0;
  }
}

export const controlGroupRagRepository = new ControlGroupRagRepository();
