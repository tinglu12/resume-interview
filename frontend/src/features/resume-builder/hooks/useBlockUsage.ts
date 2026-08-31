"use client";

import { useResumesQuery } from "@/features/resume-display-upload/lib/resumes";
import { useSectionsForResumesQuery } from "../lib/block-usage";

export interface BlockUsage {
  count: number;
  resumeNames: string[];
}

// NOTE: the backend has no aggregated usage-count field on ResumeBlock (see PRD
// ticket SYNC-4). This computes it client-side by fetching every resume's
// sections and cross-referencing block IDs — an N+1 fetch pattern that's fine
// at this app's per-user scale (a handful to a few dozen resumes) but wouldn't
// scale to a multi-tenant view. A real backend aggregate would be the fix.
export function useBlockUsage() {
  const resumesQuery = useResumesQuery();
  const builderResumes = (resumesQuery.data ?? []).filter((r) => r.resume_type === "builder");
  const sectionsQueries = useSectionsForResumesQuery(builderResumes.map((r) => r.id));

  const loading = resumesQuery.isPending || sectionsQueries.some((q) => q.isPending);

  const usage = new Map<string, BlockUsage>();
  builderResumes.forEach((resume, i) => {
    const sections = sectionsQueries[i]?.data ?? [];
    const resumeName = resume.display_name ?? resume.filename;
    const blockIdsOnThisResume = new Set<string>();
    for (const section of sections) {
      for (const slot of section.blocks) {
        blockIdsOnThisResume.add(slot.block.id);
      }
    }
    for (const blockId of blockIdsOnThisResume) {
      const existing = usage.get(blockId);
      if (existing) {
        existing.count += 1;
        existing.resumeNames.push(resumeName);
      } else {
        usage.set(blockId, { count: 1, resumeNames: [resumeName] });
      }
    }
  });

  function getUsage(blockId: string): BlockUsage {
    return usage.get(blockId) ?? { count: 0, resumeNames: [] };
  }

  return { usage, getUsage, loading };
}
