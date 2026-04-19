"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  onEdit: () => void;
  onDetach: () => void;
}

export function BlockSlot({ slot, onEdit, onDetach }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = BLOCK_TYPE_LABELS[slot.block.block_type] ?? slot.block.block_type;
  const subtitle = getSubtitle(slot);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3 shadow-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {slot.title_override ?? slot.block.title}
          </span>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {label}
          </Badge>
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
  );
}
