"use client";

import { useResumesQuery } from "../lib/resumes";

export function useResumeFetch(options: { enabled?: boolean } = {}) {
  const query = useResumesQuery(options);
  const resumes = query.data ?? [];

  return {
    resumes,
    assembledResumes: resumes.filter((r) => r.resume_type === "builder"),
    loading: query.isPending,
    error: query.error?.message ?? null,
  };
}
