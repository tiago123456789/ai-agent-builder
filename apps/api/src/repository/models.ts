import { config } from "../config";

export interface ModelInfo {
  id: string;
  name: string;
}

interface RawModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  name?: string;
  modalities?: {
    input: string[];
    output: string[];
  };
}

const OPENAI_API_BASE = "https://api.openai.com/v1";

function formatModelName(id: string): string {
  return id
    .split(/[-_]/)
    .map((part, i) => {
      if (i === 0) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function isOpenAIChatModel(id: string): boolean {
  const lower = id.toLowerCase();
  if (
    !lower.startsWith("gpt-") &&
    !lower.startsWith("o1") &&
    !lower.startsWith("o3") &&
    !lower.startsWith("chatgpt-")
  ) {
    return false;
  }
  const exclude = [
    "realtime", "audio", "tts", "whisper",
    "embedding", "moderation", "instruct",
    "davinci", "babbage", "dall-e",
  ];
  return !exclude.some((term) => lower.includes(term));
}

function isOpenRouterChatModel(model: RawModel): boolean {
  const lower = model.id.toLowerCase();
  if (
    model.modalities?.output &&
    !model.modalities.output.some((m) => m.toLowerCase() === "text")
  ) {
    return false;
  }
  const exclude = [
    "realtime", "audio", "tts", "whisper",
    "embedding", "moderation", "image", "dall-e",
  ];
  return !exclude.some((term) => lower.includes(term));
}

function toModelInfo(model: RawModel): ModelInfo {
  return {
    id: model.id,
    name: model.name || formatModelName(model.id),
  };
}

export class ModelsRepository {
  private async fetchOpenAIModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${OPENAI_API_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { data: RawModel[] };

    return data.data
      .filter((m) => isOpenAIChatModel(m.id))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(toModelInfo);
  }

  private async fetchOpenRouterModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${config.openrouterBaseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${config.openrouterApiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { data: RawModel[] };

    return data.data
      .filter(isOpenRouterChatModel)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(toModelInfo);
  }

  async listModels(): Promise<ModelInfo[]> {
    if (config.openrouterApiKey) {
      return this.fetchOpenRouterModels();
    }

    if (config.openaiApiKey) {
      return this.fetchOpenAIModels();
    }

    return [];
  }
}

export const modelsRepository = new ModelsRepository();