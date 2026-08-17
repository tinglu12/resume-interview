"use client";

import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { ResumePDFPreview } from "@/features/resume-builder/components/ResumePDFPreview";
import { PdfDownloadButton } from "@/features/resume-builder/components/PdfDownloadButton";

import type { BlockOnResume, Resume, ResumeSection } from "@/types";

interface PreviewContentProps {
  resume: Resume | undefined;
  isPending: boolean;
  slots: BlockOnResume[];
  sections: ResumeSection[];
}

function PreviewContent({ resume, isPending, slots, sections }: PreviewContentProps) {
  if (resume) {
    return <ResumePDFPreview resume={resume} slots={slots} sections={sections} />;
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
      Could not load resume
    </div>
  );
}

interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  resume: Resume | undefined;
  isPending: boolean;
  slots: BlockOnResume[];
  sections: ResumeSection[];
  resumeId: string;
}

export function PreviewRail({ open, onOpen, onClose, resume, isPending, slots, sections, resumeId }: Props) {
  if (!open) {
    return (
      <aside className="h-full border-l border-hairline bg-panel flex flex-col">
        <button
          onClick={onOpen}
          className="flex-1 flex flex-col items-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Expand preview"
        >
          <ChevronLeft className="h-4 w-4" />
          <FileText className="h-4 w-4" />
          <span className="text-xs [writing-mode:vertical-rl] tracking-wide">Preview</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="h-full border-l border-hairline bg-panel flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-hairline">
          <h2 className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Preview
          </h2>
          <div className="flex items-center gap-2">
            <PdfDownloadButton resumeId={resumeId} />
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Collapse preview"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <PreviewContent resume={resume} isPending={isPending} slots={slots} sections={sections} />
      </div>
    </aside>
  );
}
