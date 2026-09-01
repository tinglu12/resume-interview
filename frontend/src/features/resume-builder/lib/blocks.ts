"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { createBlock, deleteBlock, listBlocks, updateBlock } from "../api";
import type { ResumeBlock } from "@/types";

export function useBlocksQuery() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["blocks"],
    queryFn: async (): Promise<ResumeBlock[]> => listBlocks(await requireToken(getToken)),
  });
}

export function useCreateBlockMutation() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      block_type: string;
      title: string;
      content: Record<string, unknown>;
    }) => createBlock(await requireToken(getToken), data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks"] }),
  });
}

export function useUpdateBlockMutation() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; content?: Record<string, unknown> };
    }) => updateBlock(id, await requireToken(getToken), data),
    onSuccess: (updated) => {
      qc.setQueryData<ResumeBlock[]>(["blocks"], (prev) =>
        prev?.map((b) => (b.id === updated.id ? updated : b)) ?? []
      );
      // Also invalidate any assembled resume that might show this block
      qc.invalidateQueries({ queryKey: ["resume-blocks"] });
    },
  });
}

export function useDeleteBlockMutation() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, force = false }: { id: string; force?: boolean }) =>
      deleteBlock(id, await requireToken(getToken), force),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks"] }),
  });
}
