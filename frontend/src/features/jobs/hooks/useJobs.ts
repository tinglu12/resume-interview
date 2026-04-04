"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { listJobs } from "../api";
import type { JobSummary } from "@/types";

export function useJobs() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await listJobs(token);
        if (!cancelled) setJobs(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return { jobs, loading, error };
}
