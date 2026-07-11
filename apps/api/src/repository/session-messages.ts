import { db } from "../db/knex";
import type { AgentChatMessage } from "../types";

export class SessionMessagesRepository {

  async create(params: { sessionId: string; role: "user" | "assistant"; content: string; agentId: string }): Promise<void> {
    await db("session_messages").insert({
      session_id: params.sessionId,
      role: params.role,
      content: params.content,
      agent_id: params.agentId,
    });
  }

  async getHistoryBySessionAndAgent(params: { sessionId: string; agentId: string }): Promise<AgentChatMessage[]> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const rows = await db("session_messages")
      .where({ session_id: params.sessionId, agent_id: params.agentId })
      .where("created_at", ">=", oneMonthAgo)
      .orderBy("created_at", "asc")
      .select("role", "content");

    return rows.map((row) => ({
      role: row.role,
      content: row.content,
    }));
  }
}

export const sessionMessagesRepository = new SessionMessagesRepository();
