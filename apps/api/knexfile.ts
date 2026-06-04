import { config } from "./src/config";
import type { Knex } from "knex";

const knexConfig: Knex.Config = {
  client: "pg",
  connection: config.databaseUrl,
  migrations: {
    directory: "./src/db/migrations",
    extension: "ts",
  },
};

export default knexConfig;
