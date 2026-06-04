import { db } from "./knex";

async function main() {
  await db.migrate.rollback({
    directory: "./src/db/migrations",
  });
  console.log("Rollback ran successfully");
  await db.destroy();
}

main().catch((err) => {
  console.error("Rollback failed:", err);
  process.exit(1);
});
