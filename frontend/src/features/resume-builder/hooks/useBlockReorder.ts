"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useReorderResumeBlocksMutation } from "../lib/resume-blocks";
import type { BlockOnResume } from "@/types";

export function useBlockReorder(resumeId: string) {
  const qc = useQueryClient();
  const queryKey = ["resume-blocks", resumeId];
  const mutation = useReorderResumeBlocksMutation(resumeId);

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
