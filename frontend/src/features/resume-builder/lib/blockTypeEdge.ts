import type { BlockType } from "@/types";

// CSS custom property name per block type — resolves differently under `.dark`
// via the cascade (see src/app/globals.css), so no separate dark-mode branching
// is needed here. `custom` has no hue by design — it renders dashed and neutral.
const BLOCK_TYPE_EDGE_VAR: Partial<Record<BlockType, string>> = {
  work_experience: "--edge-work_experience",
  project: "--edge-project",
  education: "--edge-education",
  skills: "--edge-skills",
  summary: "--edge-summary",
  personal_info: "--edge-personal_info",
};

export function isDashedEdge(blockType: BlockType): boolean {
  return blockType === "custom";
}

export function getEdgeColor(blockType: BlockType): string {
  const varName = BLOCK_TYPE_EDGE_VAR[blockType];
  return varName ? `var(${varName})` : "var(--hairline)";
}

// Reuse-depth motif: a block used on N resumes gets N solid parallel stripes
// on its left edge, separated by gaps in the surrounding surface color.
// Capped at 3 — "three means three or more".
export function getEdgeStripeBackground(blockType: BlockType, usageCount: number): string {
  const color = getEdgeColor(blockType);
  const gap = "var(--background)";
  const count = Math.max(1, Math.min(3, usageCount || 1));

  if (count === 1) {
    return `linear-gradient(to right, ${color} 0 3px, transparent 3px 100%)`;
  }
  if (count === 2) {
    return `linear-gradient(to right, ${color} 0 3px, ${gap} 3px 5px, ${color} 5px 8px, transparent 8px 100%)`;
  }
  return `linear-gradient(to right, ${color} 0 3px, ${gap} 3px 5px, ${color} 5px 8px, ${gap} 8px 11px, ${color} 11px 14px, transparent 14px 100%)`;
}
