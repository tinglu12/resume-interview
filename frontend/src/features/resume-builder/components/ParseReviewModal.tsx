"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BlockEditor } from "./BlockEditor";
import type { BlockType, ParsedBlockPreview } from "@/types";

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  work_experience: "Work",
  project: "Project",
  education: "Education",
  skills: "Skills",
  summary: "Summary",
  custom: "Custom",
  personal_info: "Personal Info",
};

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  work_experience: "bg-blue-100 text-blue-800",
  project: "bg-purple-100 text-purple-800",
  education: "bg-green-100 text-green-800",
  skills: "bg-yellow-100 text-yellow-800",
  summary: "bg-gray-100 text-gray-800",
  custom: "bg-orange-100 text-orange-800",
  personal_info: "bg-rose-100 text-rose-800",
};

interface Props {
  open: boolean;
  blocks: ParsedBlockPreview[];
  onSave: (displayName: string, blocks: ParsedBlockPreview[]) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function ParseReviewModal({ open, blocks: initialBlocks, onSave, onCancel, isSaving }: Props) {
  const [displayName, setDisplayName] = useState("My Resume");
  const [blocks, setBlocks] = useState<ParsedBlockPreview[]>(initialBlocks);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Sync when new blocks come in (new parse)
  if (blocks !== initialBlocks && initialBlocks.length > 0 && blocks.length === 0) {
    setBlocks(initialBlocks);
  }

  function removeBlock(i: number) {
    setBlocks((prev) => prev.filter((_, j) => j !== i));
  }

  function updateBlock(i: number, data: { title: string; content: Record<string, unknown> }) {
    setBlocks((prev) =>
      prev.map((b, j) =>
        j === i ? { ...b, title: data.title, content: data.content as unknown as ParsedBlockPreview["content"] } : b
      )
    );
    setEditingIndex(null);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review parsed blocks</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Review and edit the blocks parsed from your resume. Remove any you don&apos;t need.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-3 my-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="display-name">Resume name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Backend SWE Resume"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {blocks.map((block, i) => (
            <div key={i} className="rounded-lg border p-3">
              {editingIndex === i ? (
                <BlockEditor
                  block={block}
                  onSave={async (data) => updateBlock(i, data)}
                  onCancel={() => setEditingIndex(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          BLOCK_TYPE_COLORS[block.block_type] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {BLOCK_TYPE_LABELS[block.block_type] ?? block.block_type}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{block.title}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIndex(i)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlock(i)}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {blocks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All blocks removed.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(displayName, blocks)}
            disabled={isSaving || blocks.length === 0 || !displayName.trim()}
          >
            {isSaving ? "Saving…" : `Save ${blocks.length} block${blocks.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
