"use client";

import { arrayMove } from "@dnd-kit/sortable";
import {
  useAttachBlockMutation,
  useCreateSectionMutation,
  useDeleteSectionMutation,
  useDetachBlockMutation,
  useReorderSectionBlocksMutation,
  useReorderSectionsMutation,
  useResumeSectionsQuery,
  useUpdateSectionMutation,
} from "../lib/sections";

export function useResumeSections(resumeId: string) {
  const query = useResumeSectionsQuery(resumeId);
  const sections = query.data ?? [];

  const createSection = useCreateSectionMutation(resumeId);
  const updateSection = useUpdateSectionMutation(resumeId);
  const deleteSection = useDeleteSectionMutation(resumeId);
  const reorderSectionsMutation = useReorderSectionsMutation(resumeId);
  const attachBlock = useAttachBlockMutation(resumeId);
  const detachBlock = useDetachBlockMutation(resumeId);
  const reorderSectionBlocksMutation = useReorderSectionBlocksMutation(resumeId);

  function onSectionDragEnd(activeId: string, overId: string) {
    const oldIndex = sections.findIndex((s) => s.id === activeId);
    const newIndex = sections.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const reordered = arrayMove(sections, oldIndex, newIndex);
    reorderSectionsMutation.mutate(reordered);
  }

  function onBlockDragEnd(sectionId: string, activeBlockId: string, overBlockId: string) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const oldIndex = section.blocks.findIndex((b) => b.block.id === activeBlockId);
    const newIndex = section.blocks.findIndex((b) => b.block.id === overBlockId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const reordered = arrayMove(section.blocks, oldIndex, newIndex).map((b, i) => ({
      block_id: b.block.id,
      position: i,
    }));
    reorderSectionBlocksMutation.mutate({ sectionId, newOrder: reordered });
  }

  return {
    sections,
    loading: query.isPending,
    error: query.error?.message ?? null,
    createSection: createSection.mutateAsync,
    updateSection: updateSection.mutateAsync,
    deleteSection: deleteSection.mutateAsync,
    attachBlock: attachBlock.mutateAsync,
    detachBlock: detachBlock.mutateAsync,
    isAttaching: attachBlock.isPending,
    onSectionDragEnd,
    onBlockDragEnd,
  };
}
