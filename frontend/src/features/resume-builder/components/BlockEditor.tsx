"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  BlockContent,
  BlockType,
  CustomContent,
  EducationContent,
  ParsedBlockPreview,
  PersonalInfoContent,
  ProjectContent,
  ResumeBlock,
  SkillsContent,
  SummaryContent,
  WorkExperienceContent,
} from "@/types";
import { Field } from "./block-editor-fields/Field";
import { WorkExperienceForm } from "./block-editor-fields/WorkExperienceForm";
import { ProjectForm } from "./block-editor-fields/ProjectForm";
import { EducationForm } from "./block-editor-fields/EducationForm";
import { SkillsForm } from "./block-editor-fields/SkillsForm";
import { SummaryForm } from "./block-editor-fields/SummaryForm";
import { CustomForm } from "./block-editor-fields/CustomForm";
import { PersonalInfoForm } from "./block-editor-fields/PersonalInfoForm";

// ── Default content factories ─────────────────────────────────────────────────

function defaultContent(blockType: BlockType): Record<string, unknown> {
  switch (blockType) {
    case "work_experience":
      return { company: "", role: "", location: "", start_date: "", end_date: "", is_current: false, bullets: [], technologies: [], notes: "" };
    case "project":
      return { name: "", url: "", start_date: "", end_date: "", is_current: false, description: "", bullets: [], technologies: [], notes: "" };
    case "education":
      return { institution: "", degree: "", field_of_study: "", location: "", start_date: "", end_date: "", gpa: "", relevant_courses: [], honors: [], notes: "" };
    case "skills":
      return { groups: [], notes: "" };
    case "summary":
      return { text: "", notes: "" };
    case "custom":
      return { heading: "", body: "", notes: "" };
    case "personal_info":
      return { full_name: "", email: "", phone: "", linkedin: "", github: "", website: "", location: "", notes: "" };
  }
}

// ── Main BlockEditor ──────────────────────────────────────────────────────────

interface Props {
  /** Existing block to edit. If null, creates a new block. */
  block: ResumeBlock | ParsedBlockPreview | null;
  blockType?: BlockType;
  onSave: (data: { title: string; content: Record<string, unknown> }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function BlockEditor({ block, blockType, onSave, onCancel, isSaving }: Props) {
  const resolvedType = (block?.block_type ?? blockType ?? "custom") as BlockType;
  const [title, setTitle] = useState(block?.title ?? "");
  const [content, setContent] = useState<BlockContent>(
    (block?.content as BlockContent) ?? (defaultContent(resolvedType) as unknown as BlockContent)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({ title, content: content as unknown as Record<string, unknown> });
  }

  function renderContentForm() {
    switch (resolvedType) {
      case "work_experience":
        return (
          <WorkExperienceForm
            content={content as unknown as WorkExperienceContent}
            onChange={(c) => setContent(c)}
          />
        );
      case "project":
        return (
          <ProjectForm
            content={content as unknown as ProjectContent}
            onChange={(c) => setContent(c)}
          />
        );
      case "education":
        return (
          <EducationForm
            content={content as unknown as EducationContent}
            onChange={(c) => setContent(c)}
          />
        );
      case "skills":
        return (
          <SkillsForm
            content={content as unknown as SkillsContent}
            onChange={(c) => setContent(c)}
          />
        );
      case "summary":
        return (
          <SummaryForm
            content={content as unknown as SummaryContent}
            onChange={(c) => setContent(c)}
          />
        );
      case "custom":
        return (
          <CustomForm
            content={content as unknown as CustomContent}
            onChange={(c) => setContent(c)}
          />
        );
      case "personal_info":
        return (
          <PersonalInfoForm
            content={content as unknown as PersonalInfoContent}
            onChange={(c) => setContent(c)}
          />
        );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <Field label="Block label">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Engineer @ Acme Corp"
          required
        />
      </Field>

      {renderContentForm()}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
