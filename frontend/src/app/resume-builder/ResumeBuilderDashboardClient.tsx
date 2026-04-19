"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BlockEditor } from "@/features/resume-builder/components/BlockEditor";
import { ImportResumeDialog } from "@/features/resume-builder/components/ImportResumeDialog";
import { ParseReviewModal } from "@/features/resume-builder/components/ParseReviewModal";
import { useBlocks } from "@/features/resume-builder/hooks/useBlocks";
import { listResumes, saveParsedBlocks } from "@/features/resume-builder/api";
import type { ParsedBlockPreview, Resume, ResumeBlock } from "@/types";
import { BlockLibrarySection } from "./_components/BlockLibrarySection";
import { BlockEditorSheet } from "./_components/BlockEditorSheet";

export function ResumeBuilderDashboardClient() {
  const router = useRouter();
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const { updateBlock } = useBlocks();

  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: async (): Promise<Resume[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return listResumes(token);
    },
  });

  const assembledResumes = (resumesQuery.data ?? []).filter(
    (r) => r.resume_type === "builder",
  );

  // UI state
  const [editingBlock, setEditingBlock] = useState<ResumeBlock | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [parseSource, setParseSource] = useState<string | null>(null);
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlockPreview[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleParsed(resumeId: string, blocks: ParsedBlockPreview[]) {
    setParseSource(resumeId);
    setParsedBlocks(blocks);
    setShowImport(false);
    setShowReview(true);
  }

  async function handleSaveParsed(
    displayName: string,
    blocks: ParsedBlockPreview[],
  ) {
    if (!parseSource) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await saveParsedBlocks(token, {
        resume_id: parseSource,
        display_name: displayName,
        blocks,
      });
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["resumes"] });
      setShowReview(false);
      router.push(`/resume-builder/resumes/${result.assembled_resume_id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save blocks");
    } finally {
      setIsSaving(false);
    }
  }

  const date = (s: string) =>
    new Date(s).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-8">
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Assembled resumes section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">My resumes</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(true)}
            >
              Import from PDF
            </Button>
            <Button size="sm" asChild>
              <Link href="/resume-builder/resumes/new">+ New resume</Link>
            </Button>
          </div>
        </div>

        {resumesQuery.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : assembledResumes.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-muted-foreground text-sm mb-3">
              No resumes yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(true)}
            >
              Import from PDF
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {assembledResumes.map((r) => (
              <Link
                key={r.id}
                href={`/resume-builder/resumes/${r.id}`}
                className="block group"
              >
                <Card className="transition-shadow hover:shadow-md h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-sm font-semibold">
                        {r.display_name ?? r.filename}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {date(r.created_at)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs text-muted-foreground">
                      Builder resume
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BlockLibrarySection onBlockClick={setEditingBlock} />

      <BlockEditorSheet
        editingBlock={editingBlock}
        setEditingBlock={setEditingBlock}
      />

      {/* Import dialog */}
      <ImportResumeDialog
        open={showImport}
        resumes={resumesQuery.data ?? []}
        loadingResumes={resumesQuery.isPending}
        onParsed={handleParsed}
        onCancel={() => setShowImport(false)}
      />

      {/* Parse review modal */}
      <ParseReviewModal
        open={showReview}
        blocks={parsedBlocks}
        onSave={handleSaveParsed}
        onCancel={() => setShowReview(false)}
        isSaving={isSaving}
      />
    </div>
  );
}
