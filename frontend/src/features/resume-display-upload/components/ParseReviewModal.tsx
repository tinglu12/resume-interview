"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BlockEditor } from "@/features/resume-builder/components/BlockEditor";
import { getEdgeColor, isDashedEdge } from "@/features/resume-builder/lib/blockTypeEdge";
import type { BlockType, ParsedBlockPreview } from "@/types";

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  work_experience: "Work Experience",
  project: "Projects",
  education: "Education",
  skills: "Skills",
  summary: "Summary",
  custom: "Custom",
  personal_info: "Personal Info",
};

const TYPE_ORDER: BlockType[] = [
  "work_experience",
  "project",
  "education",
  "skills",
  "summary",
  "personal_info",
  "custom",
];

function excerptFor(block: ParsedBlockPreview): string {
  const c = block.content as unknown as Record<string, unknown>;
  if (Array.isArray(c.bullets) && c.bullets[0]) return String(c.bullets[0]);
  if (typeof c.description === "string" && c.description) return c.description;
  if (typeof c.text === "string" && c.text) return c.text;
  if (typeof c.body === "string" && c.body) return c.body;
  return "";
}

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
  const [kept, setKept] = useState<Set<number>>(() => new Set(initialBlocks.map((_, i) => i)));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<BlockType | null>(null);

  // Sync when a fresh parse comes in.
  if (blocks !== initialBlocks && initialBlocks.length > 0 && blocks.length === 0) {
    setBlocks(initialBlocks);
    setKept(new Set(initialBlocks.map((_, i) => i)));
  }

  function startOver() {
    setBlocks(initialBlocks);
    setKept(new Set(initialBlocks.map((_, i) => i)));
    setEditingIndex(null);
    setActiveType(null);
  }

  function toggleKept(i: number) {
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function updateBlock(i: number, data: { title: string; content: Record<string, unknown> }) {
    setBlocks((prev) =>
      prev.map((b, j) =>
        j === i ? { ...b, title: data.title, content: data.content as unknown as ParsedBlockPreview["content"] } : b
      )
    );
    setEditingIndex(null);
  }

  const counts = new Map<BlockType, number>();
  for (const b of blocks) counts.set(b.block_type, (counts.get(b.block_type) ?? 0) + 1);

  const visibleIndices = blocks
    .map((b, i) => i)
    .filter((i) => !activeType || blocks[i].block_type === activeType);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-hairline">
          <DialogTitle className="text-lg font-bold">Review parsed blocks</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1">
            {blocks.length} blocks found — edit anything, drop what you don&apos;t want.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Label htmlFor="display-name" className="text-xs shrink-0">
              Resume name
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Backend SWE Resume"
              className="max-w-xs"
            />
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left: type counts */}
          <div className="w-48 shrink-0 border-r border-hairline p-4 flex flex-col gap-1 overflow-y-auto">
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-2">
              Found
            </div>
            <button
              onClick={() => setActiveType(null)}
              className={`flex justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium ${
                !activeType ? "bg-panel text-foreground" : "text-foreground hover:bg-panel/60"
              }`}
            >
              All <span className="text-muted-foreground font-normal">{blocks.length}</span>
            </button>
            {TYPE_ORDER.filter((t) => counts.get(t)).map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`flex justify-between px-2.5 py-1.5 rounded-md text-[13px] ${
                  activeType === t ? "bg-panel text-foreground font-medium" : "text-foreground hover:bg-panel/60"
                }`}
              >
                {BLOCK_TYPE_LABELS[t]}{" "}
                <span className="text-muted-foreground font-normal">{counts.get(t)}</span>
              </button>
            ))}
          </div>

          {/* Main: parsed block rows */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2.5">
            {visibleIndices.map((i) => {
              const block = blocks[i];
              const isKept = kept.has(i);
              const dashed = isDashedEdge(block.block_type);
              const color = getEdgeColor(block.block_type);
              return (
                <div
                  key={i}
                  className="rounded-lg border border-hairline"
                  style={{
                    borderLeft: dashed ? `2px dashed ${color}` : `3px solid ${color}`,
                    opacity: isKept ? 1 : 0.45,
                  }}
                >
                  {editingIndex === i ? (
                    <div className="p-3">
                      <BlockEditor
                        block={block}
                        onSave={async (data) => updateBlock(i, data)}
                        onCancel={() => setEditingIndex(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 px-3.5 py-3">
                      <Checkbox
                        checked={isKept}
                        onCheckedChange={() => toggleKept(i)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0" onClick={() => setEditingIndex(i)}>
                        <div className="font-mono text-[9.5px] tracking-[0.06em] uppercase text-accent-teal mb-1">
                          {BLOCK_TYPE_LABELS[block.block_type] ?? block.block_type}
                        </div>
                        <p className="text-sm font-semibold truncate cursor-pointer">{block.title}</p>
                        {excerptFor(block) && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {excerptFor(block)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleKept(i)}
                        className="shrink-0 text-muted-foreground hover:text-destructive text-xs"
                        aria-label={isKept ? "Remove" : "Keep"}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {blocks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No blocks parsed.</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-hairline flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {kept.size} of {blocks.length} kept
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={startOver} disabled={isSaving}>
              Start over
            </Button>
            <Button
              onClick={() => onSave(displayName, blocks.filter((_, i) => kept.has(i)))}
              disabled={isSaving || kept.size === 0 || !displayName.trim()}
            >
              {isSaving ? "Saving…" : "Save to library →"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
