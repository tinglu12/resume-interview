"use client";

import { useEffect, useRef } from "react";

export function TextResumeViewer({
  resumeText,
  activeExcerpt,
}: {
  resumeText: string;
  activeExcerpt: string | null;
}) {
  const highlightRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeExcerpt]);

  if (!activeExcerpt) {
    return (
      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
        {resumeText}
      </div>
    );
  }

  const idx = resumeText.indexOf(activeExcerpt);
  if (idx === -1) {
    return (
      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
        {resumeText}
      </div>
    );
  }

  const before = resumeText.slice(0, idx);
  const after = resumeText.slice(idx + activeExcerpt.length);

  return (
    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
      {before}
      <mark
        ref={highlightRef}
        className="bg-yellow-200 text-gray-900 rounded px-0.5"
      >
        {activeExcerpt}
      </mark>
      {after}
    </div>
  );
}
