import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("rag_data_stores", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("description").notNullable();
    t.string("connection").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("rag_data_stores");
}
