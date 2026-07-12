import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_questions_no_answer", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.text("question").notNullable();
    t.text("session_id").notNullable();
    t.uuid("agent_id").notNullable().references("id").inTable("agents").onDelete("CASCADE");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());

    t.index("agent_id", "idx_user_questions_no_answer_agent_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("user_questions_no_answer");
}
