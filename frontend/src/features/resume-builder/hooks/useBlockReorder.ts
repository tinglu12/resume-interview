"use client";

import { useAuth } from "@clerk/nextjs";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderBlocks } from "../api";
import type { BlockOnResume } from "@/types";

export function useBlockReorder(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["resume-blocks", resumeId];

  const mutation = useMutation({
    mutationFn: async (newOrder: BlockOnResume[]) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
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

  function onDragEnd(activeId: string, overId: string) {
    const current = qc.getQueryData<BlockOnResume[]>(queryKey);
    if (!current) return;

    const oldIndex = current.findIndex((s) => s.block.id === activeId);
    const newIndex = current.findIndex((s) => s.block.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(current, oldIndex, newIndex).map((s, i) => ({
      ...s,
      position: i,
    }));
    mutation.mutate(reordered);
  }

  return { onDragEnd };
}
