import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("agents_users", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("agent_id").notNullable().references("id").inTable("agents").onDelete("CASCADE");
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["agent_id", "user_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("agents_users");
}
