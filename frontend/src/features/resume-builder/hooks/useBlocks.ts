"use client";

import {
  useBlocksQuery,
  useCreateBlockMutation,
  useDeleteBlockMutation,
  useUpdateBlockMutation,
} from "../lib/blocks";

export function useBlocks() {
  const query = useBlocksQuery();
  const createMutation = useCreateBlockMutation();
  const updateMutation = useUpdateBlockMutation();
  const deleteMutation = useDeleteBlockMutation();

  return {
    blocks: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    createBlock: createMutation.mutateAsync,
    updateBlock: updateMutation.mutateAsync,
    deleteBlock: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
