import { db } from "../db/knex";

export class AgentUsersRepository {
  async listAgentsByUserId(userId: string) {
    const rows = await db("agents_users as au")
      .innerJoin("agents as a", "a.id", "au.agent_id")
      .where("au.user_id", userId)
      .select("a.*")
      .orderBy("a.created_at", "desc");
    return rows;
  }

  async listUsersByAgentId(agentId: string) {
    const rows = await db("agents_users as au")
      .innerJoin("users as u", "u.id", "au.user_id")
      .where("au.agent_id", agentId)
      .select("u.id", "u.name", "u.email", "u.rule", "u.created_at")
      .orderBy("u.created_at", "desc");
    return rows;
  }

  async linkUsersToAgent(agentId: string, userIds: string[]) {
    const inserts = userIds.map((userId) => ({
      agent_id: agentId,
      user_id: userId,
    }));
    await db("agents_users").insert(inserts).onConflict(["agent_id", "user_id"]).ignore();
  }

  async unlinkUserFromAgent(agentId: string, userId: string) {
    await db("agents_users").where({ agent_id: agentId, user_id: userId }).del();
  }
}

export const agentUsersRepository = new AgentUsersRepository();
