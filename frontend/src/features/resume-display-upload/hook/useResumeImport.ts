"use client";

import { useState } from "react";
import {
  useParseExistingMutation,
  useSaveParsedMutation,
  useUploadAndParseMutation,
  type ImportPhase,
} from "../lib/resume-import";

export type { ImportPhase, ParseResult } from "../lib/resume-import";

// The import flow is three steps that always run in this order:
// upload a PDF (or pick one already uploaded) → parse it into block previews →
// save the previews the user kept as real blocks on a new builder resume.
export function useResumeImport() {
  const [phase, setPhase] = useState<ImportPhase>("idle");

  const uploadAndParse = useUploadAndParseMutation(setPhase);
  const parseExisting = useParseExistingMutation(setPhase);
  const saveParsed = useSaveParsedMutation(setPhase);

  return {
    uploadAndParse: uploadAndParse.mutateAsync,
    parseExisting: parseExisting.mutateAsync,
    saveParsed: saveParsed.mutateAsync,
    phase,
    isImporting: uploadAndParse.isPending || parseExisting.isPending,
    isSaving: saveParsed.isPending,
    error:
      uploadAndParse.error?.message ??
      parseExisting.error?.message ??
      saveParsed.error?.message ??
      null,
    reset: () => {
      uploadAndParse.reset();
      parseExisting.reset();
      saveParsed.reset();
      setPhase("idle");
    },
  };
}
