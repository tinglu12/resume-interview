"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  work_experience: "bg-blue-100 text-blue-800",
  project: "bg-purple-100 text-purple-800",
  education: "bg-green-100 text-green-800",
  skills: "bg-yellow-100 text-yellow-800",
  summary: "bg-gray-100 text-gray-800",
  custom: "bg-orange-100 text-orange-800",
  personal_info: "bg-rose-100 text-rose-800",
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
}

export function BlockCard({ block, onClick, onAddToResume, isAdded }: Props) {
  const colorClass =
    BLOCK_TYPE_COLORS[block.block_type] ?? "bg-gray-100 text-gray-800";
  const label = BLOCK_TYPE_LABELS[block.block_type] ?? block.block_type;
  const excerpt = getExcerpt(block);

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-snug">
            {block.title}
          </CardTitle>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
          >
            {label}
          </span>
        </div>
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
