import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("multi_agents", (t) => {
    t.dropColumn("system_prompt");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("multi_agents", (t) => {
    t.text("system_prompt").notNullable();
  });
}
