import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("webhooks", (t) => {
    t.string("integration_name", 255).notNullable().defaultTo("telegram");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("webhooks", (t) => {
    t.dropColumn("integration_name");
  });
}
