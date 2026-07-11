import cors from "cors";
import express from "express";
import { config } from "./config";
import { agentsRouter } from "./routes/agents";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";
import { queriesRouter } from "./routes/queries";
import { mcpsRouter } from "./routes/mcps";
import { toolsRouter } from "./routes/tools";
import { ragDataStoresRouter } from "./routes/rag-data-stores";
import { usersRouter } from "./routes/users";
import { modelsRouter } from "./routes/models";
import { skillsRouter } from "./routes/skills";
import { metricsRouter } from "./routes/metrics";
import { agentsPublicRouter } from "./routes/agents-public";
import { errorHandler } from "./middleware/error-handler";
import VectorUpstashSemanticCacheAdapter from "./adapters/vector-upstash-semantic-cache.adapter";

const SEMANTIC_CACHE_RESET_INTERVAL_MS = 5 * 60 * 60 * 1000;
const vectorUpstashSemanticCacheAdapter = new VectorUpstashSemanticCacheAdapter()

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
    }),
  );
  app.use(express.json({ limit: "10mb"}));

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/agents", agentsRouter);
  app.use("/queries", queriesRouter);
  app.use("/tools", toolsRouter);
  app.use("/mcps", mcpsRouter);
  app.use("/rag-data-stores", ragDataStoresRouter);
  app.use("/users", usersRouter);
  app.use("/models", modelsRouter);
  app.use("/skills", skillsRouter);
  app.use("/agents/public", agentsPublicRouter);
  app.use("/metrics", metricsRouter)

  app.use(errorHandler);

  setInterval(async () => {
    console.log("Starting process to reset keys from semantic cache")
    await vectorUpstashSemanticCacheAdapter.resetAllKeys()
    console.log("Finished process to reset keys from semantic cache")
  }, SEMANTIC_CACHE_RESET_INTERVAL_MS)
  return app;
}
