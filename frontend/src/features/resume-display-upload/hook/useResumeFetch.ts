"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { listResumes } from "../api";
import type { Resume } from "@/types";

export function useResumeFetch() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["resumes"],
    queryFn: async (): Promise<Resume[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listResumes(token);
    },
  });

  const resumes = query.data ?? [];

  return {
    resumes,
    assembledResumes: resumes.filter((r) => r.resume_type === "builder"),
    loading: query.isPending,
    error: query.error?.message ?? null,
  };
}
