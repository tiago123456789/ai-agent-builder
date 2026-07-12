import { DynamicStructuredTool } from "langchain/tools"
import z from "zod";
import { userQuestionsNoAnswerRepository } from "../repository/user-questions-no-answer";

export default (actions: Array<{ [key: string]: any }>): DynamicStructuredTool => {
    return new DynamicStructuredTool({
        name: "save_question_no_answer",
        description: "Save question user asked, but AI agent doesn't have an answer, it's unclear or no allow to execute actions",
        schema: z.object({
            agent_id: z.string().describe("The agent id"),
            user_question: z.string().describe("What the user asked"),
            session_id: z.string().describe("The session id")
        }),
        func: async ({ agent_id, user_question, session_id }: { agent_id: string; user_question: string; session_id: string }) => {
            if (session_id) {
                await userQuestionsNoAnswerRepository.create({
                    question: user_question,
                    sessionId: session_id,
                    agentId: agent_id,
                });
            }
            return "";
        },
    });
}
