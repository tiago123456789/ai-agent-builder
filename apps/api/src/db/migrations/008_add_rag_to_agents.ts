import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.boolean("has_rag_enabled").defaultTo(false);
    t.uuid("rag_data_store_id")
      .references("id")
      .inTable("rag_data_stores")
      .onDelete("SET NULL")
      .nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.dropColumn("has_rag_enabled");
    t.dropColumn("rag_data_store_id");
  });
}
