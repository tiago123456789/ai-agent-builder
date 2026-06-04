import type { NextFunction, Request, Response } from "express";
import { config } from "../config";

const OPENAI_API_BASE = "https://api.openai.com/v1";

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

function formatModelName(id: string): string {
  return id
    .split(/[-_]/)
    .map((part, i) => {
      if (i === 0) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function isChatModel(id: string): boolean {
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

export class ModelsController {
  async list(_request: Request, response: Response, next: NextFunction) {
    if (!config.openaiApiKey) {
      return response.json([]);
    }

    try {
      const res = await fetch(`${OPENAI_API_BASE}/models`, {
        headers: {
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
      });

      if (!res.ok) {
        console.error("OpenAI API error:", res.status, await res.text());
        return response.json([]);
      }

      const data = (await res.json()) as { data: OpenAIModel[] };

      const models = data.data
        .filter((m) => isChatModel(m.id))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((m) => ({
          id: m.id,
          name: formatModelName(m.id),
        }));

      response.json(models);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      next(error);
    }
  }
}

export const modelsController = new ModelsController();
