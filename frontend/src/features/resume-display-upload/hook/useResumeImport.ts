"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResume, saveParsedBlocks, uploadResume } from "../api";
import type { ParsedBlockPreview } from "@/types";

export interface ParseResult {
  resumeId: string;
  blocks: ParsedBlockPreview[];
}

// uploadAndParse is a single mutation spanning two slow requests, so `isPending`
// alone can't tell the UI which one is in flight. Callers use `phase` for that.
export type ImportPhase = "idle" | "uploading" | "parsing" | "saving";

// The import flow is three steps that always run in this order:
// upload a PDF (or pick one already uploaded) → parse it into block previews →
// save the previews the user kept as real blocks on a new builder resume.
export function useResumeImport() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<ImportPhase>("idle");

  async function requireToken(): Promise<string> {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }

  const uploadAndParse = useMutation({
    mutationFn: async (file: File): Promise<ParseResult> => {
      const token = await requireToken();
      setPhase("uploading");
      const uploaded = await uploadResume(token, file);
      qc.invalidateQueries({ queryKey: ["resumes"] });
      setPhase("parsing");
      const { blocks } = await parseResume(token, uploaded.id);
      return { resumeId: uploaded.id, blocks };
    },
    onSettled: () => setPhase("idle"),
  });

  const parseExisting = useMutation({
    mutationFn: async (resumeId: string): Promise<ParseResult> => {
      const token = await requireToken();
      setPhase("parsing");
      const { blocks } = await parseResume(token, resumeId);
      return { resumeId, blocks };
    },
    onSettled: () => setPhase("idle"),
  });

  const saveParsed = useMutation({
    mutationFn: async (data: {
      resume_id: string;
      display_name: string;
      blocks: ParsedBlockPreview[];
    }) => {
      const token = await requireToken();
      setPhase("saving");
      return saveParsedBlocks(token, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
    onSettled: () => setPhase("idle"),
  });

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
