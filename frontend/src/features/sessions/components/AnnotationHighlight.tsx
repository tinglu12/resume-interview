"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDocumentManagerCapability } from "@embedpdf/plugin-document-manager/react";
import type { PdfEngine, SearchAllPagesResult } from "@embedpdf/models";
import { HighlightContext, type HighlightsByPage } from "./HighlightContext";

/**
 * Wraps the PDF viewport; runs search and exposes rects for {@link ExcerptHighlightLayer}.
 * Uses DOM overlays (marker-style highlight) instead of mutating the PDF with annotations.
 */
export function AnnotationHighlight({
  documentId,
  activeExcerpt,
  engine,
  children,
}: {
  documentId: string;
  activeExcerpt: string;
  engine: PdfEngine;
  children: ReactNode;
}) {
  const { provides } = useDocumentManagerCapability();
  const [byPage, setByPage] = useState<HighlightsByPage>(() => new Map());
  const runIdRef = useRef(0);

  useEffect(() => {
    const runId = ++runIdRef.current;
    let cancelled = false;

    const run = async () => {
      if (!provides) {
        if (!cancelled && runId === runIdRef.current) setByPage(new Map());
        return;
      }

      if (!activeExcerpt) {
        if (!cancelled && runId === runIdRef.current) setByPage(new Map());
        return;
      }

      const doc = provides.getDocument(documentId);
      if (!doc) {
        if (!cancelled && runId === runIdRef.current) setByPage(new Map());
        return;
      }

      const result = (await engine
        .searchAllPages(doc, activeExcerpt)
        .toPromise()) as SearchAllPagesResult;

      if (cancelled || runId !== runIdRef.current) return;

      const first = result.results[0];
      if (!first?.rects?.length) {
        setByPage(new Map());
        return;
      }

      const { pageIndex, rects } = first;
      if (pageIndex < 0 || pageIndex >= doc.pages.length) {
        setByPage(new Map());
        return;
      }

      if (cancelled || runId !== runIdRef.current) return;
      setByPage(new Map([[pageIndex, rects]]));
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [activeExcerpt, engine, provides, documentId]);

  return (
    <HighlightContext.Provider value={byPage}>
      {children}
    </HighlightContext.Provider>
  );
}
