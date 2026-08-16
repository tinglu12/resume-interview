"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Library, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { useResumeSections } from "@/features/resume-builder/hooks/useResumeSections";
import { useCanvasDnd } from "@/features/resume-builder/hooks/useCanvasDnd";
import { useBlockUsage } from "@/features/resume-builder/hooks/useBlockUsage";
import { BlockLibraryPanel } from "@/features/resume-builder/components/BlockLibraryPanel";
import { ResumeCanvas } from "@/features/resume-builder/components/ResumeCanvas";
import { ResumePDFPreview } from "@/features/resume-builder/components/ResumePDFPreview";
import { getEdgeColor, isDashedEdge } from "@/features/resume-builder/lib/blockTypeEdge";
import { getResume } from "@/features/resume-display-upload/api";
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
      {/* Left: Block library — collapsible rail */}
      <aside
        className={cn(
          "shrink-0 border-r border-hairline bg-panel flex flex-col transition-[width] duration-200",
          libraryOpen ? "w-80" : "w-12"
        )}
      >
        {libraryOpen ? (
          <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between mb-3">
              <h2 className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Block library
              </h2>
              <button
                onClick={() => setLibraryOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Collapse block library"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <BlockLibraryPanel
              blocks={blocks}
              loading={blocksLoading}
              error={blocksError}
              attachedSlots={attachedSlots}
              activeSectionType={activeSectionType}
              onBlockClick={() => {}}
              onAddToResume={activeSectionId ? handleAttach : undefined}
              onClearActiveSection={() => setActiveSectionId(null)}
              getUsageCount={getUsageCount}
            />
          </div>
        ) : (
          <button
            onClick={() => setLibraryOpen(true)}
            className="flex-1 flex flex-col items-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Expand block library"
          >
            <ChevronRight className="h-4 w-4" />
            <Library className="h-4 w-4" />
            <span className="text-xs [writing-mode:vertical-rl] tracking-wide">Library</span>
          </button>
        )}
      </aside>

      {/* Middle: Canvas — always visible, expands to fill freed rail space */}
      <section className="flex-1 min-w-0 min-h-0 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-mono text-[11px] font-medium mb-4 text-muted-foreground uppercase tracking-wide">
            Resume
          </h2>
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
        </div>
      </section>

      {/* Right: Live PDF preview — collapsible rail */}
      <aside
        className={cn(
          "shrink-0 border-l border-hairline bg-panel flex flex-col transition-[width] duration-200",
          previewOpen ? "w-[440px]" : "w-12"
        )}
      >
        {previewOpen ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-hairline">
              <h2 className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Preview
              </h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Collapse preview"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {resumeQuery.data ? (
                <ResumePDFPreview
                  resume={resumeQuery.data}
                  slots={attachedSlots}
                  sections={sections}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  {resumeQuery.isPending ? "Loading preview…" : "Could not load resume"}
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex-1 flex flex-col items-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Expand preview"
          >
            <ChevronLeft className="h-4 w-4" />
            <FileText className="h-4 w-4" />
            <span className="text-xs [writing-mode:vertical-rl] tracking-wide">Preview</span>
          </button>
        )}
      </aside>
    </div>

    <DragOverlay>
      {activeBlock && (
        <div
          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-lg pl-2"
          style={{
            borderLeft: isDashedEdge(activeBlock.block_type)
              ? `2px dashed ${getEdgeColor(activeBlock.block_type)}`
              : `3px solid ${getEdgeColor(activeBlock.block_type)}`,
          }}
        >
          <span className="text-sm font-medium truncate max-w-[220px]">{activeBlock.title}</span>
        </div>
      )}
    </DragOverlay>
    </DndContext>
  );
}
