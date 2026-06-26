import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.boolean("tracing_enabled").defaultTo(false);
    t.string("tracing_url").nullable();
    t.string("tracing_aigateway_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.dropColumn("tracing_enabled");
    t.dropColumn("tracing_url");
    t.dropColumn("tracing_aigateway_id");
  });
}
