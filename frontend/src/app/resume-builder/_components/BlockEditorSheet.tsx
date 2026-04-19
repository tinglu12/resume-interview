import { Sheet } from "@/components/ui/sheet";
import { SheetContent } from "@/components/ui/sheet";
import { SheetHeader } from "@/components/ui/sheet";
import { SheetTitle } from "@/components/ui/sheet";
import { BlockEditor } from "@/features/resume-builder/components/BlockEditor";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { ResumeBlock } from "@/types";

export function BlockEditorSheet({
  editingBlock,
  setEditingBlock,
}: {
  editingBlock: ResumeBlock | null;
  setEditingBlock: (block: ResumeBlock | null) => void;
}) {
  const { updateBlock } = useBlocks();

  return (
    <Sheet
      open={!!editingBlock}
      onOpenChange={(o) => !o && setEditingBlock(null)}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit block</SheetTitle>
        </SheetHeader>
        {editingBlock && (
          <BlockEditor
            block={editingBlock}
            onSave={async (data) => {
              await updateBlock({ id: editingBlock.id, data });
              setEditingBlock(null);
            }}
            onCancel={() => setEditingBlock(null)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
