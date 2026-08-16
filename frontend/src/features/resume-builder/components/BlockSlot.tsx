"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getEdgeColor, getEdgeStripeBackground, isDashedEdge } from "@/features/resume-builder/lib/blockTypeEdge";
import type { BlockOnResume, BlockType, WorkExperienceContent } from "@/types";

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  work_experience: "Work",
  project: "Project",
  education: "Education",
  skills: "Skills",
  summary: "Summary",
  custom: "Custom",
  personal_info: "Personal Info",
};

function getSubtitle(slot: BlockOnResume): string {
  switch (slot.block.block_type) {
    case "work_experience": {
      const wc = slot.block.content as WorkExperienceContent;
      const dates = [wc.start_date, wc.is_current ? "Present" : wc.end_date]
        .filter(Boolean)
        .join(" – ");
      return dates ? `${wc.company} · ${dates}` : wc.company;
    }
    case "project":
      return String((slot.block.content as import("@/types").ProjectContent).description ?? "");
    case "education":
      return String((slot.block.content as import("@/types").EducationContent).institution ?? "");
    case "skills": {
      const sc = slot.block.content as import("@/types").SkillsContent;
      return `${sc.groups.length} group(s)`;
    }
    case "summary": {
      const text = String((slot.block.content as import("@/types").SummaryContent).text ?? "");
      return text.slice(0, 60) + (text.length > 60 ? "…" : "");
    }
    case "custom":
      return String((slot.block.content as import("@/types").CustomContent).heading ?? "");
    default:
      return "";
  }
}

interface Props {
  slot: BlockOnResume;
  sectionId: string;
  isEditing?: boolean;
  onOpenEditor: () => void;
  onDetach: () => void;
  /** How many resumes this block is used on. Defaults to 1 (no stripe) until real usage data is passed in. */
  usageCount?: number;
}

export function BlockSlot({
  slot,
  sectionId,
  isEditing,
  onOpenEditor,
  onDetach,
  usageCount = 1,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.block.id,
    data: { type: "section-block", sectionId, blockId: slot.block.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = BLOCK_TYPE_LABELS[slot.block.block_type] ?? slot.block.block_type;
  const subtitle = getSubtitle(slot);
  const dashed = isDashedEdge(slot.block.block_type);
  const edgeColor = getEdgeColor(slot.block.block_type);
  const edgeStripe = getEdgeStripeBackground(slot.block.block_type, usageCount);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card shadow-sm transition-colors ${
        isEditing ? "ring-2 ring-accent-teal" : ""
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        {/* Block-type edge — colour-coded, striped for reuse count */}
        <div
          className="w-2 self-stretch shrink-0 rounded-full"
          aria-hidden="true"
          style={{
            background: dashed ? "transparent" : edgeStripe,
            borderLeft: dashed ? `2px dashed ${edgeColor}` : undefined,
          }}
        />

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content — click to open the block editor modal */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenEditor}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {slot.title_override ?? slot.block.title}
            </span>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {label}
            </Badge>
            {usageCount > 1 && (
              <span className="shrink-0 font-mono text-[9px] tracking-[0.05em] uppercase text-accent-teal">
                Used in {usageCount}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Detach */}
        <button
          onClick={onDetach}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Remove from resume"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
