import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { agentsRepository } from "../repository/agents";
import { transcriptionService } from "../services/transcription.service";

export class TranscriptionController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "POST",
      route: "/transcription/transcribe",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/transcription/transcribe",
    },
  })
  async transcribe(request: Request, response: Response, next: NextFunction) {
    try {
      const audio = request.file?.buffer;

      if (!audio || audio.length === 0) {
        return response.status(400).json({ message: "Audio file is required" });
      }

      const result = await transcriptionService.transcribe(audio);
      response.json(result);
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "POST",
      route: "/transcription/public/transcribe",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/transcription/public/transcribe",
    },
  })
  async transcribePublic(request: Request, response: Response, next: NextFunction) {
    try {
      const apiKey = request.body.apiKey as string | undefined;
      const audio = request.file?.buffer;

      if (!apiKey) {
        return response.status(400).json({ message: "apiKey is required" });
      }

      if (!audio || audio.length === 0) {
        return response.status(400).json({ message: "Audio file is required" });
      }

      const agent = await agentsRepository.getAgentByApiKey(apiKey);
      if (!agent) {
        return response.status(401).json({ message: "Invalid API key" });
      }

      const result = await transcriptionService.transcribe(audio);
      response.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const transcriptionController = new TranscriptionController();