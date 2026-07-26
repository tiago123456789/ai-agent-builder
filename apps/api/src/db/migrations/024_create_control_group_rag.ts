import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("control_group_rag", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("title", 100).notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("users", (t) => {
    t.uuid("control_group_rag_id")
      .nullable()
      .references("id")
      .inTable("control_group_rag")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (t) => {
    t.dropForeign(["control_group_rag_id"]);
    t.dropColumn("control_group_rag_id");
  });
  await knex.schema.dropTableIfExists("control_group_rag");
}
