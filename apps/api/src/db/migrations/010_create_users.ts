import type { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name").notNullable();
    t.string("email").notNullable().unique();
    t.string("password").notNullable();
    t.string("rule").notNullable().defaultTo("employee");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT users_rule_check CHECK (rule IN ('admin', 'employee'))`,
  );

  const email = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@admin";
  const password = process.env.DEFAULT_ADMIN_PASSWORD ?? "123456";
  const hashed = await bcrypt.hash(password, 10);

  await knex("users").insert({
    name: "Admin",
    email,
    password: hashed,
    rule: "admin",
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
