"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumeImport } from "../hook/useResumeImport";
import type { ParsedBlockPreview, Resume } from "@/types";

type Tab = "upload" | "existing";

interface Props {
  open: boolean;
  resumes: Resume[];
  loadingResumes: boolean;
  onParsed: (resumeId: string, blocks: ParsedBlockPreview[]) => void;
  onCancel: () => void;
}

export function ImportResumeDialog({
  open,
  resumes,
  loadingResumes,
  onParsed,
  onCancel,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadAndParse, parseExisting, phase, isImporting, error, reset: resetImport } =
    useResumeImport();

  const [tab, setTab] = useState<Tab>("upload");
  const [file, setFile] = useState<File | null>(null);

  const busy = isImporting;
  const busyLabel = phase === "uploading" ? "Uploading PDF…" : "Parsing resume with AI…";

  function reset() {
    setFile(null);
    resetImport();
  }

  async function handleUploadAndParse() {
    if (!file) return;
    try {
      const result = await uploadAndParse(file);
      onParsed(result.resumeId, result.blocks);
      reset();
    } catch {
      // surfaced via `error` from the hook
    }
  }

  async function handleSelectExisting(resumeId: string) {
    try {
      const result = await parseExisting(resumeId);
      onParsed(result.resumeId, result.blocks);
      reset();
    } catch {
      // surfaced via `error` from the hook
    }
  }

  const uploadedResumes = resumes.filter((r) => r.resume_type === "upload");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onCancel(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import resume</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload a PDF or pick an existing one to parse into blocks.
          </p>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 px-4 py-2 transition-colors ${
              tab === "upload"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Upload new PDF
          </button>
          <button
            type="button"
            onClick={() => setTab("existing")}
            className={`flex-1 px-4 py-2 transition-colors ${
              tab === "existing"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Use existing
          </button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {busy ? (
          <div className="flex flex-col gap-2 py-2">
            <Skeleton className="h-10 rounded" />
            <p className="text-sm text-muted-foreground text-center">{busyLabel}</p>
          </div>
        ) : (
          <>
            {/* Upload tab */}
            {tab === "upload" && (
              <div className="flex flex-col gap-3">
                <Card
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed hover:border-primary transition-colors"
                >
                  <CardContent className="flex items-center justify-center px-6 py-8 text-center">
                    {file ? (
                      <p className="text-sm font-medium">{file.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click to select your resume PDF
                      </p>
                    )}
                  </CardContent>
                </Card>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    resetImport();
                  }}
                />
                <Button onClick={handleUploadAndParse} disabled={!file}>
                  Upload &amp; parse into blocks
                </Button>
              </div>
            )}

            {/* Existing tab */}
            {tab === "existing" && (
              <div className="flex flex-col gap-2">
                {loadingResumes && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded" />
                    ))}
                  </>
                )}

                {!loadingResumes && uploadedResumes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No uploaded resumes found. Switch to &ldquo;Upload new PDF&rdquo; tab.
                  </p>
                )}

                {uploadedResumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => handleSelectExisting(resume.id)}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm hover:bg-muted transition-colors"
                  >
                    <span className="font-medium truncate">{resume.filename}</span>
                    {resume.assembled_resume_id && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        Already imported
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => { reset(); onCancel(); }} disabled={busy}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
