import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tools", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name").notNullable();
    t.text("description");
    t.string("tool").notNullable();
    t.string("package");
    t.boolean("is_native").defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tools");
}
