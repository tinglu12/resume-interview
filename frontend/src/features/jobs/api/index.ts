import { apiClient } from "@/lib/api-client";
import type { Job, JobSummary, Session } from "@/types";

export async function listJobs(token: string): Promise<JobSummary[]> {
  return apiClient.get<JobSummary[]>("/jobs", token);
}

export async function getJob(id: string, token: string): Promise<Job> {
  return apiClient.get<Job>(`/jobs/${id}`, token);
}

export async function createJob(
  token: string,
  data: {
    jobTitle?: string;
    company?: string;
    jobDescription: string;
    resumeFile: File;
  }
): Promise<Job> {
  const form = new FormData();
  if (data.jobTitle) form.append("job_title", data.jobTitle);
  if (data.company) form.append("company", data.company);
  form.append("job_description", data.jobDescription);
  form.append("resume", data.resumeFile);
  return apiClient.postForm<Job>("/jobs", token, form);
}

export async function listSessions(jobId: string, token: string): Promise<Session[]> {
  return apiClient.get<Session[]>(`/jobs/${jobId}/sessions`, token);
}

export async function createSession(jobId: string, token: string): Promise<Session> {
  return apiClient.post<Session>(`/jobs/${jobId}/sessions`, token);
}
