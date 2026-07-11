import { config } from "../config";
import { AgentsRepository } from "../repository/agents";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import type {
    AgentAction,
    AgentChatMessage,
    AgentResponse,
    SavedQuery,
} from "../types";
import { DynamicStructuredTool } from "langchain/tools";
import { RagDataStoresRepository } from "../repository/rag-data-stores";
import Encrypter from "../lib/encrypter";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { AgentSkillsRepository } from "../repository/agents-skills";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { getToolsAvailable } from "../tools/toolManager";
import { track } from "../lib/metrics";
import { SemanticCache } from "@upstash/semantic-cache";
import { Index } from "@upstash/vector";

let semanticCache: SemanticCache | null = null;

if (config.upstashCacheUrl && config.upstashCacheToken) {
    const index = new Index({
        url: config.upstashCacheUrl,
        token: config.upstashCacheToken,
    });

    semanticCache = new SemanticCache({
        index,
        minProximity: 0.85,
    });
}

export interface AiAgentParams {
    agentSlug: string,
    input: string,
    history: AgentChatMessage[],
}

class AiAgentService {

    constructor(
        private readonly agentRepository: AgentsRepository = new AgentsRepository(),
        private readonly ragDataStoresRepository: RagDataStoresRepository = new RagDataStoresRepository(),
        private readonly agentSkillsRepository: AgentSkillsRepository = new AgentSkillsRepository(),
        private readonly encrypter: Encrypter = new Encrypter(),
        private readonly toolManager: {
            getToolsAvailable: (agentId: string, actions: AgentAction[]) => Promise<DynamicStructuredTool[]>
        },
    ) {

    }

    private async executeGuardRail(input: string, rules: string) {

        const evaluationPrompt = `
          You are a security guardrail. Your task is to analyze the following AI response for safety infractions, hate speech, leakage of credentials, or malicious behavior.
              
          AI Response to evaluate:
          "${input}"
    
          AI RULES TO CHECK IF FIND SOMETHING DESCRIBE BELOW RETURN THE WORD 'UNSAFE':
          ${rules}
    
          Respond with EXACTLY one word: "SAFE" or "UNSAFE". Do not include punctuation or explanations.
        `;

        try {
            const evaluatorModel = new ChatOpenAI({
                model: "gpt-4o-mini",
                temperature: 0.0,
            });

            const evalResult = await evaluatorModel.invoke(evaluationPrompt);
            const evaluation = evalResult.content.trim().toUpperCase();

            if (evaluation.includes("UNSAFE")) {
                return {
                    queries: [],
                    actions: [],
                    message: "Não posso fornecer essa informação para você",
                    metadata: {
                        timestamp: new Date().toISOString(),
                        model: config.openaiModel,
                    },
                }
            }

            return null
        } catch (error) {
            return {
                queries: [],
                actions: [],
                message: "Não posso fornecer essa informação para você. Por favor tente outra pergunta.",
                metadata: {
                    timestamp: new Date().toISOString(),
                    model: config.openaiModel,
                },
            };
        }

    }

    private getInfoToolsToSystemPrompt(tools: DynamicStructuredTool[]): string {
        let instructions = "\nTOOLS YOU HAVE AVAILABLE TO USE:\n"
        tools.forEach(tool => {
            instructions += `\nName: ${tool.name} | Description: ${tool.description}`
        })
        return instructions
    }

