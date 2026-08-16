"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEdgeColor, getEdgeStripeBackground, isDashedEdge } from "@/features/resume-builder/lib/blockTypeEdge";
import type {
  BlockType,
  PersonalInfoContent,
  ResumeBlock,
  WorkExperienceContent,
  ProjectContent,
  EducationContent,
} from "@/types";
import { SkillsContent } from "@/types";
import { SummaryContent } from "@/types";
import { CustomContent } from "@/types";

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  work_experience: "Work",
  project: "Project",
  education: "Education",
  skills: "Skills",
  summary: "Summary",
  custom: "Custom",
  personal_info: "Personal Info",
};

function getExcerpt(block: ResumeBlock): string {
  switch (block.block_type) {
    case "work_experience": {
      const wc = block.content as WorkExperienceContent;
      return `${wc.role} · ${wc.company}${wc.start_date ? ` (${wc.start_date})` : ""}`;
    }
    case "project": {
      const pc = block.content as ProjectContent;
      return pc.description || pc.bullets[0] || "";
    }
    case "education": {
      const ec = block.content as EducationContent;
      return `${ec.degree}${ec.field_of_study ? ` in ${ec.field_of_study}` : ""} · ${ec.institution}`;
    }
    case "skills": {
      const sc = block.content as SkillsContent;
      return sc.groups.map((g) => g.label).join(", ");
    }
    case "summary":
      return String((block.content as SummaryContent).text ?? "").slice(0, 100);
    case "custom":
      return String((block.content as CustomContent).heading ?? "");
    case "personal_info": {
      const pi = block.content as PersonalInfoContent;
      return [pi.email, pi.phone].filter(Boolean).join(" · ");
    }
    default:
      return "";
  }
}

interface Props {
  block: ResumeBlock;
  onClick?: () => void;
  onAddToResume?: () => void;
  isAdded?: boolean;
  /** How many resumes this block is used on. Defaults to 1 (no stripe) until real usage data is passed in. */
  usageCount?: number;
  /** Opens the block editor modal. When provided, clicking the card opens the editor instead of firing `onClick`. */
  onOpenEditor?: () => void;
  isEditing?: boolean;
}

export function BlockCard({
  block,
  onClick,
  onAddToResume,
  isAdded,
  usageCount = 1,
  onOpenEditor,
  isEditing,
}: Props) {
  const label = BLOCK_TYPE_LABELS[block.block_type] ?? block.block_type;
  const excerpt = getExcerpt(block);
  const dashed = isDashedEdge(block.block_type);
  const edgeColor = getEdgeColor(block.block_type);
  const edgeStripe = getEdgeStripeBackground(block.block_type, usageCount);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { type: "library-block", blockId: block.id, blockType: block.block_type },
  });

  function handleClick() {
    if (onOpenEditor) {
      onOpenEditor();
    } else {
      onClick?.();
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className={`relative overflow-hidden cursor-pointer transition-shadow hover:shadow-md pl-1.5 ${
        isEditing ? "ring-2 ring-accent-teal" : ""
      }`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <div
        className="absolute inset-y-0 left-0 w-2"
        style={{
          background: dashed ? "transparent" : edgeStripe,
          borderLeft: dashed ? `2px dashed ${edgeColor}` : undefined,
        }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-snug">
            {block.title}
          </CardTitle>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        {usageCount > 1 && (
          <div className="font-mono text-[9px] tracking-[0.05em] uppercase text-accent-teal">
            Used in {usageCount} resumes
          </div>
        )}
      </CardHeader>
      {(excerpt || onAddToResume) && (
        <CardContent className="pt-0">
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {excerpt}
            </p>
          )}
          {onAddToResume && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToResume();
              }}
              disabled={isAdded}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isAdded ? "Added" : "+ Add to resume"}
            </button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
