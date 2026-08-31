"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { attachBlock, detachBlock, getResumeBlocks, reorderBlocks } from "../api";
import type { BlockOnResume } from "@/types";

function resumeBlocksKey(resumeId: string) {
  return ["resume-blocks", resumeId];
}

export function useResumeBlocksQuery(resumeId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: resumeBlocksKey(resumeId),
    queryFn: async (): Promise<BlockOnResume[]> =>
      getResumeBlocks(resumeId, await requireToken(getToken)),
    enabled: !!resumeId,
  });
}

export function useAttachBlockToResumeMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeBlocksKey(resumeId);

  return useMutation({
    mutationFn: async ({ blockId, position }: { blockId: string; position: number }) =>
      attachBlock(resumeId, await requireToken(getToken), blockId, position),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useDetachBlockFromResumeMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeBlocksKey(resumeId);

  return useMutation({
    mutationFn: async (blockId: string) =>
      detachBlock(resumeId, blockId, await requireToken(getToken)),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useReorderResumeBlocksMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeBlocksKey(resumeId);

  return useMutation({
    mutationFn: async (newOrder: BlockOnResume[]) => {
      const token = await requireToken(getToken);
      const blocks = newOrder.map((slot, i) => ({
        block_id: slot.block.id,
        position: i,
      }));
      return reorderBlocks(resumeId, token, blocks);
    },
    onMutate: async (newOrder) => {
      // Cancel any in-flight refetches so they don't overwrite the optimistic update
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<BlockOnResume[]>(queryKey);
      qc.setQueryData<BlockOnResume[]>(queryKey, newOrder);
      return { previous };
    },
    onError: (_err, _newOrder, context) => {
      qc.setQueryData<BlockOnResume[]>(queryKey, context?.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}
