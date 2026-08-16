import { Textarea } from "@/components/ui/textarea";
import type { SummaryContent } from "@/types";
import { Field } from "./Field";

export function SummaryForm({
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
