"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getJob } from "../api";
import type { Job } from "@/types";

export function useJob(id: string) {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ["job", id],
    queryFn: async (): Promise<Job> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getJob(id, token);
    },
    enabled: !!id,
  });

  return {
    job: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
  };
}