    private async getDataFromRag(ragDataStoreId: string, params: AiAgentParams): Promise<string> {
        const rag = await this.ragDataStoresRepository.getById(ragDataStoreId as string)
        const connectionString = this.encrypter.decrypt(rag[0].connection as string)
        const postgresConnectionOptions = {
            type: "postgres",
            connectionString: connectionString
        };

        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-small",
        });

        const vectorStore = await PGVectorStore.initialize(
            embeddings,
            {
                postgresConnectionOptions,
                tableName: "documents",
                columns: {
                    idColumnName: "id",
                    vectorColumnName: "embedding",
                    contentColumnName: "content",
                    metadataColumnName: "metadata",
                },
            }
        );

        const retriever = vectorStore.asRetriever({
            k: 3,
        });

        const docs = await retriever.invoke(
            params.input
        );

        const context = docs
            .map((doc) => doc.pageContent)
            .join("\n");

        return context
    }

    private buildPrompt(systemPrompt: string) {
        return ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input}"],
            new MessagesPlaceholder("agent_scratchpad"),
        ]);
    }

    private toLangChainHistory(history: AgentChatMessage[]) {
        return history.map((message) => {
            return message.role === "assistant"
                ? new AIMessage(message.content)
                : new HumanMessage(message.content)

        });
    }

    private normalizeJsonOutput(output: unknown) {
        if (typeof output !== "string") {
            return "";
        }

        return output
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
    }


    public async execute(params: AiAgentParams): Promise<AgentResponse> {
        if (!config.openaiApiKey) {
            throw new Error("OPENAI_API_KEY is not configured.");
        }


        const agentBySlug = await this.agentRepository.getAgentBySlug(params.agentSlug)
        if (!agentBySlug) {
            throw new Error("Agent not found.");
        }

        if (agentBySlug.guardrailEnabled) {
            const response = await track({
                name: "guardrail_duration",
                help: "The Guardrail duration",
                type: "histogram",
                labels: {
                    status: "success",
                    agentName: agentBySlug.slug,
                    agentId: agentBySlug.id
                }
            }, () => {
                return this.executeGuardRail(
                    params.input, agentBySlug.guardrailRules as string
                )
            })
            if (response != null) {
                return response
            }
        }

        if (agentBySlug.hasSemanticCache && semanticCache) {
            const cacheKey = `${agentBySlug.slug}:${params.input}`;
            const cachedResult = await semanticCache.get(cacheKey);
            if (cachedResult) {
                try {
                    const parsed = JSON.parse(cachedResult);
                    return {
                        ...parsed,
                        metadata: {
                            ...parsed.metadata,
                            cached: true,
                        },
                    } as AgentResponse;
                } catch {
                    return {
                        queries: [],
                        actions: [],
                        message: cachedResult,
                        metadata: {
                            timestamp: new Date().toISOString(),
                            model: config.openaiModel,
                            cached: true,
                        },
                    };
                }
            }
        }

        const actions: AgentAction[] = []
        const tools = await this.toolManager.getToolsAvailable(agentBySlug.id, actions)
        agentBySlug.systemPrompt = agentBySlug.systemPrompt.replace(
            "[TOOLS]", this.getInfoToolsToSystemPrompt(tools)
        )

        if (agentBySlug.hasRagEnabled) {
            const context = await track({
                name: "rag_query_duration",
                help: "The rag query duration",
                type: "histogram",
                labels: {
                    status: "success",
                    agentName: agentBySlug.slug,
                    agentId: agentBySlug.id
                }
            }, () => {
                return this.getDataFromRag(agentBySlug.ragDataStoreId as string, params)
            })
            agentBySlug.systemPrompt += `\n\nRAG CONTEXT TO USE ANSWER THE QUESTIONS: ${context}`;
        }

        const agentsSkills = await track({
            name: "get_skills_duration",
            help: "The ger skills query duration",
            type: "histogram",
            labels: {
                status: "success",
                agentName: agentBySlug.slug,
                agentId: agentBySlug.id
            }
        }, () => {
            return this.agentSkillsRepository.listAgentSkills(agentBySlug.id)
        })

        if (agentsSkills.length > 0) {
            agentBySlug.systemPrompt += `\n\nSKILLS AVAILABLE TO USE:`
            agentsSkills.forEach((skill: { [key: string]: any }) => {
                agentBySlug.systemPrompt += `\n\nSkill id:\n${skill.content} | name:\n${skill.name} | description:\n${skill.content}`
            })

            agentBySlug.systemPrompt += `\n\nSKILLS RULES:`
            agentBySlug.systemPrompt += `\n ALWAYS USE THE TOOL named get_details_skill where need to provide the 'Skill id' to get the info about the Skill before answer do any stuff related to the SKILLS`
        }

        agentBySlug.systemPrompt = agentBySlug.systemPrompt.replaceAll("{", "{{").replaceAll("}", "}}")

        const token = Buffer.from(
            `${process.env.MLFLOW_USERNAME}:${process.env.MLFLOW_PASWORD}`
        ).toString("base64");

        let latestListedQueries: SavedQuery[] = []

        const defaultOptions: {[key:string]: any } = {
            apiKey: config.openaiApiKey,
            model: agentBySlug.model,
            temperature: agentBySlug.temperature,
        }

        if (agentBySlug.tracingEnabled) {
            defaultOptions.configuration = {
                baseURL: agentBySlug.tracingUrl,
                defaultHeaders: {
                    "Authorization": `Basic ${token}`,
                },
            }

            defaultOptions.model = agentBySlug.tracingAigatewayId
        }

        const model = new ChatOpenAI(defaultOptions);

        let outputText = ""

        return track({
            name: "agent_execution_duration",
            help: "The agent execution duration",
            type: "histogram",
            labels: {
                status: "success",
                agentName: agentBySlug.slug,
                agentId: agentBySlug.id
            }
        }, async () => {
            try {
                const agent = await createToolCallingAgent({
                    llm: model,
                    tools,
                    prompt: this.buildPrompt(agentBySlug.systemPrompt as string),
                });

                const executor = new AgentExecutor({
                    agent,
                    tools,
                    verbose: false,
                    handleParsingErrors: (e) => `Error: ${e.message}. Please try again with valid input.`,
                });

                const result = await executor.invoke({
                    input: params.input,
                    returnIntermediateSteps: true,
                    chat_history: this.toLangChainHistory(params.history),
                });

                outputText = this.normalizeJsonOutput(result.output);

                let parsed;
                try {
                    parsed = JSON.parse(outputText);
                } catch (error) {
                    parsed = outputText
                }

                let response: AgentResponse;

                if (typeof parsed === "string") {
                    response = {
                        queries: [],
                        actions: [],
                        message: parsed,
                        metadata: {
                            timestamp: new Date().toISOString(),
                            model: config.openaiModel,
                        },
                    };
                } else {
                    response = {
                        ...parsed,
                        queries: parsed.queries.length > 0 ? parsed.queries : [],
                        actions: actions,
                        metadata: {
                            timestamp: new Date().toISOString(),
                            model: config.openaiModel,
                        },
                    };
                }

                if (agentBySlug.hasSemanticCache && semanticCache) {
                    const cacheKey = `${agentBySlug.slug}:${params.input}`;
                    await semanticCache.set(cacheKey, JSON.stringify(response));
                }

                return response;
            } catch (err) {
                return {
                    message: outputText || "Agent completed without a structured response.",
                    queries: latestListedQueries,
                    actions,
                    // @ts-ignore
                    error: true,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        model: config.openaiModel,
                    },
                };
            }
        })

    }
}

export default AiAgentService;

export const aiAgentService = new AiAgentService(
    new AgentsRepository(),
    new RagDataStoresRepository(),
    new AgentSkillsRepository(),
    new Encrypter(),
    { getToolsAvailable }
);