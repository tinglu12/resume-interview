"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "../api";
import type { Answer, SessionWithAnswers } from "@/types";

export function useSession(sessionId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getSession(sessionId, token);
    },
  });

  function updateAnswer(updated: Answer) {
    queryClient.setQueryData<SessionWithAnswers>(["session", sessionId], (prev) => {
      if (!prev) return prev;
      const existing = prev.answers.findIndex((a) => a.question_index === updated.question_index);
      const answers =
        existing >= 0
          ? prev.answers.map((a, i) => (i === existing ? updated : a))
          : [...prev.answers, updated];
      return { ...prev, answers };
    });
  }

  return {
    session: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
    updateAnswer,
  };
}
