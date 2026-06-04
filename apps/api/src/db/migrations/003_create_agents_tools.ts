import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("agents_tools", (t) => {
    t.uuid("agent_id").references("id").inTable("agents").onDelete("CASCADE");
    t.uuid("tool_id").references("id").inTable("tools").onDelete("CASCADE");
    t.primary(["agent_id", "tool_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("agents_tools");
}
