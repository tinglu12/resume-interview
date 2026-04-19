import { apiClient } from "@/lib/api-client";
import type {
  BlockOnResume,
  ParsedBlockPreview,
  Resume,
  ResumeBlock,
} from "@/types";

// ── Resume CRUD ───────────────────────────────────────────────────────────────

export async function listResumes(token: string): Promise<Resume[]> {
  return apiClient.get<Resume[]>("/resumes", token);
}

export async function uploadResume(token: string, file: File): Promise<Resume> {
  const form = new FormData();
  form.append("resume", file);
  return apiClient.postForm<Resume>("/resumes", token, form);
}

export async function getResume(id: string, token: string): Promise<Resume> {
  return apiClient.get<Resume>(`/resumes/${id}`, token);
}

export async function deleteResume(id: string, token: string): Promise<void> {
  return apiClient.delete(`/resumes/${id}`, token);
}

export async function createAssembledResume(
  token: string,
  displayName: string
): Promise<Resume> {
  return apiClient.post<Resume>("/resumes/builder", token, {
    display_name: displayName,
  });
}

// ── Block CRUD ────────────────────────────────────────────────────────────────

export async function listBlocks(token: string): Promise<ResumeBlock[]> {
  return apiClient.get<ResumeBlock[]>("/resume-blocks", token);
}

export async function getBlock(id: string, token: string): Promise<ResumeBlock> {
  return apiClient.get<ResumeBlock>(`/resume-blocks/${id}`, token);
}

export async function createBlock(
  token: string,
  data: { block_type: string; title: string; content: Record<string, unknown> }
): Promise<ResumeBlock> {
  return apiClient.post<ResumeBlock>("/resume-blocks", token, data);
}

export async function updateBlock(
  id: string,
  token: string,
  data: { title?: string; content?: Record<string, unknown> }
): Promise<ResumeBlock> {
  return apiClient.patch<ResumeBlock>(`/resume-blocks/${id}`, token, data);
}

export async function deleteBlock(
  id: string,
  token: string,
  force = false
): Promise<void> {
  return apiClient.delete(
    `/resume-blocks/${id}${force ? "?force=true" : ""}`,
    token
  );
}

// ── AI parse flow ─────────────────────────────────────────────────────────────

export async function parseResume(
  token: string,
  resumeId: string
): Promise<{ blocks: ParsedBlockPreview[] }> {
  return apiClient.post<{ blocks: ParsedBlockPreview[] }>(
    "/resume-blocks/parse",
    token,
    { resume_id: resumeId }
  );
}

export async function saveParsedBlocks(
  token: string,
  data: {
    resume_id: string;
    display_name: string;
    blocks: ParsedBlockPreview[];
  }
): Promise<{ blocks: ResumeBlock[]; assembled_resume_id: string }> {
  return apiClient.post<{ blocks: ResumeBlock[]; assembled_resume_id: string }>(
    "/resume-blocks/save-parsed",
    token,
    data
  );
}

// ── Assembly ──────────────────────────────────────────────────────────────────

export async function getResumeBlocks(
  resumeId: string,
  token: string
): Promise<BlockOnResume[]> {
  return apiClient.get<BlockOnResume[]>(`/resumes/${resumeId}/blocks`, token);
}

export async function attachBlock(
  resumeId: string,
  token: string,
  blockId: string,
  position: number
): Promise<BlockOnResume> {
  return apiClient.post<BlockOnResume>(`/resumes/${resumeId}/blocks`, token, {
    block_id: blockId,
    position,
  });
}

export async function detachBlock(
  resumeId: string,
  blockId: string,
  token: string
): Promise<void> {
  return apiClient.delete(`/resumes/${resumeId}/blocks/${blockId}`, token);
}

export async function reorderBlocks(
  resumeId: string,
  token: string,
  blocks: Array<{ block_id: string; position: number }>
): Promise<void> {
  return apiClient.patch<void>(`/resumes/${resumeId}/blocks/reorder`, token, {
    blocks,
  }) as Promise<void>;
}
