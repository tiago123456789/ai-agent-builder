import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.string("model", 150).defaultTo("gpt-4.1-mini");
    t.decimal("temperature", 3, 2).defaultTo(0.2);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.dropColumn("model");
    t.dropColumn("temperature");
  });
}
