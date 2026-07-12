import { db } from "../db/knex";

export type UserQuestionNoAnswerRow = {
  id: string;
  question: string;
  sessionId: string;
  createdAt: string;
};

export class UserQuestionsNoAnswerRepository {
  async create(params: { question: string; sessionId: string; agentId: string }): Promise<void> {
    await db("user_questions_no_answer").insert({
      question: params.question,
      session_id: params.sessionId,
      agent_id: params.agentId,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  async listByAgentId(
    agentId: string,
    options: { offset: number; limit: number },
  ): Promise<{ rows: UserQuestionNoAnswerRow[]; hasMore: boolean }> {
    const rows = await db("user_questions_no_answer")
      .where({ agent_id: agentId })
      .orderBy("created_at", "desc")
      .limit(options.limit + 1)
      .offset(options.offset);

    const hasMore = rows.length > options.limit;
    if (hasMore) rows.pop();

    return { rows: rows.map(item => ({ 
      id: item.id, question: item.question, 
      sessionId: item.session_id, createdAt: item.created_at,
      agentId: item.agent_id
    })), hasMore };
  }
}

export const userQuestionsNoAnswerRepository = new UserQuestionsNoAnswerRepository();
