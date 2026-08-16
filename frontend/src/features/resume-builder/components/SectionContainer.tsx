"use client";

import { useState } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { BlockSlot } from "./BlockSlot";
import { getEdgeColor } from "@/features/resume-builder/lib/blockTypeEdge";
import type { BlockOnResume, ResumeBlock, ResumeSection } from "@/types";

interface Props {
  section: ResumeSection;
  isActive: boolean;
  onActivate: () => void;
  onDetachBlock: (blockId: string) => void;
  onDeleteSection: () => void;
  onRenameSection: (name: string) => void;
  onOpenEditor: (block: ResumeBlock) => void;
  editingBlockId: string | null;
  getUsageCount?: (blockId: string) => number;
}

const isPinned = (section: ResumeSection) => section.section_type === "personal_info";

export function SectionContainer({
  section,
  isActive,
  onActivate,
  onDetachBlock,
  onDeleteSection,
  onRenameSection,
  onOpenEditor,
  editingBlockId,
  getUsageCount,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(section.display_name);
  const pinned = isPinned(section);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id, disabled: pinned, data: { type: "section", sectionId: section.id } });

  // Independent of the sortable role above — this is what makes the section a
  // valid drop target for a library block, even when reordering is disabled
  // (personal_info): `useSortable({ disabled: true })` turns off both roles,
  // so the drop-target role needs its own droppable that isn't gated by `pinned`.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `section-drop-${section.id}`,
    data: { type: "section", sectionId: section.id },
  });

  const { active } = useDndContext();
  const activeData = active?.data.current as { type?: string; blockType?: string } | undefined;
  const isLibraryBlockDrag = activeData?.type === "library-block";
  const isMatchingDrop = isLibraryBlockDrag && activeData?.blockType === section.section_type;
  const isMismatchedDrop = isLibraryBlockDrag && activeData?.blockType !== section.section_type;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isMismatchedDrop ? 0.4 : 1,
  };

  function commitRename() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== section.display_name) {
      onRenameSection(trimmed);
    }
    setRenaming(false);
  }

  const showAddButton = !pinned || section.blocks.length === 0;
  const edgeColor = getEdgeColor(section.section_type);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={{
        ...style,
        borderLeft: pinned ? "2px dashed var(--hairline)" : `2px solid ${edgeColor}`,
      }}
      className={cn(
        "rounded-xl border bg-card shadow-sm mb-3 transition-colors",
        pinned && "bg-panel/60",
        isOver && isMatchingDrop && "border-primary bg-primary/5"
      )}
    >
      {/* Section header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          isActive ? "bg-primary/5" : ""
        }`}
      >
        {/* Drag handle (only for non-pinned sections) */}
        {!pinned && (
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
            aria-label="Drag to reorder section"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Section name */}
        {renaming ? (
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setNameValue(section.display_name); setRenaming(false); }
            }}
            className="h-6 text-sm font-semibold flex-1"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm font-semibold truncate">{section.display_name}</span>
        )}

        {/* Rename (only for non-pinned sections) */}
        {!pinned && !renaming && (
          <button
            onClick={() => { setNameValue(section.display_name); setRenaming(true); }}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Rename section"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Delete (only for non-pinned sections) */}
        {!pinned && (
          <button
            onClick={onDeleteSection}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Blocks */}
      <div className="p-2 flex flex-col gap-2">
        {section.blocks.length > 0 && (
          <SortableContext
            items={section.blocks.map((b) => b.block.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.blocks.map((slot: BlockOnResume) => (
              <BlockSlot
                key={slot.block.id}
                slot={slot}
                sectionId={section.id}
                isEditing={editingBlockId === slot.block.id}
                onOpenEditor={() => onOpenEditor(slot.block)}
                onDetach={() => onDetachBlock(slot.block.id)}
                usageCount={getUsageCount ? getUsageCount(slot.block.id) : 1}
              />
            ))}
          </SortableContext>
        )}

        {showAddButton && (
          <button
            onClick={onActivate}
            className={
              isActive
                ? "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-primary text-primary-foreground w-fit"
                : "flex items-center gap-1 text-xs font-semibold text-accent-teal hover:underline w-fit px-3 py-1"
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {isActive ? "Select from library →" : "Add block"}
          </button>
        )}
      </div>
    </div>
  );
}
