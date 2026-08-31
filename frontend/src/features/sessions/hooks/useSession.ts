"use client";

import { useSessionQuery, useUpdateSessionAnswerInCache } from "../lib/queries";

export function useSession(sessionId: string) {
  const query = useSessionQuery(sessionId);
  const updateAnswer = useUpdateSessionAnswerInCache(sessionId);

  return {
    session: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
    updateAnswer,
  };
}
