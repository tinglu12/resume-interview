"use client";

import { useAuth } from "@clerk/nextjs";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  attachBlockToSection,
  createResumeSection,
  deleteResumeSection,
  detachBlockFromSection,
  getResumeSections,
  reorderSectionBlocks,
  reorderSections,
  updateResumeSection,
} from "../api";
import type { BlockType, ResumeSection } from "@/types";

export function useResumeSections(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["resume-sections", resumeId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ResumeSection[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getResumeSections(resumeId, token);
    },
    enabled: !!resumeId,
  });

  const createSection = useMutation({
    mutationFn: async (data: {
      section_type: BlockType;
      display_name: string;
      position: number;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createResumeSection(resumeId, token, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateSection = useMutation({
    mutationFn: async ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: { display_name?: string; position?: number };
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateResumeSection(resumeId, sectionId, token, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteResumeSection(resumeId, sectionId, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (newOrder: ResumeSection[]) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const sections = newOrder.map((s, i) => ({ section_id: s.id, position: i }));
      return reorderSections(resumeId, token, sections);
    },
    onMutate: async (newOrder) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ResumeSection[]>(queryKey);
      qc.setQueryData<ResumeSection[]>(queryKey, newOrder.map((s, i) => ({ ...s, position: i })));
      return { previous };
    },
    onError: (_err, _newOrder, context) => {
      qc.setQueryData<ResumeSection[]>(queryKey, context?.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const attachBlock = useMutation({
    mutationFn: async ({
      sectionId,
      blockId,
      position,
    }: {
      sectionId: string;
      blockId: string;
      position: number;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return attachBlockToSection(resumeId, sectionId, token, blockId, position);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const detachBlock = useMutation({
    mutationFn: async ({
      sectionId,
      blockId,
    }: {
      sectionId: string;
      blockId: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return detachBlockFromSection(resumeId, sectionId, blockId, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const reorderSectionBlocksMutation = useMutation({
    mutationFn: async ({
      sectionId,
      newOrder,
    }: {
      sectionId: string;
      newOrder: Array<{ block_id: string; position: number }>;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return reorderSectionBlocks(resumeId, sectionId, token, newOrder);
    },
    onMutate: async ({ sectionId, newOrder }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ResumeSection[]>(queryKey);
      if (previous) {
        const updated = previous.map((s) => {
          if (s.id !== sectionId) return s;
          const blockMap = new Map(s.blocks.map((b) => [b.block.id, b]));
          const reordered = newOrder
            .map(({ block_id, position }) => {
              const slot = blockMap.get(block_id);
              return slot ? { ...slot, position } : null;
            })
            .filter(Boolean) as ResumeSection["blocks"];
          return { ...s, blocks: reordered };
        });
        qc.setQueryData<ResumeSection[]>(queryKey, updated);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData<ResumeSection[]>(queryKey, context?.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  function onSectionDragEnd(activeId: string, overId: string) {
    const current = qc.getQueryData<ResumeSection[]>(queryKey);
    if (!current) return;
    const oldIndex = current.findIndex((s) => s.id === activeId);
    const newIndex = current.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const reordered = arrayMove(current, oldIndex, newIndex);
    reorderSectionsMutation.mutate(reordered);
  }

  function onBlockDragEnd(sectionId: string, activeBlockId: string, overBlockId: string) {
    const current = qc.getQueryData<ResumeSection[]>(queryKey);
    if (!current) return;
    const section = current.find((s) => s.id === sectionId);
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
    sections: query.data ?? [],
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
