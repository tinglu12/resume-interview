"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BlockEditorModal } from "@/features/resume-builder/components/BlockEditorModal";
import { getEdgeStripeBackground } from "@/features/resume-builder/lib/blockTypeEdge";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { useBlockUsage } from "@/features/resume-builder/hooks/useBlockUsage";
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

const TYPE_ORDER: BlockType[] = [
  "work_experience",
  "project",
  "education",
  "skills",
  "summary",
  "personal_info",
  "custom",
];

function AddToResumePopover({ block }: { block: ResumeBlock }) {
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

export function BlockLibraryClient() {
  const { blocks, loading, error, updateBlock, isUpdating } = useBlocks();
  const { getUsage } = useBlockUsage();
  const [filter, setFilter] = useState<BlockType | "all">("all");
  const [editingBlock, setEditingBlock] = useState<ResumeBlock | null>(null);

  const counts = new Map<BlockType, number>();
  for (const b of blocks) counts.set(b.block_type, (counts.get(b.block_type) ?? 0) + 1);

  const visibleTypes = filter === "all" ? TYPE_ORDER.filter((t) => counts.get(t)) : [filter];

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-[560px]">
        <h1 className="font-bold text-[22px] mb-1.5">Every block you&apos;ve written</h1>
        <p className="text-[13px] text-muted-foreground">
          Reuse it, don&apos;t retype it. Add any block straight onto another resume without
          opening it.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            filter === "all"
              ? "bg-foreground text-background"
              : "bg-card border border-hairline text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({blocks.length})
        </button>
        {TYPE_ORDER.filter((t) => counts.get(t)).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              filter === t
                ? "bg-foreground text-background"
                : "bg-card border border-hairline text-muted-foreground hover:text-foreground"
            }`}
          >
            {BLOCK_TYPE_LABELS[t]} ({counts.get(t)})
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading blocks…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading &&
        !error &&
        visibleTypes.map((type) => {
          const typeBlocks = blocks.filter((b) => b.block_type === type);
          if (typeBlocks.length === 0) return null;
          return (
            <div key={type}>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-2.5">
                {BLOCK_TYPE_LABELS[type]}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {typeBlocks.map((block) => {
                  const usage = getUsage(block.id);
                  return (
                    <div
                      key={block.id}
                      onClick={() => setEditingBlock(block)}
                      className="relative overflow-hidden cursor-pointer rounded-[9px] border border-hairline bg-card pl-5 pr-3.5 py-3.5 flex flex-col gap-2 hover:shadow-md transition-shadow"
                      style={{
                        background: getEdgeStripeBackground(type, usage.count || 1),
                        backgroundColor: "var(--card)",
                      }}
                    >
                      <div className="font-semibold text-[13.5px]">{block.title}</div>
                      {usage.count > 1 && (
                        <div className="font-mono text-[9px] tracking-[0.05em] uppercase text-accent-teal">
                          Used in {usage.count} resumes
                        </div>
                      )}
                      <div onClick={(e) => e.stopPropagation()} className="self-start">
                        <AddToResumePopover block={block} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      <BlockEditorModal
        block={editingBlock}
        usageCount={editingBlock ? getUsage(editingBlock.id).count : 1}
        usageResumeNames={editingBlock ? getUsage(editingBlock.id).resumeNames : []}
        onClose={() => setEditingBlock(null)}
        onSave={async (id, data) => {
          await updateBlock({ id, data });
        }}
        isSaving={isUpdating}
      />
    </div>
  );
}
