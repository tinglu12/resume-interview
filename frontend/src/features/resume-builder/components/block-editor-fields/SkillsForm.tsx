import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SkillsContent } from "@/types";
import { StringListEditor } from "./StringListEditor";

export function SkillsForm({
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
