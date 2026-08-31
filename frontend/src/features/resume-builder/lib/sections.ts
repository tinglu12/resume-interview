"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
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

export function resumeSectionsKey(resumeId: string) {
  return ["resume-sections", resumeId];
}

export function useResumeSectionsQuery(resumeId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: resumeSectionsKey(resumeId),
    queryFn: async (): Promise<ResumeSection[]> =>
      getResumeSections(resumeId, await requireToken(getToken)),
    enabled: !!resumeId,
  });
}

export function useCreateSectionMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeSectionsKey(resumeId);

  return useMutation({
    mutationFn: async (data: {
      section_type: BlockType;
      display_name: string;
      position: number;
    }) => createResumeSection(resumeId, await requireToken(getToken), data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useUpdateSectionMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeSectionsKey(resumeId);

  return useMutation({
    mutationFn: async ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: { display_name?: string; position?: number };
    }) => updateResumeSection(resumeId, sectionId, await requireToken(getToken), data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useDeleteSectionMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeSectionsKey(resumeId);

  return useMutation({
    mutationFn: async (sectionId: string) =>
      deleteResumeSection(resumeId, sectionId, await requireToken(getToken)),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useReorderSectionsMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeSectionsKey(resumeId);

  return useMutation({
    mutationFn: async (newOrder: ResumeSection[]) => {
      const token = await requireToken(getToken);
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
}

export function useAttachBlockMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeSectionsKey(resumeId);

  return useMutation({
    mutationFn: async ({
      sectionId,
      blockId,
      position,
    }: {
      sectionId: string;
      blockId: string;
      position: number;
    }) => attachBlockToSection(resumeId, sectionId, await requireToken(getToken), blockId, position),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useDetachBlockMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeSectionsKey(resumeId);

  return useMutation({
    mutationFn: async ({
      sectionId,
      blockId,
    }: {
      sectionId: string;
      blockId: string;
    }) => detachBlockFromSection(resumeId, sectionId, blockId, await requireToken(getToken)),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useReorderSectionBlocksMutation(resumeId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const queryKey = resumeSectionsKey(resumeId);

  return useMutation({
    mutationFn: async ({
      sectionId,
      newOrder,
    }: {
      sectionId: string;
      newOrder: Array<{ block_id: string; position: number }>;
    }) => reorderSectionBlocks(resumeId, sectionId, await requireToken(getToken), newOrder),
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
}
