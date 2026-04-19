"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { createJob } from "../api";
import { listResumes } from "@/features/resume-builder/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import type { Resume } from "@/types";

type ResumeMode = "upload" | "builder";

export function JobForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeMode, setResumeMode] = useState<ResumeMode>("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load assembled resumes for the builder option
  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: async (): Promise<Resume[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listResumes(token);
    },
    enabled: resumeMode === "builder",
  });

  const builderResumes = (resumesQuery.data ?? []).filter(
    (r) => r.resume_type === "builder"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (resumeMode === "upload" && !resumeFile) {
      setError("Please upload your resume as a PDF.");
      return;
    }
    if (resumeMode === "builder" && !selectedResumeId) {
      setError("Please select a resume from your builder.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const job = await createJob(token, {
        jobTitle: jobTitle || undefined,
        company: company || undefined,
        jobDescription,
        resumeFile: resumeMode === "upload" ? resumeFile! : undefined,
        resumeId: resumeMode === "builder" ? selectedResumeId : undefined,
      });
      router.push(`/jobs/${job.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="job-title">Job title</Label>
          <Input
            id="job-title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Software Engineer"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="job-description">
          Job description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="job-description"
          required
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
        />
      </div>

      {/* Resume source toggle */}
      <div className="space-y-3">
        <Label>
          Resume <span className="text-destructive">*</span>
        </Label>
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setResumeMode("upload")}
            className={`flex-1 px-4 py-2 transition-colors ${
              resumeMode === "upload"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => setResumeMode("builder")}
            className={`flex-1 px-4 py-2 transition-colors ${
              resumeMode === "builder"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Use resume builder
          </button>
        </div>

        {resumeMode === "upload" && (
          <>
            <Card
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed hover:border-primary transition-colors"
            >
              <CardContent className="flex items-center justify-center px-6 py-8 text-center">
                {resumeFile ? (
                  <p className="text-sm font-medium">{resumeFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click to upload your resume PDF
                  </p>
                )}
              </CardContent>
            </Card>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            />
          </>
        )}

        {resumeMode === "builder" && (
          <div className="space-y-2">
            {resumesQuery.isPending && (
              <p className="text-sm text-muted-foreground">Loading resumes…</p>
            )}
            {!resumesQuery.isPending && builderResumes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No builder resumes found.{" "}
                <a href="/resume-builder" className="underline">
                  Create one in Resume Builder
                </a>
                .
              </p>
            )}
            {builderResumes.length > 0 && (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required={resumeMode === "builder"}
              >
                <option value="">Select a resume…</option>
                {builderResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.display_name ?? r.filename}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Generating questions…" : "Generate interview questions"}
      </Button>
    </form>
  );
}
