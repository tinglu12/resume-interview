"use client";

import { useState } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { ResumeBlock, ResumeSection } from "@/types";

type DragData =
  | { type: "library-block"; blockId: string; blockType: string }
  | { type: "section"; sectionId: string }
  | { type: "section-block"; sectionId: string; blockId: string };

interface Options {
  sections: ResumeSection[];
  blocks: ResumeBlock[];
  onSectionDragEnd: (activeId: string, overId: string) => void;
  onBlockDragEnd: (sectionId: string, activeId: string, overId: string) => void;
  attachBlock: (params: { sectionId: string; blockId: string; position: number }) => void | Promise<unknown>;
}

export function useCanvasDnd({ sections, blocks, onSectionDragEnd, onBlockDragEnd, attachBlock }: Options) {
  const [activeBlock, setActiveBlock] = useState<ResumeBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (data?.type === "library-block") {
      setActiveBlock(blocks.find((b) => b.id === data.blockId) ?? null);
    }
  }

  function handleDragCancel() {
    setActiveBlock(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBlock(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DragData | undefined;
    if (!activeData) return;

    if (activeData.type === "section") {
      if (active.id !== over.id) onSectionDragEnd(String(active.id), String(over.id));
      return;
    }

    if (activeData.type === "section-block") {
      // Cross-section block drags are out of scope — reordering only applies
      // within the section the drag started in.
      const overSectionId =
        overData?.type === "section-block" || overData?.type === "section"
          ? overData.sectionId
          : undefined;
      if (overSectionId !== activeData.sectionId) return;
      if (active.id !== over.id) {
        onBlockDragEnd(activeData.sectionId, String(active.id), String(over.id));
      }
      return;
    }

    if (activeData.type === "library-block") {
      const targetSectionId =
        overData?.type === "section" || overData?.type === "section-block"
          ? overData.sectionId
          : undefined;
      if (!targetSectionId) return;

      const targetSection = sections.find((s) => s.id === targetSectionId);
      if (!targetSection) return;
      if (targetSection.section_type !== activeData.blockType) return; // mismatched type — no-op

      attachBlock({
        sectionId: targetSectionId,
        blockId: activeData.blockId,
        position: targetSection.blocks.length,
      });
    }
  }

  return {
    sensors,
    collisionDetection: closestCenter,
    activeBlock,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
