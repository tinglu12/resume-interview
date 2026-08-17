"use client";

import { useState } from "react";
import { BlockEditorModal } from "@/features/resume-builder/components/BlockEditorModal";
import { getEdgeStripeBackground } from "@/features/resume-builder/lib/blockTypeEdge";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { useBlockUsage } from "@/features/resume-builder/hooks/useBlockUsage";
import { AddToResumePopover } from "./AddToResumePopover";
import type { BlockType, ResumeBlock } from "@/types";

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
