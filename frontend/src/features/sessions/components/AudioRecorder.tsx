"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "done";

export function AudioRecorder({ onRecordingComplete, disabled }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
        setState("done");
      };

      mediaRecorder.start();
      setState("recording");
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reset() {
    setState("idle");
    chunksRef.current = [];
  }

  return (
    <div className="space-y-2">
      {state === "idle" && (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-destructive" />
          Record answer
        </Button>
      )}
      {state === "recording" && (
        <Button
          type="button"
          variant="outline"
          onClick={stopRecording}
          className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive/10"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          Stop recording
        </Button>
      )}
      {state === "done" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-700 dark:text-green-400 font-medium">Recording captured</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-xs h-auto p-0 underline text-muted-foreground hover:text-foreground"
          >
            Re-record
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
