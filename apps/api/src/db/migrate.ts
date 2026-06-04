import { db } from "./knex";

async function main() {
  await db.migrate.latest({
    directory: "./src/db/migrations",
  });
  console.log("Migrations ran successfully");
  await db.destroy();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
