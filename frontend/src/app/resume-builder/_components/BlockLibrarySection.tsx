import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BlockLibraryPanel } from "@/features/resume-builder/components/BlockLibraryPanel";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { ResumeBlock } from "@/types";

interface Props {
  onBlockClick: (block: ResumeBlock) => void;
}

export function BlockLibrarySection({ onBlockClick }: Props) {
  const { blocks, loading: blocksLoading, error: blocksError } = useBlocks();
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Block library</h2>
        <Button size="sm" asChild>
          <Link href="/resume-builder/blocks/new">+ New block</Link>
        </Button>
      </div>
      <BlockLibraryPanel
        blocks={blocks}
        loading={blocksLoading}
        error={blocksError}
        onBlockClick={onBlockClick}
      />
    </section>
  );
}
