"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { getJob } from "../api";
import type { Job } from "@/features/jobs/types";

export function useJobQuery(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["job", id],
    queryFn: async (): Promise<Job> => getJob(id, await requireToken(getToken)),
    enabled: !!id,
  });
}
