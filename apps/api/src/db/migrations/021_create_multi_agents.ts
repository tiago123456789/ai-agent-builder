import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("multi_agents", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name").notNullable();
    t.string("slug").notNullable().unique();
    t.text("system_prompt").notNullable();
    t.text("short_description").nullable();
    t.jsonb("nodes").nullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("multi_agents_agents", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("multi_agent_id").notNullable().references("id").inTable("multi_agents").onDelete("CASCADE");
    t.uuid("agent_id").notNullable().references("id").inTable("agents").onDelete("CASCADE");
    t.unique(["multi_agent_id", "agent_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("multi_agents_agents");
  await knex.schema.dropTableIfExists("multi_agents");
}
