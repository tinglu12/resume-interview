"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { getResume, listResumes } from "../api";
import type { Resume } from "@/types";

export function useResumesQuery(options: { enabled?: boolean } = {}) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["resumes"],
    queryFn: async (): Promise<Resume[]> => listResumes(await requireToken(getToken)),
    enabled: options.enabled,
  });
}

export function useResumeQuery(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["resume", id],
    queryFn: async (): Promise<Resume> => getResume(id, await requireToken(getToken)),
    enabled: !!id,
  });
}
