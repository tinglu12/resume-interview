import { apiClient } from "@/lib/api-client";
import type { Answer, SessionWithAnswers } from "@/types";

export async function getSession(sessionId: string, token: string): Promise<SessionWithAnswers> {
  return apiClient.get<SessionWithAnswers>(`/sessions/${sessionId}`, token);
}

export async function submitTextAnswer(
  sessionId: string,
  token: string,
  questionIndex: number,
  answerText: string
): Promise<Answer> {
  const form = new FormData();
  form.append("question_index", String(questionIndex));
  form.append("answer_text", answerText);
  return apiClient.postForm<Answer>(`/sessions/${sessionId}/answers`, token, form);
}

export async function submitAudioAnswer(
  sessionId: string,
  token: string,
  questionIndex: number,
  audioBlob: Blob
): Promise<Answer> {
  const form = new FormData();
  form.append("question_index", String(questionIndex));
  form.append("audio", audioBlob, "answer.webm");
  return apiClient.postForm<Answer>(`/sessions/${sessionId}/answers`, token, form);
}
