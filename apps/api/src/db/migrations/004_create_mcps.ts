import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("mcps", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("description");
    t.string("url").notNullable();
    t.jsonb("headers");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("mcps");
}
