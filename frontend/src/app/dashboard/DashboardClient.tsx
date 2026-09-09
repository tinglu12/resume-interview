"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImportResumeDialog } from "@/features/resume-display-upload/components/ImportResumeDialog";
import { ParseReviewModal } from "@/features/resume-display-upload/components/ParseReviewModal";
import { DuplicateResumeModal } from "@/features/resume-display-upload/components/DuplicateResumeModal";
import { useResumeFetch } from "@/features/resume-display-upload/hook/useResumeFetch";
import { useResumeImport } from "@/features/resume-display-upload/hook/useResumeImport";
import type { ParsedBlockPreview, Resume } from "@/types";
import { BlockLibrarySection } from "./_components/BlockLibrarySection";
import { ResumeLibrarySection } from "./_components/ResumeLibrarySection";

export function DashboardClient() {
  const router = useRouter();

  const { assembledResumes, loading: resumesLoading } = useResumeFetch();
  const { saveParsed, cancelPreview, isSaving, error: saveError } = useResumeImport();

  // UI state
  const [showImport, setShowImport] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlockPreview[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [duplicating, setDuplicating] = useState<Resume | null>(null);

  function handleParsed(token: string, blocks: ParsedBlockPreview[]) {
    setPreviewToken(token);
    setParsedBlocks(blocks);
    setShowImport(false);
    setShowReview(true);
  }

  function handleCancelReview() {
    if (previewToken) cancelPreview(previewToken);
    setShowReview(false);
    setPreviewToken(null);
  }

  async function handleSaveParsed(
    displayName: string,
    blocks: ParsedBlockPreview[],
  ) {
    if (!previewToken) return;
    try {
      const result = await saveParsed({
        preview_token: previewToken,
        display_name: displayName,
        blocks,
      });
      setShowReview(false);
      router.push(`/dashboard/resumes/${result.resume_id}`);
    } catch {
      // surfaced via `saveError` from the hook
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <ResumeLibrarySection
        resumes={assembledResumes}
        isLoading={resumesLoading}
        onImportClick={() => setShowImport(true)}
        onDuplicateClick={setDuplicating}
      />

      <BlockLibrarySection />

      {/* Import dialog */}
      <ImportResumeDialog
        open={showImport}
        onParsed={handleParsed}
        onCancel={() => setShowImport(false)}
      />

      {/* Parse review modal */}
      <ParseReviewModal
        open={showReview}
        blocks={parsedBlocks}
        onSave={handleSaveParsed}
        onCancel={handleCancelReview}
        isSaving={isSaving}
      />

      {/* Duplicate resume modal */}
      <DuplicateResumeModal resume={duplicating} onClose={() => setDuplicating(null)} />
    </div>
  );
}
