"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { attachBlockToSection, getResumeSections } from "@/features/resume-builder/api";
import { listResumes } from "@/features/resume-display-upload/api";
import type { BlockType, Resume, ResumeBlock } from "@/types";

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  work_experience: "Work Experience",
  project: "Projects",
  education: "Education",
  skills: "Skills",
  summary: "Summary",
  custom: "Custom",
  personal_info: "Personal Info",
};

export function AddToResumePopover({ block }: { block: ResumeBlock }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: async (): Promise<Resume[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listResumes(token);
    },
    enabled: open,
  });

  const builderResumes = (resumesQuery.data ?? []).filter((r) => r.resume_type === "builder");

  async function handleAdd(resume: Resume) {
    setStatus(null);
    const token = await getToken();
    if (!token) return;
    const sections = await getResumeSections(resume.id, token);
    const target = sections.find((s) => s.section_type === block.block_type);
    if (!target) {
      setStatus(
        `No ${BLOCK_TYPE_LABELS[block.block_type]} section on "${resume.display_name ?? resume.filename}" — add it from that resume's canvas instead.`
      );
      return;
    }
    await attachBlockToSection(resume.id, target.id, token, block.id, target.blocks.length);
    qc.invalidateQueries({ queryKey: ["resume-sections", resume.id] });
    setStatus(`Added to "${resume.display_name ?? resume.filename}".`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="text-[11.5px] font-semibold text-foreground border border-hairline rounded-md px-2.5 py-1 hover:bg-panel"
        >
          Add to resume ▾
        </button>
      </PopoverTrigger>
      <PopoverContent onClick={(e) => e.stopPropagation()} className="w-64">
        {resumesQuery.isPending ? (
          <p className="text-xs text-muted-foreground">Loading resumes…</p>
        ) : builderResumes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No resumes yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {builderResumes.map((r) => (
              <button
                key={r.id}
                onClick={() => handleAdd(r)}
                className="text-left text-xs px-2 py-1.5 rounded-md hover:bg-panel"
              >
                {r.display_name ?? r.filename}
              </button>
            ))}
          </div>
        )}
        {status && <p className="text-[11px] text-muted-foreground mt-2">{status}</p>}
      </PopoverContent>
    </Popover>
  );
}
