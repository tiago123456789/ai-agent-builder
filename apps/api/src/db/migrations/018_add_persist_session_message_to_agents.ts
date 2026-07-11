import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.boolean("has_persist_session_message").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.dropColumn("has_persist_session_message");
  });
}
