"use client";

import {
  useAttachBlockToResumeMutation,
  useDetachBlockFromResumeMutation,
  useResumeBlocksQuery,
} from "../lib/resume-blocks";

export function useAssembledResume(resumeId: string) {
  const query = useResumeBlocksQuery(resumeId);
  const attachMutation = useAttachBlockToResumeMutation(resumeId);
  const detachMutation = useDetachBlockFromResumeMutation(resumeId);

  return {
    blockSlots: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    attachBlock: attachMutation.mutateAsync,
    detachBlock: detachMutation.mutateAsync,
    isAttaching: attachMutation.isPending,
  };
}
