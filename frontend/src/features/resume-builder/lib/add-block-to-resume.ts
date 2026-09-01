"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { attachBlockToSection, getResumeSections } from "../api";
import type { BlockType } from "@/types";

export function useAddBlockToResumeMutation() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resumeId,
      blockId,
      sectionType,
    }: {
      resumeId: string;
      blockId: string;
      sectionType: BlockType;
    }): Promise<{ attached: boolean }> => {
      const token = await requireToken(getToken);
      const sections = await getResumeSections(resumeId, token);
      const target = sections.find((s) => s.section_type === sectionType);
      if (!target) return { attached: false };
      await attachBlockToSection(resumeId, target.id, token, blockId, target.blocks.length);
      return { attached: true };
    },
    onSuccess: (result, variables) => {
      if (result.attached) {
        qc.invalidateQueries({ queryKey: ["resume-sections", variables.resumeId] });
      }
    },
  });
}
