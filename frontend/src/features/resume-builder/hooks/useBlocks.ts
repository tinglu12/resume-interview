"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBlock,
  deleteBlock,
  listBlocks,
  updateBlock,
} from "../api";
import type { ResumeBlock } from "@/types";

export function useBlocks() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["blocks"],
    queryFn: async (): Promise<ResumeBlock[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listBlocks(token);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      block_type: string;
      title: string;
      content: Record<string, unknown>;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createBlock(token, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; content?: Record<string, unknown> };
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateBlock(id, token, data);
    },
    onSuccess: (updated) => {
      qc.setQueryData<ResumeBlock[]>(["blocks"], (prev) =>
        prev?.map((b) => (b.id === updated.id ? updated : b)) ?? []
      );
      // Also invalidate any assembled resume that might show this block
      qc.invalidateQueries({ queryKey: ["resume-blocks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteBlock(id, token, force);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks"] }),
  });

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
