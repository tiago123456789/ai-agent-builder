import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("agents_mcp", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("agent_id").references("id").inTable("agents").onDelete("CASCADE");
    t.uuid("mcp_id").references("id").inTable("mcps").onDelete("CASCADE");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["agent_id", "mcp_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("agents_mcp");
}
