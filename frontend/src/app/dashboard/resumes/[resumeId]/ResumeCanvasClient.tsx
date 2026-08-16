"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { useResumeSections } from "@/features/resume-builder/hooks/useResumeSections";
import { useCanvasDnd } from "@/features/resume-builder/hooks/useCanvasDnd";
import { useBlockUsage } from "@/features/resume-builder/hooks/useBlockUsage";
import { ResumeCanvas } from "@/features/resume-builder/components/ResumeCanvas";
import { getResume } from "@/features/resume-display-upload/api";
import { BlockLibraryPane } from "./BlockLibraryPane";
import { ResumeCompositionPane } from "./ResumeCompositionPane";
import { PreviewRail } from "./PreviewRail";
import { DragOverlayContent } from "./DragOverlayContent";
import type { BlockType, Resume } from "@/types";

interface Props {
  resumeId: string;
}

export function ResumeCanvasClient({ resumeId }: Props) {
  const { getToken } = useAuth();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);

  const { blocks, loading: blocksLoading, error: blocksError, updateBlock, isUpdating } = useBlocks();
  const {
    sections,
    loading: sectionsLoading,
    error: sectionsError,
    createSection,
    updateSection,
    deleteSection,
    attachBlock,
    detachBlock,
    onSectionDragEnd,
    onBlockDragEnd,
  } = useResumeSections(resumeId);

  const resumeQuery = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async (): Promise<Resume> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getResume(resumeId, token);
    },
  });

  const { sensors, collisionDetection, activeBlock, handleDragStart, handleDragEnd, handleDragCancel } =
    useCanvasDnd({ sections, blocks, onSectionDragEnd, onBlockDragEnd, attachBlock });

  const { getUsage } = useBlockUsage();
  const getUsageCount = (blockId: string) => getUsage(blockId).count;
  const getUsageResumeNames = (blockId: string) => getUsage(blockId).resumeNames;

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? null;
  const activeSectionType: BlockType | null = activeSection?.section_type ?? null;

  // All blocks currently on the resume (for "Added" badge in library)
  const attachedSlots = sections.flatMap((s) => s.blocks);

  function handleActivateSection(id: string | null) {
    setActiveSectionId(id);
    if (id !== null && !libraryOpen) setLibraryOpen(true);
  }

  async function handleAttach(block: { id: string }) {
    if (!activeSectionId) return;
    const section = sections.find((s) => s.id === activeSectionId);
    if (!section) return;
    await attachBlock({
      sectionId: activeSectionId,
      blockId: block.id,
      position: section.blocks.length,
    });
  }

  async function handleDetachBlock(sectionId: string, blockId: string) {
    await detachBlock({ sectionId, blockId });
  }

  async function handleDeleteSection(sectionId: string) {
    await deleteSection(sectionId);
    if (activeSectionId === sectionId) setActiveSectionId(null);
  }

  async function handleRenameSection(sectionId: string, name: string) {
    await updateSection({ sectionId, data: { display_name: name } });
  }

  async function handleAddSection(sectionType: BlockType, displayName: string) {
    const position = sections.filter((s) => s.section_type !== "personal_info").length + 1;
    await createSection({ section_type: sectionType, display_name: displayName, position });
  }

  async function handleBlockSaved(
    id: string,
    data: { title: string; content: Record<string, unknown> }
  ) {
    await updateBlock({ id, data });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left side: block library stacked over the resume composition */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <BlockLibraryPane
            open={libraryOpen}
            onOpen={() => setLibraryOpen(true)}
            onClose={() => setLibraryOpen(false)}
            blocks={blocks}
            loading={blocksLoading}
            error={blocksError}
            attachedSlots={attachedSlots}
            activeSectionType={activeSectionType}
            onAttach={activeSectionId ? handleAttach : undefined}
            onClearActiveSection={() => setActiveSectionId(null)}
            getUsageCount={getUsageCount}
          />

          <ResumeCompositionPane>
            <ResumeCanvas
              resumeId={resumeId}
              sections={sections}
              loading={sectionsLoading}
              error={sectionsError}
              activeSectionId={activeSectionId}
              onActivateSection={handleActivateSection}
              onDetachBlock={handleDetachBlock}
              onDeleteSection={handleDeleteSection}
              onRenameSection={handleRenameSection}
              onAddSection={handleAddSection}
              onBlockSaved={handleBlockSaved}
              isSaving={isUpdating}
              getUsageCount={getUsageCount}
              getUsageResumeNames={getUsageResumeNames}
            />
          </ResumeCompositionPane>
        </div>

        {/* Right side: live PDF preview */}
        <PreviewRail
          open={previewOpen}
          onOpen={() => setPreviewOpen(true)}
          onClose={() => setPreviewOpen(false)}
          resume={resumeQuery.data}
          isPending={resumeQuery.isPending}
          slots={attachedSlots}
          sections={sections}
        />
      </div>

      <DragOverlay>
        <DragOverlayContent block={activeBlock} />
      </DragOverlay>
    </DndContext>
  );
}
