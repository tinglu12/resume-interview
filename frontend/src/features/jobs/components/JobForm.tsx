"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createJob } from "../api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export function JobForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeFile) {
      setError("Please upload your resume as a PDF.");
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
        resumeFile,
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

      <div className="space-y-1.5">
        <Label>
          Resume (PDF) <span className="text-destructive">*</span>
        </Label>
        <Card
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer border-2 border-dashed hover:border-primary transition-colors"
        >
          <CardContent className="flex items-center justify-center px-6 py-8 text-center">
            {resumeFile ? (
              <p className="text-sm font-medium">{resumeFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to upload your resume PDF</p>
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
