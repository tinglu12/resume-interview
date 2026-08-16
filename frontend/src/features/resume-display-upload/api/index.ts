import { apiClient } from "@/lib/api-client";
import type { ParsedBlockPreview, Resume, ResumeBlock } from "@/types";

// ── Resume listing / display ──────────────────────────────────────────────────

export async function listResumes(token: string): Promise<Resume[]> {
  return apiClient.get<Resume[]>("/resumes", token);
}

export async function getResume(id: string, token: string): Promise<Resume> {
  return apiClient.get<Resume>(`/resumes/${id}`, token);
}

export async function deleteResume(id: string, token: string): Promise<void> {
  return apiClient.delete(`/resumes/${id}`, token);
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadResume(token: string, file: File): Promise<Resume> {
  const form = new FormData();
  form.append("resume", file);
  return apiClient.postForm<Resume>("/resumes", token, form);
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
