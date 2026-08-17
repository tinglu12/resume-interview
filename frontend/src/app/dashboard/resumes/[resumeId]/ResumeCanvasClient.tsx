"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { useResumeSections } from "@/features/resume-builder/hooks/useResumeSections";
import { useCanvasDnd } from "@/features/resume-builder/hooks/useCanvasDnd";
import { useBlockUsage } from "@/features/resume-builder/hooks/useBlockUsage";
import { ResumeCanvas } from "@/features/resume-builder/components/ResumeCanvas";
import { getResume } from "@/features/resume-display-upload/api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { BlockLibraryPane } from "./BlockLibraryPane";
import { PreviewRail } from "./PreviewRail";
import { DragOverlayContent } from "./DragOverlayContent";
import type { BlockType, Resume } from "@/types";

const COLLAPSED_SIZE = 48;

interface Props {
  resumeId: string;
}

export function ResumeCanvasClient({ resumeId }: Props) {
  const { getToken } = useAuth();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const libraryPanelRef = useRef<PanelImperativeHandle>(null);
  const previewPanelRef = useRef<PanelImperativeHandle>(null);

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
    if (id !== null && !libraryOpen) libraryPanelRef.current?.expand();
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
      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 overflow-hidden">
        {/* Left side: block library stacked over the resume composition */}
        <ResizablePanel
          id="editor-column"
          defaultSize="54%"
          minSize={360}
          className="flex flex-col min-w-0 min-h-0 overflow-hidden"
        >
          <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
            <ResizablePanel
              id="block-library"
              panelRef={libraryPanelRef}
              collapsible
              collapsedSize={COLLAPSED_SIZE}
              defaultSize="38%"
              minSize={160}
              onResize={() => setLibraryOpen(!libraryPanelRef.current?.isCollapsed())}
              className="min-h-0 flex flex-col overflow-hidden"
            >
              <BlockLibraryPane
                open={libraryOpen}
                onOpen={() => libraryPanelRef.current?.expand()}
                onClose={() => libraryPanelRef.current?.collapse()}
                blocks={blocks}
                loading={blocksLoading}
                error={blocksError}
                attachedSlots={attachedSlots}
                activeSectionType={activeSectionType}
                onAttach={activeSectionId ? handleAttach : undefined}
                onClearActiveSection={() => setActiveSectionId(null)}
                getUsageCount={getUsageCount}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel id="resume-composition" minSize={200} className="min-h-0 flex flex-col overflow-hidden">
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right side: live PDF preview */}
        <ResizablePanel
          id="preview"
          panelRef={previewPanelRef}
          collapsible
          collapsedSize={COLLAPSED_SIZE}
          defaultSize="46%"
          minSize={380}
          maxSize={720}
          onResize={() => setPreviewOpen(!previewPanelRef.current?.isCollapsed())}
          className="min-h-0 flex flex-col overflow-hidden"
        >
          <PreviewRail
            open={previewOpen}
            onOpen={() => previewPanelRef.current?.expand()}
            onClose={() => previewPanelRef.current?.collapse()}
            resume={resumeQuery.data}
            resumeId={resumeId}
            isPending={resumeQuery.isPending}
            slots={attachedSlots}
            sections={sections}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <DragOverlay>
        <DragOverlayContent block={activeBlock} />
      </DragOverlay>
    </DndContext>
  );
}
