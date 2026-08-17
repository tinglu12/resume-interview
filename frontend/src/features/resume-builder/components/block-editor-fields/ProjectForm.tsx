import { Input } from "@/components/ui/input";
import type { ProjectContent } from "@/types";
import { Field } from "./Field";
import { StringListEditor } from "./StringListEditor";

export function ProjectForm({
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
