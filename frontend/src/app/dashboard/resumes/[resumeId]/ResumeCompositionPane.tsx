"use client";

import type { ReactNode } from "react";

/**
 * Bottom half of the editor column: the assembled resume itself.
 * Pure layout shell — the canvas is passed as children so its many
 * props stay owned by ResumeCanvasClient instead of being re-drilled.
 */
export function ResumeCompositionPane({ children }: { children: ReactNode }) {
  return (
    <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-4 pb-2">
        <h2 className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Resume
        </h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        <div className="max-w-2xl mx-auto">{children}</div>
      </div>
    </section>
  );
}
