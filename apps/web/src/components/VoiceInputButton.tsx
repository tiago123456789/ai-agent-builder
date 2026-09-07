import { useEffect, useRef, useState } from "react";
import { transcribeAudio, transcribePublicAudio } from "../api";

type VoiceInputButtonProps = {
  onTranscribed: (text: string) => void;
  token?: string;
  apiKey?: string;
  disabled?: boolean;
};

type RecorderState = {
  mediaRecorder: MediaRecorder;
  chunks: Blob[];
  stream: MediaStream;
};

export function VoiceInputButton({
  onTranscribed,
  token,
  apiKey,
  disabled = false,
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<RecorderState | null>(null);

  useEffect(() => {
    return () => {
      stopStreams();
    };
  }, []);

  function stopStreams() {
    if (recorderRef.current) {
      recorderRef.current.stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
    }
  }

  async function handleToggle() {
    setError("");

    if (isRecording) {
      await stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (type) => MediaRecorder.isTypeSupported(type),
      );

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorderRef.current = { mediaRecorder, chunks, stream };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (captureError) {
      setError(
        captureError instanceof Error ? captureError.message : "Failed to access microphone",
      );
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    return new Promise<void>((resolve) => {
      const { mediaRecorder, chunks } = recorder;

      mediaRecorder.onstop = async () => {
        stopStreams();
        setIsRecording(false);

        const blob = new Blob(chunks, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (blob.size === 0) {
          setError("No audio was captured");
          resolve();
          return;
        }

        try {
          setIsProcessing(true);
          const result =
            token
              ? await transcribeAudio(blob, token)
              : apiKey
                ? await transcribePublicAudio(blob, apiKey)
                : (() => { throw new Error("No auth available"); })();

          if (result.text.trim()) {
            onTranscribed(result.text.trim());
          } else {
            setError("No speech detected");
          }
        } catch (transcribeError) {
          setError(
            transcribeError instanceof Error ? transcribeError.message : "Transcription failed",
          );
        } finally {
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  }

  const busy = isRecording || isProcessing;

  return (
    <>
      <div className="voice-controls">
        <button
          className={`voice-button ${isRecording ? "recording" : ""} ${isProcessing ? "processing" : ""}`}
          type="button"
          onClick={handleToggle}
          disabled={disabled || isProcessing}
          title={
            isRecording
              ? "Stop recording"
              : isProcessing
                ? "Transcribing audio..."
                : "Record voice input"
          }
          aria-label={
            isRecording
              ? "Stop recording"
              : isProcessing
                ? "Transcribing audio..."
                : "Record voice input"
          }
        >
          <svg
            className={`voice-icon ${isProcessing ? "voice-icon-spinning" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isProcessing ? (
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            ) : (
              <>
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M12 22v-6" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <path d="M12 17a7 7 0 0 1-7-7" />
              </>
            )}
          </svg>
          {isRecording && <span className="voice-pulse" aria-hidden="true" />}
        </button>
        {isRecording && <span className="voice-recording-label">Recording...</span>}
        {isProcessing && <span className="voice-processing-label">Transcribing...</span>}
      </div>
      {error && <p className="error-text voice-error">{error}</p>}
    </>
  );
}