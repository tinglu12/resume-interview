"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BlockEditor } from "@/features/resume-builder/components/BlockEditor";
import { getBlock } from "@/features/resume-builder/api";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import type { ResumeBlock } from "@/types";

interface Props {
  blockId: string;
}

export function BlockEditClient({ blockId }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { updateBlock, isUpdating } = useBlocks();

  const query = useQuery({
    queryKey: ["block", blockId],
    queryFn: async (): Promise<ResumeBlock> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getBlock(blockId, token);
    },
    enabled: !!blockId,
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (query.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{query.error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <BlockEditor
      block={query.data!}
      onSave={async (data) => {
        await updateBlock({ id: blockId, data });
        router.push("/resume-builder");
      }}
      onCancel={() => router.push("/resume-builder")}
      isSaving={isUpdating}
    />
  );
}
