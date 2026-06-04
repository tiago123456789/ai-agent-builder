import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("event_todos", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("title").notNullable();
    t.text("description");
    t.boolean("completed").defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("event_todos");
}
