import { apiClient } from "@/lib/api-client";
import type { ParsedBlockPreview, ParseResumeResponse, Resume, ResumeBlock } from "@/types";

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

// ── AI parse flow ─────────────────────────────────────────────────────────────

export async function parseResume(
  token: string,
  file: File
): Promise<ParseResumeResponse> {
  const form = new FormData();
  form.append("resume", file);
  return apiClient.postForm<ParseResumeResponse>(
    "/resume-blocks/parse",
    token,
    form
  );
}

export async function saveParsedBlocks(
  token: string,
  data: {
    preview_token: string;
    display_name: string;
    blocks: ParsedBlockPreview[];
  }
): Promise<{ blocks: ResumeBlock[]; resume_id: string }> {
  return apiClient.post<{ blocks: ResumeBlock[]; resume_id: string }>(
    "/resume-blocks/save-parsed",
    token,
    data
  );
}
