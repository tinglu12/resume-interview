"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { parseResume, saveParsedBlocks, uploadResume } from "../api";
import type { ParsedBlockPreview } from "@/types";

export interface ParseResult {
  resumeId: string;
  blocks: ParsedBlockPreview[];
}

export type ImportPhase = "idle" | "uploading" | "parsing" | "saving";

// uploadAndParse spans two slow requests (upload, then parse), so callers that
// need to distinguish which one is in flight pass `onPhaseChange`.
export function useUploadAndParseMutation(onPhaseChange: (phase: ImportPhase) => void) {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<ParseResult> => {
      const token = await requireToken(getToken);
      onPhaseChange("uploading");
      const uploaded = await uploadResume(token, file);
      qc.invalidateQueries({ queryKey: ["resumes"] });
      onPhaseChange("parsing");
      const { blocks } = await parseResume(token, uploaded.id);
      return { resumeId: uploaded.id, blocks };
    },
    onSettled: () => onPhaseChange("idle"),
  });
}

export function useParseExistingMutation(onPhaseChange: (phase: ImportPhase) => void) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (resumeId: string): Promise<ParseResult> => {
      const token = await requireToken(getToken);
      onPhaseChange("parsing");
      const { blocks } = await parseResume(token, resumeId);
      return { resumeId, blocks };
    },
    onSettled: () => onPhaseChange("idle"),
  });
}

export function useSaveParsedMutation(onPhaseChange: (phase: ImportPhase) => void) {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      resume_id: string;
      display_name: string;
      blocks: ParsedBlockPreview[];
    }) => {
      const token = await requireToken(getToken);
      onPhaseChange("saving");
      return saveParsedBlocks(token, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
    onSettled: () => onPhaseChange("idle"),
  });
}
