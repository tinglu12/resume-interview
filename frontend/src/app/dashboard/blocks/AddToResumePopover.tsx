"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useResumeFetch } from "@/features/resume-display-upload/hook/useResumeFetch";
import { useAddBlockToResume } from "@/features/resume-builder/hooks/useAddBlockToResume";
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
  const [status, setStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { assembledResumes: builderResumes, loading } = useResumeFetch({ enabled: open });
  const { addBlockToResume } = useAddBlockToResume();

  async function handleAdd(resume: Resume) {
    setStatus(null);
    const name = resume.display_name ?? resume.filename;
    const result = await addBlockToResume({
      resumeId: resume.id,
      blockId: block.id,
      sectionType: block.block_type,
    });
    setStatus(
      result.attached
        ? `Added to "${name}".`
        : `No ${BLOCK_TYPE_LABELS[block.block_type]} section on "${name}" — add it from that resume's canvas instead.`
    );
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
        {loading ? (
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
