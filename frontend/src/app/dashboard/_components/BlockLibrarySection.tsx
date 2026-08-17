"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BlockLibraryPanel } from "@/features/resume-builder/components/BlockLibraryPanel";
import { BlockEditorModal } from "@/features/resume-builder/components/BlockEditorModal";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { useBlockUsage } from "@/features/resume-builder/hooks/useBlockUsage";
import type { ResumeBlock } from "@/types";

export function BlockLibrarySection() {
  const { blocks, loading: blocksLoading, error: blocksError, updateBlock, isUpdating } = useBlocks();
  const { getUsage } = useBlockUsage();
  const [editingBlock, setEditingBlock] = useState<ResumeBlock | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Block library</h2>
        <Button size="sm" asChild>
          <Link href="/dashboard/blocks/new">+ New block</Link>
        </Button>
      </div>
      <BlockLibraryPanel
        blocks={blocks}
        loading={blocksLoading}
        error={blocksError}
        onBlockClick={() => {}}
        editingBlockId={editingBlock?.id ?? null}
        onOpenEditor={(block) => setEditingBlock(block)}
        getUsageCount={(blockId) => getUsage(blockId).count}
      />
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
    </section>
  );
}
