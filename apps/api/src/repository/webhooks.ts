import { db } from "../db/knex";
import { toWebhookSlug } from "../lib/webhook-slug";
import type { Webhook, WebhookConfig, WebhookTypeAgent } from "../types";

export class WebhooksRepository {
  private rowToWebhook(row: any): Webhook {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      agentId: row.agent_id,
      typeAgent: row.type_agent,
      integrationName: row.integration_name ?? "telegram",
      config: row.config ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async assertAgentExists(agentId: string, typeAgent: WebhookTypeAgent): Promise<void> {
    const table = typeAgent === "multi_agent" ? "multi_agents" : "agents";
    const row = await db(table).where({ id: agentId }).first();
    if (!row) {
      throw new Error(
        typeAgent === "multi_agent" ? "Multi agent not found." : "Agent not found.",
      );
    }
  }

  async listWebhooks(): Promise<Webhook[]> {
    const rows = await db("webhooks").select("*").orderBy("created_at", "desc");
    return rows.map((row) => this.rowToWebhook(row));
  }

  async getWebhookById(id: string): Promise<Webhook | null> {
    const row = await db("webhooks").where({ id }).first();
    return row ? this.rowToWebhook(row) : null;
  }

  async getWebhookBySlug(slug: string): Promise<Webhook | null> {
    const row = await db("webhooks").where({ slug }).first();
    return row ? this.rowToWebhook(row) : null;
  }

  async createWebhook(data: {
    name: string;
    agentId: string;
    typeAgent: WebhookTypeAgent;
    integrationName: string;
    config: WebhookConfig;
  }): Promise<Webhook> {
    await this.assertAgentExists(data.agentId, data.typeAgent);
    const slug = toWebhookSlug(data.name);
    const [row] = await db("webhooks")
      .insert({
        name: data.name,
        slug,
        agent_id: data.agentId,
        type_agent: data.typeAgent,
        integration_name: data.integrationName,
        config: JSON.stringify(data.config ?? {}),
      })
      .returning("*");
    return this.rowToWebhook(row);
  }

  async updateWebhook(
    id: string,
    data: {
      name?: string;
      agentId?: string;
      typeAgent?: WebhookTypeAgent;
      integrationName?: string;
      config?: WebhookConfig;
    },
  ): Promise<Webhook | null> {
    const current = await this.getWebhookById(id);
    if (!current) {
      return null;
    }

    const nextTypeAgent = data.typeAgent ?? current.typeAgent;
    const nextAgentId = data.agentId ?? current.agentId;
    if (data.agentId !== undefined || data.typeAgent !== undefined) {
      await this.assertAgentExists(nextAgentId, nextTypeAgent);
    }

    const update: Record<string, any> = {};
    if (data.name !== undefined) {
      update.name = data.name;
      update.slug = toWebhookSlug(data.name);
    }
    if (data.agentId !== undefined) {
      update.agent_id = data.agentId;
    }
    if (data.typeAgent !== undefined) {
      update.type_agent = data.typeAgent;
    }
    if (data.integrationName !== undefined) {
      update.integration_name = data.integrationName;
    }
    if (data.config !== undefined) {
      update.config = JSON.stringify(data.config);
    }
    update.updated_at = db.fn.now();

    const [row] = await db("webhooks").where({ id }).update(update).returning("*");
    return row ? this.rowToWebhook(row) : null;
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const deleted = await db("webhooks").where({ id }).del();
    return deleted > 0;
  }
}

export const webhooksRepository = new WebhooksRepository();
