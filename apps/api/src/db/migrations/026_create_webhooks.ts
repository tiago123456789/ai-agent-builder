import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("webhooks", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name", 120).notNullable();
    t.string("slug", 255).notNullable().unique();
    t.uuid("agent_id").notNullable();
    t.string("type_agent").notNullable();
    // e.g. { sessionId: "message.chat.id", text: "message.text", telegramBotToken: "...", telegramChatId: "message.chat.id" }
    // Each value is a lodash.get path into the incoming body, with literal fallback.
    t.jsonb("config").notNullable().defaultTo("{}");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("webhooks");
}
