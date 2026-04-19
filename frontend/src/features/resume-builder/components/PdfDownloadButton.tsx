"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { pdf } from "@react-pdf/renderer";
import { getResume, getResumeBlocks } from "@/features/resume-builder/api";
import { ResumePDF } from "./ResumePDF";

interface Props {
  resumeId: string;
}

export function PdfDownloadButton({ resumeId }: Props) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const [resume, slots] = await Promise.all([
        getResume(resumeId, token),
        getResumeBlocks(resumeId, token),
      ]);
      const blob = await pdf(<ResumePDF resume={resume} slots={slots} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.display_name ?? resume.filename}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Generating…" : "Export PDF"}
    </button>
  );
}
