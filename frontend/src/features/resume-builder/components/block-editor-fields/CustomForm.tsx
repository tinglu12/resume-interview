import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CustomContent } from "@/types";
import { Field } from "./Field";

export function CustomForm({
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
