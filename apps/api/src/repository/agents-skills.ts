import { db } from "../db/knex";
import type { Skill } from "../types";

export class AgentSkillsRepository {
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

  async linkSkills(
    agentId: string,
    skillIds: string[],
  ): Promise<void> {
    const rows = skillIds.map((skillId) => ({
      agent_id: agentId,
      skill_id: skillId,
    }));
    await db("agents_skills").insert(rows).onConflict(["agent_id", "skill_id"]).ignore();
  }

  async listAgentSkills(agentId: string): Promise<Skill[]> {
    const rows = await db("skills")
      .join("agents_skills", "skills.id", "agents_skills.skill_id")
      .where("agents_skills.agent_id", agentId)
      .select("skills.*");
    return rows.map(this.rowToSkill);
  }

  async unlinkSkill(
    agentId: string,
    skillId: string,
  ): Promise<boolean> {
    const deleted = await db("agents_skills")
      .where({ agent_id: agentId, skill_id: skillId })
      .del();
    return deleted > 0;
  }
}

export const agentSkillsRepository = new AgentSkillsRepository();
