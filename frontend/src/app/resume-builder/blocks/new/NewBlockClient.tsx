"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BlockEditor } from "@/features/resume-builder/components/BlockEditor";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import type { BlockType } from "@/types";

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: "personal_info", label: "Personal Info" },
  { value: "work_experience", label: "Work Experience" },
  { value: "project", label: "Project" },
  { value: "education", label: "Education" },
  { value: "skills", label: "Skills" },
  { value: "summary", label: "Summary" },
  { value: "custom", label: "Custom" },
];

export function NewBlockClient() {
  const router = useRouter();
  const { createBlock, isCreating } = useBlocks();
  const [blockType, setBlockType] = useState<BlockType>("work_experience");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold mb-1">Create a new block</h1>
        <p className="text-sm text-muted-foreground">
          Blocks are reusable pieces of your resume. Edit one block and all resumes using it update automatically.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="block-type">Block type</Label>
        <select
          id="block-type"
          value={blockType}
          onChange={(e) => setBlockType(e.target.value as BlockType)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Key forces re-mount of BlockEditor when type changes, resetting form state */}
      <BlockEditor
        key={blockType}
        block={null}
        blockType={blockType}
        onSave={async ({ title, content }) => {
          setError(null);
          try {
            await createBlock({ block_type: blockType, title, content });
            router.push("/resume-builder");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create block");
          }
        }}
        onCancel={() => router.push("/resume-builder")}
        isSaving={isCreating}
      />
    </div>
  );
}
