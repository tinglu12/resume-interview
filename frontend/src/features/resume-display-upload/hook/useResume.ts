"use client";

import { useResumeQuery } from "../lib/resumes";

export function useResume(id: string) {
  const query = useResumeQuery(id);

  return {
    resume: query.data,
    isPending: query.isPending,
    error: query.error?.message ?? null,
  };
}
