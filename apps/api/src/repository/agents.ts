import { randomUUID } from "node:crypto";
import { db } from "../db/knex";
import { toSlug } from "../lib/slug";
import type { Agent } from "../types";

export class AgentsRepository {
  private rowToAgent(row: any): Agent {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      systemPrompt: row.system_prompt,
      hasRagEnabled: row.has_rag_enabled ?? false,
      ragDataStoreId: row.rag_data_store_id ?? null,
      guardrailEnabled: row.guardrail_enabled ?? false,
      guardrailRules: row.guardrail_rules ?? null,
      tracingEnabled: row.tracing_enabled ?? false,
      tracingUrl: row.tracing_url ?? null,
      tracingAigatewayId: row.tracing_aigateway_id ?? null,
      hasSemanticCache: row.has_semantic_cache ?? false,
      hasPersistSessionMessage: row.has_persist_session_message ?? false,
      model: row.model ?? "gpt-4.1-mini",
      temperature: Number(row.temperature ?? 0.2),
      apiKey: row.api_key ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listAgents(): Promise<Agent[]> {
    const rows = await db("agents").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToAgent);
  }

  async getAgentBySlug(slug: string): Promise<Agent | null> {
    const row = await db("agents").where({ slug }).first();
    return row ? this.rowToAgent(row) : null;
  }

  async getAgentById(id: string): Promise<Agent | null> {
    const row = await db("agents").where({ id }).first();
    return row ? this.rowToAgent(row) : null;
  }

  async getToolsByAgentId(id: string) {
    return db('agents_tools as at')
      .innerJoin("tools as t", "t.id", "at.tool_id")
      .where("at.agent_id", id)
      .select(["t.*"]);
  }

  async getMcpToolsByAgentId(id: string) {
    return db('agents_mcp as at')
      .innerJoin("mcps as c", "c.id", "at.mcp_id")
      .where("at.agent_id", id)
      .select(["c.*"]);
  }

  async createAgent(    data: {
    name: string;
    systemPrompt: string;
    hasRagEnabled?: boolean;
    ragDataStoreId?: string | null;
    guardrailEnabled?: boolean;
    guardrailRules?: string | null;
    tracingEnabled?: boolean;
    tracingUrl?: string | null;
    tracingAigatewayId?: string | null;
    hasSemanticCache?: boolean;
    hasPersistSessionMessage?: boolean;
    model?: string;
    temperature?: number;
  }): Promise<Agent> {
    const slug = toSlug(data.name);
    const [row] = await db("agents")
      .insert({
        name: data.name,
        slug,
        system_prompt: data.systemPrompt,
        has_rag_enabled: data.hasRagEnabled ?? false,
        rag_data_store_id: data.ragDataStoreId ?? null,
        guardrail_enabled: data.guardrailEnabled ?? false,
        guardrail_rules: data.guardrailRules ?? null,
        tracing_enabled: data.tracingEnabled ?? false,
        tracing_url: data.tracingUrl ?? null,
        tracing_aigateway_id: data.tracingAigatewayId ?? null,
        has_semantic_cache: data.hasSemanticCache ?? false,
        has_persist_session_message: data.hasPersistSessionMessage ?? false,
        model: data.model ?? "gpt-4.1-mini",
        temperature: data.temperature ?? 0.2,
      })
      .returning("*");
    return this.rowToAgent(row);
  }

  async updateAgent(
    slug: string,
    data: { name?: string; systemPrompt?: string; hasRagEnabled?: boolean; ragDataStoreId?: string | null; guardrailEnabled?: boolean; guardrailRules?: string | null; tracingEnabled?: boolean; tracingUrl?: string | null; tracingAigatewayId?: string | null; hasSemanticCache?: boolean; hasPersistSessionMessage?: boolean; model?: string; temperature?: number },
  ): Promise<Agent | null> {
    const update: Record<string, any> = {};
    if (data.name !== undefined) {
      update.name = data.name;
      update.slug = toSlug(data.name);
    }
    if (data.systemPrompt !== undefined) {
      update.system_prompt = data.systemPrompt;
    }
    if (data.hasRagEnabled !== undefined) {
      update.has_rag_enabled = data.hasRagEnabled;
    }
    if (data.ragDataStoreId !== undefined) {
      update.rag_data_store_id = data.ragDataStoreId;
    }
    if (data.guardrailEnabled !== undefined) {
      update.guardrail_enabled = data.guardrailEnabled;
    }
    if (data.guardrailRules !== undefined) {
      update.guardrail_rules = data.guardrailRules;
    }
    if (data.tracingEnabled !== undefined) {
      update.tracing_enabled = data.tracingEnabled;
    }
    if (data.tracingUrl !== undefined) {
      update.tracing_url = data.tracingUrl;
    }
    if (data.tracingAigatewayId !== undefined) {
      update.tracing_aigateway_id = data.tracingAigatewayId;
    }
    if (data.hasSemanticCache !== undefined) {
      update.has_semantic_cache = data.hasSemanticCache;
    }
    if (data.hasPersistSessionMessage !== undefined) {
      update.has_persist_session_message = data.hasPersistSessionMessage;
    }
    if (data.model !== undefined) {
      update.model = data.model;
    }
    if (data.temperature !== undefined) {
      update.temperature = data.temperature;
    }
    update.updated_at = db.fn.now();

    const [row] = await db("agents").where({ slug }).update(update).returning("*");
    return row ? this.rowToAgent(row) : null;
  }

  async getAgentByApiKey(apiKey: string): Promise<Agent | null> {
    try {
      const row = await db("agents").where({ api_key: apiKey }).first();
      return row ? this.rowToAgent(row) : null;
    } catch (error) {
      return null;
    }
  }

  async generateApiKey(agentId: string): Promise<string> {
    const apiKey = randomUUID();
    await db("agents").where({ id: agentId }).update({ api_key: apiKey });
    return apiKey;
  }

  async revokeApiKey(agentId: string): Promise<void> {
    await db("agents").where({ id: agentId }).update({ api_key: null });
  }

  async deleteAgent(slug: string): Promise<boolean> {
    const deleted = await db("agents").where({ slug }).del();
    return deleted > 0;
  }
}

export const agentsRepository = new AgentsRepository();
