"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BlockEditorModalBody } from "./BlockEditorModalBody";
import type { ResumeBlock } from "@/types";

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
