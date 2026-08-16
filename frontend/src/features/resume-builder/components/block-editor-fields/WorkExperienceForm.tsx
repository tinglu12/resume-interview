import { Input } from "@/components/ui/input";
import type { WorkExperienceContent } from "@/types";
import { Field } from "./Field";
import { StringListEditor } from "./StringListEditor";

export function WorkExperienceForm({
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
