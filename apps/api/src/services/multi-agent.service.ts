import { config } from "../config";
import { ChatOpenAI } from "@langchain/openai";
import { Annotation, MessagesAnnotation, StateGraph, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { AIMessage } from "@langchain/core/messages";
import { randomUUID } from "node:crypto";
import { multiAgentsRepository, type MultiAgent } from "../repository/multi-agents";
import { aiAgentService } from "./ai-agent.service";
import type { AgentChatMessage, AgentResponse } from "../types";

export interface MultiAgentChatParams {
  multiAgentId: string;
  message: string;
  history: AgentChatMessage[];
  sessionId?: string;
}

class MultiAgentService {
  async execute(params: MultiAgentChatParams): Promise<AgentResponse> {
    if (!config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const multiAgent = await multiAgentsRepository.getMultiAgentById(params.multiAgentId);
    if (!multiAgent) {
      throw new Error("Multi agent not found.");
    }

    if (!multiAgent.nodes || multiAgent.nodes.length === 0) {
      throw new Error("Multi agent has no nodes configured.");
    }

    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.0,
    });

    const nodes = multiAgent.nodes;
    const nodeIds = nodes.map((n) => n.id);

    const StateAnnotation = Annotation.Root({
      ...MessagesAnnotation.spec,
      nextRepresentative: Annotation<string>,
    });

    const jsonSchema = z.object({
      nextRepresentative: z.enum(nodeIds as [string, ...string[]]),
    });

    const supervisorSystemPrompt = this.buildSupervisorPrompt(multiAgent, nodes);

    const supervisor = async (state: typeof StateAnnotation.State) => {
      const supportResponse = await model.invoke([
        { role: "system", content: supervisorSystemPrompt },
        ...state.messages,
      ]);

      const categorizationSystemTemplate = `You are an expert customer support routing system.
Your job is to detect whether a customer support representative is routing a user to the appropriate agent based on the rules provided.`;

      const categorizationHumanTemplate = `The previous conversation is an interaction between a customer support representative and a user.
Extract whether the representative is routing the user to a specific agent, or whether they are just responding conversationally.
Respond with a JSON object containing a single key called "nextRepresentative" with one of the following values:

${nodes.map((n) => `If they want to route to the agent "${n.id}", respond only with the word "${n.id}".`).join("\n")}
Otherwise, respond only with the word "RESPOND".`;

      const modelWithJSONOutput = model.withStructuredOutput(jsonSchema);
      const categorizationResponse = await modelWithJSONOutput.invoke([
        { role: "system", content: categorizationSystemTemplate },
        ...state.messages,
        { role: "user", content: categorizationHumanTemplate },
      ]);

      return {
        messages: [supportResponse],
        nextRepresentative: categorizationResponse.nextRepresentative,
      };
    };

    let builder = new StateGraph(StateAnnotation).addNode("supervisor", supervisor);

    const mapNodes: { [key: string]: string } = {};
    for (const node of nodes) {
      mapNodes[node.id] = node.id;
      builder.addNode(node.id, async (state, config?: any) => {
        const sessionId = config?.configurable?.thread_id ?? randomUUID();

        const agentChat: AgentChatMessage[] = state.messages.map((msg: any) => ({
          role: msg.getType() === "ai" ? "assistant" : "user",
          content: msg.content as string,
        }));

        const response = await aiAgentService.execute({
          agentSlug: node.id,
          input: state.messages[state.messages.length - 1].content as string,
          history: agentChat,
          sessionId,
        });

        state.messages.push(new AIMessage(response.message));

        return { messages: state.messages };
      });
    }

    builder.addEdge("__start__", "supervisor");

    const routeMap: Record<string, string> = { ...mapNodes, __end__: "__end__" };
    builder = builder.addConditionalEdges(
      "supervisor",
      async (state: typeof StateAnnotation.State) => {
        if (nodeIds.indexOf(state.nextRepresentative) >= 0) {
          return state.nextRepresentative;
        }
        return "__end__";
      },
      routeMap as any,
    );

    const checkpointer = new MemorySaver();
    const graph = builder.compile({ checkpointer });

    const threadId = params.sessionId ?? randomUUID();
    const inputMessages = params.history.length > 0
      ? params.history.map((h) => ({ role: h.role, content: h.content }))
      : [{ role: "user" as const, content: params.message }];

    const output = await graph.invoke(
      { messages: inputMessages },
      { configurable: { thread_id: threadId } },
    );

    const lastMessage = output.messages[output.messages.length - 1];

    return {
      message: lastMessage.content as string,
      queries: [],
      actions: [],
      metadata: {
        timestamp: new Date().toISOString(),
        model: "gpt-4o-mini",
      },
    };
  }

  private buildSupervisorPrompt(multiAgent: MultiAgent, nodes: Array<{ id: string; triggerWhen: string }>): string {
    let prompt = "You are the supervisor responsible for routing customers to the appropriate agent based on the following rules:\n\nRULES:\n";

    for (const node of nodes) {
      prompt += `- ${node.triggerWhen} return the value ${node.id}\n`;
    }

    prompt += `- If the user request is outside the scope of all agents, respond with a message saying 'I cannot help you with that. Can I do something else for you?'`;

    return prompt;
  }
}

export default MultiAgentService;
