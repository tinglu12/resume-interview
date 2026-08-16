"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attachBlockToSection,
  createAssembledResume,
  createResumeSection,
  getResumeSections,
} from "@/features/resume-builder/api";
import type { Resume } from "@/types";

// NOTE: there is no backend "duplicate resume" endpoint (see PRD ticket SYNC-9).
// This orchestrates existing, already-tested endpoints client-side: create a new
// builder resume, recreate its section structure, and re-attach the SAME block
// rows (not copies) so editing a shared block still updates every resume that
// uses it. This sequence is NOT atomic — if a request fails partway through, the
// new resume can be left with a partial section/block set. A real backend
// endpoint would fix that; this is an acceptable frontend-only stopgap.
export function useDuplicateResume() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const duplicateResume = useMutation({
    mutationFn: async ({
      sourceResumeId,
      newDisplayName,
    }: {
      sourceResumeId: string;
      newDisplayName: string;
    }): Promise<Resume> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const sourceSections = await getResumeSections(sourceResumeId, token);
      const newResume = await createAssembledResume(token, newDisplayName);
      // createAssembledResume already creates the pinned personal_info section
      // — reuse it instead of creating a second one.
      const newResumeExistingSections = await getResumeSections(newResume.id, token);

      for (const section of sourceSections) {
        const targetSection =
          section.section_type === "personal_info"
            ? newResumeExistingSections.find((s) => s.section_type === "personal_info")
            : await createResumeSection(newResume.id, token, {
                section_type: section.section_type,
                display_name: section.display_name,
                position: section.position,
              });

        if (!targetSection) continue;

        for (const slot of section.blocks) {
          await attachBlockToSection(
            newResume.id,
            targetSection.id,
            token,
            slot.block.id,
            slot.position,
          );
        }
      }

      return newResume;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
  });

  return {
    duplicateResume: duplicateResume.mutateAsync,
    isDuplicating: duplicateResume.isPending,
    error: duplicateResume.error?.message ?? null,
  };
}
