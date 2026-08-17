import { Input } from "@/components/ui/input";
import type { PersonalInfoContent } from "@/types";
import { Field } from "./Field";

export function PersonalInfoForm({
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
