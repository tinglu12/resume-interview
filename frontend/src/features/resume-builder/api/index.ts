import { apiClient } from "@/lib/api-client";
import type {
  BlockOnResume,
  Resume,
  ResumeBlock,
  ResumeSection,
} from "@/types";

// ── Builder resume creation ───────────────────────────────────────────────────
// Listing, upload, delete and the AI parse flow live in @/features/resume-display-upload/api

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

// ── Sections ──────────────────────────────────────────────────────────────────

export async function getResumeSections(
  resumeId: string,
  token: string
): Promise<ResumeSection[]> {
  return apiClient.get<ResumeSection[]>(`/resumes/${resumeId}/sections`, token);
}

export async function createResumeSection(
  resumeId: string,
  token: string,
  data: { section_type: string; display_name: string; position: number }
): Promise<ResumeSection> {
  return apiClient.post<ResumeSection>(`/resumes/${resumeId}/sections`, token, data);
}

export async function updateResumeSection(
  resumeId: string,
  sectionId: string,
  token: string,
  data: { display_name?: string; position?: number }
): Promise<ResumeSection> {
  return apiClient.patch<ResumeSection>(
    `/resumes/${resumeId}/sections/${sectionId}`,
    token,
    data
  );
}

export async function deleteResumeSection(
  resumeId: string,
  sectionId: string,
  token: string
): Promise<void> {
  return apiClient.delete(`/resumes/${resumeId}/sections/${sectionId}`, token);
}

export async function reorderSections(
  resumeId: string,
  token: string,
  sections: Array<{ section_id: string; position: number }>
): Promise<void> {
  return apiClient.patch<void>(
    `/resumes/${resumeId}/sections/reorder`,
    token,
    { sections }
  ) as Promise<void>;
}

export async function attachBlockToSection(
  resumeId: string,
  sectionId: string,
  token: string,
  blockId: string,
  position: number
): Promise<ResumeSection> {
  return apiClient.post<ResumeSection>(
    `/resumes/${resumeId}/sections/${sectionId}/blocks`,
    token,
    { block_id: blockId, position }
  );
}

export async function detachBlockFromSection(
  resumeId: string,
  sectionId: string,
  blockId: string,
  token: string
): Promise<void> {
  return apiClient.delete(
    `/resumes/${resumeId}/sections/${sectionId}/blocks/${blockId}`,
    token
  );
}

export async function reorderSectionBlocks(
  resumeId: string,
  sectionId: string,
  token: string,
  blocks: Array<{ block_id: string; position: number }>
): Promise<void> {
  return apiClient.patch<void>(
    `/resumes/${resumeId}/sections/${sectionId}/blocks/reorder`,
    token,
    { blocks }
  ) as Promise<void>;
}
