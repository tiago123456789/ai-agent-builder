import { db } from "../db/knex";
import { toSlug } from "../lib/slug";
import type { Agent } from "../types";

export type MultiAgent = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  nodes: Array<{ id: string; triggerWhen: string }> | null;
  createdAt: string;
  updatedAt: string;
};

export class MultiAgentsRepository {
  private rowToMultiAgent(row: any): MultiAgent {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description ?? null,
      nodes: row.nodes ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

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

  async listMultiAgents(): Promise<MultiAgent[]> {
    const rows = await db("multi_agents").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToMultiAgent);
  }

  async getMultiAgentById(id: string): Promise<MultiAgent | null> {
    const row = await db("multi_agents").where({ id }).first();
    return row ? this.rowToMultiAgent(row) : null;
  }

  async createMultiAgent(data: {
    name: string;
    shortDescription?: string;
    nodes?: Array<{ id: string; triggerWhen: string }>;
  }): Promise<MultiAgent> {
    const slug = toSlug(data.name);
    const [row] = await db("multi_agents")
      .insert({
        name: data.name,
        slug,
        short_description: data.shortDescription ?? null,
        nodes: data.nodes ? JSON.stringify(data.nodes) : null,
      })
      .returning("*");
    return this.rowToMultiAgent(row);
  }

  async updateMultiAgent(
    id: string,
    data: {
      name?: string;
      shortDescription?: string | null;
      nodes?: Array<{ id: string; triggerWhen: string }> | null;
    },
  ): Promise<MultiAgent | null> {
    const update: Record<string, any> = {};
    if (data.name !== undefined) {
      update.name = data.name;
      update.slug = toSlug(data.name);
    }
    if (data.shortDescription !== undefined) {
      update.short_description = data.shortDescription;
    }
    if (data.nodes !== undefined) {
      update.nodes = data.nodes ? JSON.stringify(data.nodes) : null;
    }
    update.updated_at = db.fn.now();

    const [row] = await db("multi_agents").where({ id }).update(update).returning("*");
    return row ? this.rowToMultiAgent(row) : null;
  }

  async deleteMultiAgent(id: string): Promise<boolean> {
    const deleted = await db("multi_agents").where({ id }).del();
    return deleted > 0;
  }

  async listLinkedAgents(multiAgentId: string): Promise<Agent[]> {
    const rows = await db("multi_agents_agents as maa")
      .innerJoin("agents as a", "a.id", "maa.agent_id")
      .where("maa.multi_agent_id", multiAgentId)
      .select("a.*");
    return rows.map(this.rowToAgent);
  }

  async linkAgents(multiAgentId: string, agentIds: string[]): Promise<void> {
    const inserts = agentIds.map((agentId) => ({
      multi_agent_id: multiAgentId,
      agent_id: agentId,
    }));
    await db("multi_agents_agents").insert(inserts).onConflict(["multi_agent_id", "agent_id"]).ignore();
  }

  async unlinkAgent(multiAgentId: string, agentId: string): Promise<boolean> {
    const deleted = await db("multi_agents_agents")
      .where({ multi_agent_id: multiAgentId, agent_id: agentId })
      .del();
    return deleted > 0;
  }
}

export const multiAgentsRepository = new MultiAgentsRepository();
