"use client";

import { ChevronDown, ChevronUp, Library } from "lucide-react";
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

export function BlockLibraryPane({
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
      <section className="h-full border-b border-hairline bg-panel">
        <button
          onClick={onOpen}
          className="w-full h-full flex items-center gap-2 px-5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Expand block library"
        >
          <ChevronDown className="h-4 w-4" />
          <Library className="h-4 w-4" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-wide">
            Block library
          </span>
          <span className="ml-auto font-mono text-[11px]">{blocks.length}</span>
        </button>
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 flex flex-col border-b border-hairline bg-panel">
      <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Block library
        </h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Collapse block library"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 flex px-5 pb-4 overflow-hidden">
        <BlockLibraryPanel
          blocks={blocks}
          loading={loading}
          error={error}
          attachedSlots={attachedSlots}
          activeSectionType={activeSectionType}
          onBlockClick={() => {}}
          onAddToResume={onAttach}
          onClearActiveSection={onClearActiveSection}
          getUsageCount={getUsageCount}
          layout="grid"
        />
      </div>
    </section>
  );
}
