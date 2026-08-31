"use client";

import { useAddBlockToResumeMutation } from "../lib/add-block-to-resume";

export function useAddBlockToResume() {
  const mutation = useAddBlockToResumeMutation();

  return {
    addBlockToResume: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}
