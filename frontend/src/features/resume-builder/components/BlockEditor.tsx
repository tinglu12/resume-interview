"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// ── Small field helpers ───────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-col gap-1">
        {values.map((v, i) => (
          <div key={i} className="flex gap-1">
            <Input
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="shrink-0 text-muted-foreground hover:text-destructive px-2"
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...values, ""])}
          className="mt-1 text-xs"
        >
          + Add
        </Button>
      </div>
    </Field>
  );
}

// ── Per-type form sections ────────────────────────────────────────────────────

function WorkExperienceForm({
  content,
  onChange,
}: {
  content: WorkExperienceContent;
  onChange: (c: WorkExperienceContent) => void;
}) {
  const set = (patch: Partial<WorkExperienceContent>) =>
    onChange({ ...content, ...patch });

  return (
    <>
      <Field label="Company">
        <Input value={content.company} onChange={(e) => set({ company: e.target.value })} />
      </Field>
      <Field label="Role / Title">
        <Input value={content.role} onChange={(e) => set({ role: e.target.value })} />
      </Field>
      <Field label="Location">
        <Input value={content.location} onChange={(e) => set({ location: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <Input placeholder="YYYY-MM" value={content.start_date} onChange={(e) => set({ start_date: e.target.value })} />
        </Field>
        <Field label="End date">
          <Input placeholder="YYYY-MM or blank" value={content.end_date} onChange={(e) => set({ end_date: e.target.value })} disabled={content.is_current} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={content.is_current}
          onChange={(e) => set({ is_current: e.target.checked, end_date: e.target.checked ? "" : content.end_date })}
        />
        Currently working here
      </label>
      <StringListEditor label="Bullets" values={content.bullets} onChange={(bullets) => set({ bullets })} placeholder="Describe an achievement…" />
      <StringListEditor label="Technologies" values={content.technologies} onChange={(technologies) => set({ technologies })} placeholder="e.g. Python" />
    </>
  );
}

function ProjectForm({
  content,
  onChange,
}: {
  content: ProjectContent;
  onChange: (c: ProjectContent) => void;
}) {
  const set = (patch: Partial<ProjectContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <Field label="Project name">
        <Input value={content.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <Field label="URL">
        <Input value={content.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Short description">
        <Input value={content.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <Input placeholder="YYYY-MM" value={content.start_date} onChange={(e) => set({ start_date: e.target.value })} />
        </Field>
        <Field label="End date">
          <Input placeholder="YYYY-MM" value={content.end_date} onChange={(e) => set({ end_date: e.target.value })} disabled={content.is_current} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={content.is_current} onChange={(e) => set({ is_current: e.target.checked, end_date: "" })} />
        In progress
      </label>
      <StringListEditor label="Bullets" values={content.bullets} onChange={(bullets) => set({ bullets })} />
      <StringListEditor label="Technologies" values={content.technologies} onChange={(technologies) => set({ technologies })} />
    </>
  );
}

function EducationForm({
  content,
  onChange,
}: {
  content: EducationContent;
  onChange: (c: EducationContent) => void;
}) {
  const set = (patch: Partial<EducationContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <Field label="Institution">
        <Input value={content.institution} onChange={(e) => set({ institution: e.target.value })} />
      </Field>
      <Field label="Degree">
        <Input value={content.degree} onChange={(e) => set({ degree: e.target.value })} placeholder="e.g. Bachelor of Science" />
      </Field>
      <Field label="Field of study">
        <Input value={content.field_of_study} onChange={(e) => set({ field_of_study: e.target.value })} />
      </Field>
      <Field label="Location">
        <Input value={content.location} onChange={(e) => set({ location: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <Input placeholder="YYYY-MM" value={content.start_date} onChange={(e) => set({ start_date: e.target.value })} />
        </Field>
        <Field label="End date">
          <Input placeholder="YYYY-MM" value={content.end_date} onChange={(e) => set({ end_date: e.target.value })} />
        </Field>
      </div>
      <Field label="GPA">
        <Input value={content.gpa} onChange={(e) => set({ gpa: e.target.value })} placeholder="e.g. 3.8 / 4.0" />
      </Field>
      <StringListEditor label="Honors / Awards" values={content.honors} onChange={(honors) => set({ honors })} />
    </>
  );
}

function SkillsForm({
  content,
  onChange,
}: {
  content: SkillsContent;
  onChange: (c: SkillsContent) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {content.groups.map((group, gi) => (
        <div key={gi} className="rounded-md border p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              value={group.label}
              onChange={(e) => {
                const groups = [...content.groups];
                groups[gi] = { ...group, label: e.target.value };
                onChange({ ...content, groups });
              }}
              placeholder="Category label, e.g. Languages"
              className="text-sm font-medium"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({ ...content, groups: content.groups.filter((_, j) => j !== gi) })
              }
              className="shrink-0 text-muted-foreground hover:text-destructive px-2"
            >
              ×
            </Button>
          </div>
          <StringListEditor
            label="Skills"
            values={group.items}
            onChange={(items) => {
              const groups = [...content.groups];
              groups[gi] = { ...group, items };
              onChange({ ...content, groups });
            }}
            placeholder="e.g. Python"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({ ...content, groups: [...content.groups, { label: "", items: [] }] })
        }
      >
        + Add category
      </Button>
    </div>
  );
}

function SummaryForm({
  content,
  onChange,
}: {
  content: SummaryContent;
  onChange: (c: SummaryContent) => void;
}) {
  return (
    <Field label="Summary text">
      <Textarea
        value={content.text}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
        rows={5}
        placeholder="A concise professional summary…"
      />
    </Field>
  );
}

function CustomForm({
  content,
  onChange,
}: {
  content: CustomContent;
  onChange: (c: CustomContent) => void;
}) {
  return (
    <>
      <Field label="Section heading">
        <Input value={content.heading} onChange={(e) => onChange({ ...content, heading: e.target.value })} />
      </Field>
      <Field label="Content">
        <Textarea
          value={content.body}
          onChange={(e) => onChange({ ...content, body: e.target.value })}
          rows={6}
          placeholder="Free-form text…"
        />
      </Field>
    </>
  );
}

function PersonalInfoForm({
  content,
  onChange,
}: {
  content: PersonalInfoContent;
  onChange: (c: PersonalInfoContent) => void;
}) {
  const set = (patch: Partial<PersonalInfoContent>) => onChange({ ...content, ...patch });
  return (
    <>
      <Field label="Full name">
        <Input value={content.full_name} onChange={(e) => set({ full_name: e.target.value })} placeholder="Jane Smith" />
      </Field>
      <Field label="Email">
        <Input value={content.email} onChange={(e) => set({ email: e.target.value })} placeholder="jane@example.com" type="email" />
      </Field>
      <Field label="Phone">
        <Input value={content.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="123-456-7890" />
      </Field>
      <Field label="LinkedIn username">
        <Input value={content.linkedin} onChange={(e) => set({ linkedin: e.target.value })} placeholder="jane (shown as linkedin.com/in/jane)" />
      </Field>
      <Field label="GitHub username">
        <Input value={content.github} onChange={(e) => set({ github: e.target.value })} placeholder="jane (shown as github.com/jane)" />
      </Field>
      <Field label="Website">
        <Input value={content.website} onChange={(e) => set({ website: e.target.value })} placeholder="janesmith.dev" />
      </Field>
      <Field label="Location">
        <Input value={content.location} onChange={(e) => set({ location: e.target.value })} placeholder="City, State" />
      </Field>
    </>
  );
}

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
