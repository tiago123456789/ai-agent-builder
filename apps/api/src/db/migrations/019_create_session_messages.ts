import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("session_messages", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("session_id").notNullable();
    t.string("role", 20).notNullable();
    t.text("content").notNullable();
    t.uuid("agent_id").notNullable().references("id").inTable("agents").onDelete("CASCADE");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());

    t.index("session_id", "idx_session_messages_session_id");
    t.index(["session_id", "agent_id", "created_at"], "idx_session_messages_lookup");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("session_messages");
}
