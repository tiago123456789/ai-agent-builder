import { db } from "../db/knex";
import type { Skill } from "../types";

export class SkillsRepository {
  private rowToSkill(row: any): Skill {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listSkills(): Promise<Skill[]> {
    const rows = await db("skills").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToSkill);
  }

  async getSkillById(id: string): Promise<Skill | null> {
    const row = await db("skills").where({ id }).first();
    return row ? this.rowToSkill(row) : null;
  }

  async getSkillByName(name: string): Promise<Skill | null> {
    const row = await db("skills").where({ name }).first();
    return row ? this.rowToSkill(row) : null;
  }

  async createSkill(data: {
    name: string;
    description?: string;
    content: string;
  }): Promise<Skill> {
    const [row] = await db("skills")
      .insert({
        name: data.name,
        description: data.description ?? null,
        content: data.content,
      })
      .returning("*");
    return this.rowToSkill(row);
  }

  async updateSkill(
    id: string,
    data: { name?: string; description?: string; content?: string },
  ): Promise<Skill | null> {
    const update: Record<string, any> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.content !== undefined) update.content = data.content;
    update.updated_at = db.fn.now();

    const [row] = await db("skills").where({ id }).update(update).returning("*");
    return row ? this.rowToSkill(row) : null;
  }

  async deleteSkill(id: string): Promise<boolean> {
    const deleted = await db("skills").where({ id }).del();
    return deleted > 0;
  }
}

export const skillsRepository = new SkillsRepository();
