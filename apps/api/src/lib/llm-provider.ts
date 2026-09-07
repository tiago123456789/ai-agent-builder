import { config } from "../config";

export interface LLMProviderConfig {
  apiKey: string;
  baseURL?: string;
}

export function getLLMProviderConfig(): LLMProviderConfig {
  if (config.openrouterApiKey) {
    return {
      apiKey: config.openrouterApiKey,
      baseURL: config.openrouterBaseUrl,
    };
  }

  return {
    apiKey: config.openaiApiKey,
  };
}

export function hasLLMProviderConfigured(): boolean {
  return Boolean(config.openaiApiKey || config.openrouterApiKey);
}