"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { getSession } from "../api";
import type { Answer, SessionWithAnswers } from "@/features/sessions/types";

function sessionKey(sessionId: string) {
  return ["session", sessionId];
}

export function useSessionQuery(sessionId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: sessionKey(sessionId),
    queryFn: async () => getSession(sessionId, await requireToken(getToken)),
  });
}

export function useUpdateSessionAnswerInCache(sessionId: string) {
  const qc = useQueryClient();

  return function updateAnswer(updated: Answer) {
    qc.setQueryData<SessionWithAnswers>(sessionKey(sessionId), (prev) => {
      if (!prev) return prev;
      const existing = prev.answers.findIndex((a) => a.question_index === updated.question_index);
      const answers =
        existing >= 0
          ? prev.answers.map((a, i) => (i === existing ? updated : a))
          : [...prev.answers, updated];
      return { ...prev, answers };
    });
  };
}
