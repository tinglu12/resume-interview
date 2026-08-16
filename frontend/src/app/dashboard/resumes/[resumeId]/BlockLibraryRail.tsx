"use client";

import { ChevronLeft, ChevronRight, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlockLibraryPanel } from "@/features/resume-builder/components/BlockLibraryPanel";
import type { BlockOnResume, BlockType, ResumeBlock } from "@/types";

interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  blocks: ResumeBlock[];
  loading: boolean;
  error: string | null;
  attachedSlots: BlockOnResume[];
  activeSectionType: BlockType | null;
  onAttach?: (block: ResumeBlock) => void;
  onClearActiveSection: () => void;
  getUsageCount: (blockId: string) => number;
}

export function BlockLibraryRail({
  open,
  onOpen,
  onClose,
  blocks,
  loading,
  error,
  attachedSlots,
  activeSectionType,
  onAttach,
  onClearActiveSection,
  getUsageCount,
}: Props) {
  if (!open) {
    return (
      <aside className="shrink-0 border-r border-hairline bg-panel flex flex-col transition-[width] duration-200 w-12">
        <button
          onClick={onOpen}
          className="flex-1 flex flex-col items-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Expand block library"
        >
          <ChevronRight className="h-4 w-4" />
          <Library className="h-4 w-4" />
          <span className="text-xs [writing-mode:vertical-rl] tracking-wide">Library</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "border-r border-hairline bg-panel flex flex-col transition-[width] duration-200",
        "w-80 h-full overflow-auto p-4"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Block library
        </h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Collapse block library"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <BlockLibraryPanel
        blocks={blocks}
        loading={loading}
        error={error}
        attachedSlots={attachedSlots}
        activeSectionType={activeSectionType}
        onBlockClick={() => {}}
        onAddToResume={onAttach}
        onClearActiveSection={onClearActiveSection}
        />
    </aside>
  );
}
