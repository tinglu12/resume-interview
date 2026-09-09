"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requireToken } from "@/lib/require-token";
import { parseResume, saveParsedBlocks } from "../api";
import type { ParsedBlockPreview } from "@/types";

export interface ParseResult {
  previewToken: string;
  blocks: ParsedBlockPreview[];
}

export type ImportPhase = "idle" | "parsing" | "saving";

export function useParseResumeMutation(onPhaseChange: (phase: ImportPhase) => void) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (file: File): Promise<ParseResult> => {
      const token = await requireToken(getToken);
      onPhaseChange("parsing");
      const { blocks, preview_token } = await parseResume(token, file);
      return { previewToken: preview_token, blocks };
    },
    onSettled: () => onPhaseChange("idle"),
  });
}

export function useSaveParsedMutation(onPhaseChange: (phase: ImportPhase) => void) {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      preview_token: string;
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
