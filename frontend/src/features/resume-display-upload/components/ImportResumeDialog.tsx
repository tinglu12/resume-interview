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
import type { ParsedBlockPreview } from "@/types";

interface Props {
  open: boolean;
  onParsed: (previewToken: string, blocks: ParsedBlockPreview[]) => void;
  onCancel: () => void;
}

export function ImportResumeDialog({ open, onParsed, onCancel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { parseResume, isImporting, error, reset: resetImport } = useResumeImport();

  const [file, setFile] = useState<File | null>(null);

  const busy = isImporting;

  function reset() {
    setFile(null);
    resetImport();
  }

  async function handleParse() {
    if (!file) return;
    try {
      const result = await parseResume(file);
      onParsed(result.previewToken, result.blocks);
      reset();
    } catch {
      // surfaced via `error` from the hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onCancel(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import resume</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload a PDF to parse it into blocks.
          </p>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {busy ? (
          <div className="flex flex-col gap-2 py-2">
            <Skeleton className="h-10 rounded" />
            <p className="text-sm text-muted-foreground text-center">
              Parsing your resume…
            </p>
          </div>
        ) : (
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
            <Button onClick={handleParse} disabled={!file}>
              Upload &amp; parse into blocks
            </Button>
          </div>
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
