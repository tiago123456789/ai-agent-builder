import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.uuid("api_key").unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.dropColumn("api_key");
  });
}
