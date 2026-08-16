"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BlockCard } from "./BlockCard";
import type { BlockOnResume, BlockType, ResumeBlock } from "@/types";

const BLOCK_TYPE_FILTERS: { value: BlockType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "personal_info", label: "Personal Info" },
  { value: "work_experience", label: "Work" },
  { value: "project", label: "Projects" },
  { value: "education", label: "Education" },
  { value: "skills", label: "Skills" },
  { value: "summary", label: "Summary" },
  { value: "custom", label: "Custom" },
];

interface Props {
  blocks: ResumeBlock[];
  loading: boolean;
  error: string | null;
  attachedSlots?: BlockOnResume[];
  activeSectionType?: BlockType | null;
  onBlockClick: (block: ResumeBlock) => void;
  onAddToResume?: (block: ResumeBlock) => void;
  onClearActiveSection?: () => void;
  /** Opens the block editor modal for a card — opt-in, used by the standalone/dashboard library. */
  editingBlockId?: string | null;
  onOpenEditor?: (block: ResumeBlock) => void;
  getUsageCount?: (blockId: string) => number;
}

const SECTION_TYPE_LABELS: Record<BlockType, string> = {
  work_experience: "Work Experience",
  project: "Projects",
  education: "Education",
  skills: "Technical Skills",
  summary: "Summary",
  custom: "Custom",
  personal_info: "Contact",
};

export function BlockLibraryPanel({
  blocks,
  loading,
  error,
  attachedSlots = [],
  activeSectionType = null,
  onBlockClick,
  onAddToResume,
  onClearActiveSection,
  editingBlockId,
  onOpenEditor,
  getUsageCount,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BlockType | "all">("all");

  const attachedIds = new Set(attachedSlots.map((s) => s.block.id));

  const effectiveFilter = activeSectionType ?? filter;

  const visible = blocks.filter((b) => {
    if (effectiveFilter !== "all" && b.block_type !== effectiveFilter) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      <Input
        placeholder="Search blocks…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-sm shrink-0"
      />

      {/* Active section banner */}
      {activeSectionType ? (
        <div className="shrink-0 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <span>Adding to: {SECTION_TYPE_LABELS[activeSectionType]}</span>
          {onClearActiveSection && (
            <button
              onClick={onClearActiveSection}
              className="ml-2 hover:text-primary/70 transition-colors"
              aria-label="Clear section filter"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        /* Filter pills */
        <div className="shrink-0 flex flex-wrap gap-1">
          {BLOCK_TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 overflow-y-auto">
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center pt-6">
            {blocks.length === 0
              ? "No blocks yet."
              : "No blocks match your search."}
          </p>
        )}

        {visible.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onClick={() => onBlockClick(block)}
            onAddToResume={
              onAddToResume ? () => onAddToResume(block) : undefined
            }
            isAdded={attachedIds.has(block.id)}
            usageCount={getUsageCount ? getUsageCount(block.id) : 1}
            isEditing={editingBlockId === block.id}
            onOpenEditor={onOpenEditor ? () => onOpenEditor(block) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
