import { config } from "../config";
import { AppError } from "../middleware/error-handler";

const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 60;

type UploadedFile = {
  upload_url: string;
};

type Transcript = {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  error?: string;
};

class TranscriptionService {
  private hasApiKey(): boolean {
    return Boolean(config.assemblyaiApiKey);
  }

  private async uploadAudio(buffer: Buffer): Promise<string> {
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        authorization: config.assemblyaiApiKey,
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      throw new AppError(response.status, "Failed to upload audio to AssemblyAI");
    }

    const data = (await response.json()) as UploadedFile;
    if (!data.upload_url) {
      throw new AppError(500, "AssemblyAI did not return an upload URL");
    }

    return data.upload_url;
  }

  private async submitTranscript(audioUrl: string): Promise<string> {
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
      method: "POST",
      headers: {
        authorization: config.assemblyaiApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        speech_models: ["universal-3-5-pro", "universal-2"],
        punctuate: true,
        format_text: true,
      }),
    });

    if (!response.ok) {
      throw new AppError(response.status, "Failed to create AssemblyAI transcript");
    }

    const data = (await response.json()) as Transcript;
    if (!data.id) {
      throw new AppError(500, "AssemblyAI did not return a transcript id");
    }

    return data.id;
  }

  private async getTranscript(transcriptId: string): Promise<Transcript> {
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
      headers: {
        authorization: config.assemblyaiApiKey,
      },
    });

    if (!response.ok) {
      throw new AppError(response.status, "Failed to fetch AssemblyAI transcript");
    }

    return (await response.json()) as Transcript;
  }

  async transcribe(buffer: Buffer): Promise<{ text: string }> {
    if (!this.hasApiKey()) {
      throw new AppError(500, "AssemblyAI API key is not configured");
    }

    if (!buffer || buffer.length === 0) {
      throw new AppError(400, "No audio provided");
    }

    const audioUrl = await this.uploadAudio(buffer);
    const transcriptId = await this.submitTranscript(audioUrl);

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const transcript = await this.getTranscript(transcriptId);

      if (transcript.status === "completed") {
        return { text: transcript.text ?? "" };
      }

      if (transcript.status === "error") {
        throw new AppError(500, transcript.error || "AssemblyAI transcription failed");
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new AppError(500, "AssemblyAI transcription timed out");
  }
}

export const transcriptionService = new TranscriptionService();