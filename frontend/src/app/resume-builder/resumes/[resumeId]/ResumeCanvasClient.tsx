"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { useAssembledResume } from "@/features/resume-builder/hooks/useAssembledResume";
import { BlockLibraryPanel } from "@/features/resume-builder/components/BlockLibraryPanel";
import { ResumeCanvas } from "@/features/resume-builder/components/ResumeCanvas";
import { ResumePDFPreview } from "@/features/resume-builder/components/ResumePDFPreview";
import { getResume } from "@/features/resume-builder/api";
import type { Resume } from "@/types";

interface Props {
  resumeId: string;
}

export function ResumeCanvasClient({ resumeId }: Props) {
  const { getToken } = useAuth();

  const { blocks, loading: blocksLoading, error: blocksError, updateBlock, isUpdating } = useBlocks();
  const { blockSlots, loading: slotsLoading, error: slotsError, attachBlock, detachBlock } =
    useAssembledResume(resumeId);

  const resumeQuery = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async (): Promise<Resume> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getResume(resumeId, token);
    },
  });

  async function handleAttach(block: { id: string }) {
    await attachBlock({ blockId: block.id, position: blockSlots.length });
  }

  async function handleDetach(blockId: string) {
    await detachBlock(blockId);
  }

  async function handleBlockSaved(
    id: string,
    data: { title: string; content: Record<string, unknown> }
  ) {
    await updateBlock({ id, data });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Block library */}
      <aside className="w-64 shrink-0 border-r bg-background p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Block library
        </h2>
        <BlockLibraryPanel
          blocks={blocks}
          loading={blocksLoading}
          error={blocksError}
          attachedSlots={blockSlots}
          onBlockClick={() => {}}
          onAddToResume={handleAttach}
        />
      </aside>

      {/* Middle: Canvas */}
      <section className="w-80 shrink-0 border-r overflow-y-auto p-4">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
          Blocks — drag to reorder
        </h2>
        <ResumeCanvas
          resumeId={resumeId}
          slots={blockSlots}
          loading={slotsLoading}
          error={slotsError}
          onDetach={handleDetach}
          onBlockSaved={handleBlockSaved}
          isSaving={isUpdating}
        />
      </section>

      {/* Right: Live PDF preview */}
      <section className="flex-1 overflow-hidden">
        {resumeQuery.data ? (
          <ResumePDFPreview resume={resumeQuery.data} slots={blockSlots} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {resumeQuery.isPending ? "Loading preview…" : "Could not load resume"}
          </div>
        )}
      </section>
    </div>
  );
}
