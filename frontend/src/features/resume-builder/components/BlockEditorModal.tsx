"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BlockEditor } from "./BlockEditor";
import { AiGeneratePanel } from "./AiGeneratePanel";
import type { ResumeBlock } from "@/types";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  work_experience: "Work Experience",
  project: "Project",
  education: "Education",
  skills: "Skills",
  summary: "Summary",
  custom: "Custom",
  personal_info: "Personal Info",
};

interface BodyProps {
  block: ResumeBlock;
  usageCount: number;
  usageResumeNames: string[];
  onClose: () => void;
  onSave: (id: string, data: { title: string; content: Record<string, unknown> }) => Promise<void>;
  isSaving?: boolean;
}

// Keyed by block.id from the parent so `mode` naturally resets to "edit"
// whenever a different block opens — no effect needed to sync it.
function BlockEditorModalBody({
  block,
  usageCount,
  usageResumeNames,
  onClose,
  onSave,
  isSaving,
}: BodyProps) {
  const [mode, setMode] = useState<"edit" | "ai">("edit");

  const canGenerate = block.block_type === "work_experience" || block.block_type === "summary";

  return (
    <>
      <div className="pl-6 pr-12 pt-6 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[9.5px] tracking-[0.06em] uppercase text-accent-teal mb-1.5">
              {BLOCK_TYPE_LABELS[block.block_type] ?? block.block_type}
              {usageCount > 1 ? ` · Used in ${usageCount} resumes` : ""}
            </div>
            <DialogTitle className="text-lg font-bold leading-tight">{block.title}</DialogTitle>
          </div>
          {canGenerate && mode === "edit" && (
            <Button
              size="sm"
              className="bg-accent-teal text-white hover:bg-accent-teal/90 shrink-0"
              onClick={() => setMode("ai")}
            >
              Improve with AI
            </Button>
          )}
        </div>
      </div>

      {usageCount > 1 && mode === "edit" && (
        <div className="mx-6 mt-4 bg-proof-bg border-l-[3px] border-proof-accent rounded-md p-3.5 flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[9.5px] tracking-[0.06em] uppercase text-proof-fg mb-0.5">
              Edits apply everywhere
            </div>
            <div className="text-xs text-proof-fg">
              This block is on {usageCount} resumes. Saving changes all of them
              {usageResumeNames.length ? `: ${usageResumeNames.join(", ")}.` : "."}
            </div>
          </div>
          <button
            type="button"
            title="Not yet implemented — forking a block for a single resume requires backend support (PRD ticket SYNC-7)"
            onClick={() => {
              // TODO(SYNC-7): clone this block for this resume only, then
              // detach the shared block and attach the clone in its place.
              // No backend endpoint exists for this yet.
            }}
            className="shrink-0 text-xs font-semibold text-proof-fg bg-card border border-proof-accent rounded-md px-3 py-1.5 whitespace-nowrap hover:bg-proof-bg/60"
          >
            Edit only on this resume
          </button>
        </div>
      )}

      {mode === "edit" ? (
        <div className="p-6">
          <BlockEditor
            block={block}
            onSave={async (data) => {
              await onSave(block.id, data);
              onClose();
            }}
            onCancel={onClose}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <AiGeneratePanel
          block={block}
          onAccept={async (contentPatch) => {
            const content = block.content as unknown as Record<string, unknown>;
            await onSave(block.id, {
              title: block.title,
              content: { ...content, ...contentPatch },
            });
            onClose();
          }}
          onCancel={() => setMode("edit")}
        />
      )}
    </>
  );
}

interface Props {
  block: ResumeBlock | null;
  usageCount?: number;
  usageResumeNames?: string[];
  onClose: () => void;
  onSave: (id: string, data: { title: string; content: Record<string, unknown> }) => Promise<void>;
  isSaving?: boolean;
}

export function BlockEditorModal({
  block,
  usageCount = 1,
  usageResumeNames = [],
  onClose,
  onSave,
  isSaving,
}: Props) {
  return (
    <Dialog open={!!block} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-3xl sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        {block && (
          <BlockEditorModalBody
            key={block.id}
            block={block}
            usageCount={usageCount}
            usageResumeNames={usageResumeNames}
            onClose={onClose}
            onSave={onSave}
            isSaving={isSaving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
