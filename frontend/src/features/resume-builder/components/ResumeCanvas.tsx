"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BlockSlot } from "./BlockSlot";
import { BlockEditor } from "./BlockEditor";
import { useBlockReorder } from "../hooks/useBlockReorder";
import type { BlockOnResume, ResumeBlock } from "@/types";

interface Props {
  resumeId: string;
  slots: BlockOnResume[];
  loading: boolean;
  error: string | null;
  onDetach: (blockId: string) => void;
  onBlockSaved: (id: string, data: { title: string; content: Record<string, unknown> }) => Promise<void>;
  isSaving?: boolean;
}

export function ResumeCanvas({
  resumeId,
  slots,
  loading,
  error,
  onDetach,
  onBlockSaved,
  isSaving,
}: Props) {
  const { onDragEnd } = useBlockReorder(resumeId);
  const [editingBlock, setEditingBlock] = useState<ResumeBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onDragEnd(String(active.id), String(over.id));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {slots.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No blocks yet. Add blocks from the library on the left.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slots.map((s) => s.block.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {slots.map((slot) => (
                <BlockSlot
                  key={slot.block.id}
                  slot={slot}
                  onEdit={() => setEditingBlock(slot.block)}
                  onDetach={() => onDetach(slot.block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Block editor slide-over — modal=false so Radix doesn't block pointer events, which breaks @dnd-kit */}
      <Sheet modal={false} open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit block</SheetTitle>
          </SheetHeader>
          {editingBlock && (
            <BlockEditor
              block={editingBlock}
              onSave={async (data) => {
                await onBlockSaved(editingBlock.id, data);
                setEditingBlock(null);
              }}
              onCancel={() => setEditingBlock(null)}
              isSaving={isSaving}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
