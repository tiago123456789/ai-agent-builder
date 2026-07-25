import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("group_tools_allowed", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("title", 100).notNullable();
    t.string("description", 255).notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("group_tools", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("group_tools_allowed_id")
      .notNullable()
      .references("id")
      .inTable("group_tools_allowed")
      .onDelete("CASCADE");
    t.uuid("tool_id").notNullable();
    t.string("type", 10).notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["group_tools_allowed_id", "tool_id", "type"]);
  });

  await knex.raw(
    `ALTER TABLE group_tools ADD CONSTRAINT group_tools_type_check CHECK (type IN ('TOOL', 'MCP'))`,
  );

  await knex.schema.alterTable("users", (t) => {
    t.uuid("group_tools_allowed_id")
      .nullable()
      .references("id")
      .inTable("group_tools_allowed")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (t) => {
    t.dropForeign(["group_tools_allowed_id"]);
    t.dropColumn("group_tools_allowed_id");
  });
  await knex.schema.dropTableIfExists("group_tools");
  await knex.schema.dropTableIfExists("group_tools_allowed");
}
