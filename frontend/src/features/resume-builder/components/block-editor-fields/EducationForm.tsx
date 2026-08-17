import { Input } from "@/components/ui/input";
import type { EducationContent } from "@/types";
import { Field } from "./Field";
import { StringListEditor } from "./StringListEditor";

export function EducationForm({
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
