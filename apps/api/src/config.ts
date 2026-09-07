import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  databaseUrl: process.env.DATABASE_URL,
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL,
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD,
  upstashCacheUrl: process.env.UPSTASH_CACHE_URL ?? "",
  upstashCacheToken: process.env.UPSTASH_CACHE_TOKEN ?? "",
  assemblyaiApiKey: process.env.ASSEMBLYAI_API_KEY ?? "",
};
