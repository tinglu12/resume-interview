"use client";

import { useState } from "react";
import {
  useParseResumeMutation,
  useSaveParsedMutation,
  type ImportPhase,
} from "../lib/resume-import";

export type { ImportPhase, ParseResult } from "../lib/resume-import";

// The import flow is two steps that always run in this order:
// upload a PDF and parse it into block previews → save the previews the user
// kept as real blocks on a new builder resume.
export function useResumeImport() {
  const [phase, setPhase] = useState<ImportPhase>("idle");

  const parseResumeMutation = useParseResumeMutation(setPhase);
  const saveParsed = useSaveParsedMutation(setPhase);

  return {
    parseResume: parseResumeMutation.mutateAsync,
    saveParsed: saveParsed.mutateAsync,
    phase,
    isImporting: parseResumeMutation.isPending,
    isSaving: saveParsed.isPending,
    error: parseResumeMutation.error?.message ?? saveParsed.error?.message ?? null,
    reset: () => {
      parseResumeMutation.reset();
      saveParsed.reset();
      setPhase("idle");
    },
  };
}
