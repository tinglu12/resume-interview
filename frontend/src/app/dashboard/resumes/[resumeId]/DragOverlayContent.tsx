"use client";

import { getEdgeColor, isDashedEdge } from "@/features/resume-builder/lib/blockTypeEdge";
import type { BlockType } from "@/types";

function getBorderLeft(blockType: BlockType): string {
  const color = getEdgeColor(blockType);
  if (isDashedEdge(blockType)) return `2px dashed ${color}`;
  return `3px solid ${color}`;
}

interface Props {
  block: { title: string; block_type: BlockType } | null;
}

export function DragOverlayContent({ block }: Props) {
  if (!block) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-lg pl-2"
      style={{ borderLeft: getBorderLeft(block.block_type) }}
    >
      <span className="text-sm font-medium truncate max-w-[220px]">{block.title}</span>
    </div>
  );
}
