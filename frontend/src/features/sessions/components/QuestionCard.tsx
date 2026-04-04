"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AudioRecorder } from "./AudioRecorder";
import { FeedbackCard } from "./FeedbackCard";
import { submitTextAnswer, submitAudioAnswer } from "../api";
import type { Answer, QuestionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  sessionId: string;
  questionIndex: number;
  total: number;
  questionItem: QuestionItem;
  existingAnswer: Answer | undefined;
  onAnswerSaved: (answer: Answer) => void;
}

export function QuestionCard({
  sessionId,
  questionIndex,
  total,
  questionItem,
  existingAnswer,
  onAnswerSaved,
}: Props) {
  const { getToken } = useAuth();
  const [textAnswer, setTextAnswer] = useState(existingAnswer?.answer_text ?? "");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedback = existingAnswer?.feedback ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textAnswer && !audioBlob) {
      setError("Type an answer or record a voice answer.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      let answer: Answer;
      if (audioBlob) {
        answer = await submitAudioAnswer(sessionId, token, questionIndex, audioBlob);
      } else {
        answer = await submitTextAnswer(sessionId, token, questionIndex, textAnswer);
      }
      onAnswerSaved(answer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Badge variant="outline" className="mb-2 text-xs font-medium text-muted-foreground">
          Question {questionIndex + 1} of {total}
        </Badge>
        <h2 className="text-lg font-semibold">{questionItem.question}</h2>
      </div>

      {feedback ? (
        <FeedbackCard feedback={feedback} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="answer-text">Your answer</Label>
            <Textarea
              id="answer-text"
              rows={6}
              value={textAnswer}
              onChange={(e) => {
                setTextAnswer(e.target.value);
                setAudioBlob(null);
              }}
              placeholder="Type your answer here, or use the voice recorder below…"
              disabled={!!audioBlob}
            />
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <AudioRecorder onRecordingComplete={setAudioBlob} disabled={!!textAnswer} />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Evaluating…" : "Submit for feedback"}
          </Button>
        </form>
      )}
    </div>
  );
}
