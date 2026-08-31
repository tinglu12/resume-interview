"use client";

import { useDuplicateResumeMutation } from "../lib/duplicate-resume";

export function useDuplicateResume() {
  const duplicateResume = useDuplicateResumeMutation();

  return {
    duplicateResume: duplicateResume.mutateAsync,
    isDuplicating: duplicateResume.isPending,
    error: duplicateResume.error?.message ?? null,
  };
}
