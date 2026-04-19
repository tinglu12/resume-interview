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
  onBlockClick: (block: ResumeBlock) => void;
  onAddToResume?: (block: ResumeBlock) => void;
}

export function BlockLibraryPanel({
  blocks,
  loading,
  error,
  attachedSlots = [],
  onBlockClick,
  onAddToResume,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BlockType | "all">("all");

  const attachedIds = new Set(attachedSlots.map((s) => s.block.id));

  const visible = blocks.filter((b) => {
    if (filter !== "all" && b.block_type !== filter) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3 h-full">
      <Input
        placeholder="Search blocks…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-sm"
      />

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1">
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

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
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
            {blocks.length === 0 ? "No blocks yet." : "No blocks match your search."}
          </p>
        )}

        {visible.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onClick={() => onBlockClick(block)}
            onAddToResume={onAddToResume ? () => onAddToResume(block) : undefined}
            isAdded={attachedIds.has(block.id)}
          />
        ))}
      </div>
    </div>
  );
}
