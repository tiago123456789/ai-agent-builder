import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("rag_data_stores", (t) => {
    t.text("connection").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("rag_data_stores", (t) => {
    t.string("connection").notNullable().alter();
  });
}
