"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attachBlock, detachBlock, getResumeBlocks } from "../api";
import type { BlockOnResume } from "@/types";

export function useAssembledResume(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["resume-blocks", resumeId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<BlockOnResume[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getResumeBlocks(resumeId, token);
    },
    enabled: !!resumeId,
  });

  const attachMutation = useMutation({
    mutationFn: async ({
      blockId,
      position,
    }: {
      blockId: string;
      position: number;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return attachBlock(resumeId, token, blockId, position);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const detachMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return detachBlock(resumeId, blockId, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return {
    blockSlots: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    attachBlock: attachMutation.mutateAsync,
    detachBlock: detachMutation.mutateAsync,
    isAttaching: attachMutation.isPending,
  };
}
