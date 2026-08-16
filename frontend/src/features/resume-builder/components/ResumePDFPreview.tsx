"use client";

import dynamic from "next/dynamic";
import type { BlockOnResume, Resume, ResumeSection } from "@/types";
import { ResumePDF } from "./ResumePDF";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => ({ default: m.PDFViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading preview…
      </div>
    ),
  }
);

interface Props {
  resume: Resume;
  slots: BlockOnResume[];
  sections?: ResumeSection[];
}

export function ResumePDFPreview({ resume, slots, sections }: Props) {
  // Key encodes content — forces a full PDFViewer remount when content changes,
  // preventing react-pdf from accumulating stale block renders.
  const key = sections
    ? sections.map((s) => `${s.id}:${s.blocks.map((b) => `${b.block.id}:${b.position}`).join("|")}`).join(",")
    : slots.map((s) => `${s.block.id}:${s.position}`).join(",");

  return (
    <PDFViewer key={key} width="100%" height="100%" showToolbar={false}>
      <ResumePDF resume={resume} slots={slots} sections={sections} />
    </PDFViewer>
  );
}
