import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.boolean("has_semantic_cache").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.dropColumn("has_semantic_cache");
  });
}
