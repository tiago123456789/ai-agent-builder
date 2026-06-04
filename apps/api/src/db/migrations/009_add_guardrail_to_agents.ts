import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.boolean("guardrail_enabled").defaultTo(false);
    t.text("guardrail_rules").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("agents", (t) => {
    t.dropColumn("guardrail_enabled");
    t.dropColumn("guardrail_rules");
  });
}
