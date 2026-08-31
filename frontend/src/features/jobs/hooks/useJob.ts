"use client";

import { useJobQuery } from "../lib/queries";

export function useJob(id: string) {
  const query = useJobQuery(id);

  return {
    job: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
  };
}
