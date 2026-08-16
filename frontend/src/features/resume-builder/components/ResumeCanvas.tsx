"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SectionContainer } from "./SectionContainer";
import { AddSectionModal } from "./AddSectionModal";
import { BlockEditorModal } from "./BlockEditorModal";
import type { BlockType, ResumeBlock, ResumeSection } from "@/types";

interface Props {
  resumeId: string;
  sections: ResumeSection[];
  loading: boolean;
  error: string | null;
  activeSectionId: string | null;
  onActivateSection: (id: string | null) => void;
  onDetachBlock: (sectionId: string, blockId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onRenameSection: (sectionId: string, name: string) => void;
  onAddSection: (sectionType: BlockType, displayName: string) => void;
  onBlockSaved: (id: string, data: { title: string; content: Record<string, unknown> }) => Promise<void>;
  isSaving?: boolean;
  getUsageCount?: (blockId: string) => number;
  getUsageResumeNames?: (blockId: string) => string[];
}

export function ResumeCanvas({
  sections,
  loading,
  error,
  activeSectionId,
  onActivateSection,
  onDetachBlock,
  onDeleteSection,
  onRenameSection,
  onAddSection,
  onBlockSaved,
  isSaving,
  getUsageCount,
  getUsageResumeNames,
}: Props) {
  const [editingBlock, setEditingBlock] = useState<ResumeBlock | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);

  const personalInfoSection = sections.find((s) => s.section_type === "personal_info");
  const otherSections = sections.filter((s) => s.section_type !== "personal_info");

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Pinned personal info section — always first, not draggable */}
      {personalInfoSection && (
        <SectionContainer
          section={personalInfoSection}
          isActive={activeSectionId === personalInfoSection.id}
          onActivate={() =>
            onActivateSection(
              activeSectionId === personalInfoSection.id ? null : personalInfoSection.id
            )
          }
          onDetachBlock={(blockId) => onDetachBlock(personalInfoSection.id, blockId)}
          onDeleteSection={() => {}}
          onRenameSection={(name) => onRenameSection(personalInfoSection.id, name)}
          onOpenEditor={setEditingBlock}
          editingBlockId={editingBlock?.id ?? null}
          getUsageCount={getUsageCount}
        />
      )}

      {/* Draggable sections */}
      {otherSections.length > 0 ? (
        <SortableContext
          items={otherSections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {otherSections.map((section) => (
            <SectionContainer
              key={section.id}
              section={section}
              isActive={activeSectionId === section.id}
              onActivate={() =>
                onActivateSection(activeSectionId === section.id ? null : section.id)
              }
              onDetachBlock={(blockId) => onDetachBlock(section.id, blockId)}
              onDeleteSection={() => onDeleteSection(section.id)}
              onRenameSection={(name) => onRenameSection(section.id, name)}
              onOpenEditor={setEditingBlock}
              editingBlockId={editingBlock?.id ?? null}
              getUsageCount={getUsageCount}
            />
          ))}
        </SortableContext>
      ) : (
        !personalInfoSection && (
          <div className="rounded-xl border-2 border-dashed border-border py-12 text-center mb-3">
            <p className="text-muted-foreground text-sm">
              No sections yet. Add a section to get started.
            </p>
          </div>
        )
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setAddSectionOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>

      <AddSectionModal
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        onConfirm={onAddSection}
      />

      <BlockEditorModal
        block={editingBlock}
        usageCount={editingBlock ? (getUsageCount?.(editingBlock.id) ?? 1) : 1}
        usageResumeNames={editingBlock ? (getUsageResumeNames?.(editingBlock.id) ?? []) : []}
        onClose={() => setEditingBlock(null)}
        onSave={onBlockSaved}
        isSaving={isSaving}
      />
    </>
  );
}
