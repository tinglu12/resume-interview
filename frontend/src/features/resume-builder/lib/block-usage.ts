"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueries } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { getResumeSections } from "../api";
import type { ResumeSection } from "@/types";

export function useSectionsForResumesQuery(resumeIds: string[]) {
  const { getToken } = useAuth();

  return useQueries({
    queries: resumeIds.map((id) => ({
      queryKey: ["resume-sections", id],
      queryFn: async (): Promise<ResumeSection[]> =>
        getResumeSections(id, await requireToken(getToken)),
    })),
  });
}
