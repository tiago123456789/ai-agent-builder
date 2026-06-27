import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("mcps", (t) => {
    t.string("type", 10).notNullable().defaultTo("remote");
    t.string("command", 255);
    t.string("args", 255);
    t.text("envs");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("mcps", (t) => {
    t.dropColumn("type");
    t.dropColumn("command");
    t.dropColumn("args");
    t.dropColumn("envs");
  });
}
