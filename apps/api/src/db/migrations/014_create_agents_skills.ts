import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("agents_skills", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("agent_id").references("id").inTable("agents").onDelete("CASCADE");
    t.uuid("skill_id").references("id").inTable("skills").onDelete("CASCADE");
    t.unique(["agent_id", "skill_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("agents_skills");
}
