"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDocumentState } from "@embedpdf/core/react";
import { useDocumentManagerCapability } from "@embedpdf/plugin-document-manager/react";
import type { PdfEngine, Rect, SearchAllPagesResult } from "@embedpdf/models";

type HighlightsByPage = ReadonlyMap<number, readonly Rect[]>;

const HighlightContext = createContext<HighlightsByPage | null>(null);

/** Padding in PDF user units (points); scales with viewer zoom. */
const PAD_X_PDF = 3.5;
const PAD_Y_PDF = 2;

/** Minimum on-screen size so tiny glyph boxes still read like a highlighter strip. */
const MIN_WIDTH_PX = 14;
const MIN_HEIGHT_PX = 14;

/** Single box that tightly contains every search hit rect (one continuous highlight). */
function unionBoundingRect(rects: readonly Rect[]): Rect | null {
  if (!rects.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    const x1 = r.origin.x;
    const y1 = r.origin.y;
    const x2 = x1 + r.size.width;
    const y2 = y1 + r.size.height;
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  }
  return {
    origin: { x: minX, y: minY },
    size: { width: maxX - minX, height: maxY - minY },
  };
}

function inflateRect(rect: Rect, padX: number, padY: number): Rect {
  return {
    origin: {
      x: rect.origin.x - padX,
      y: rect.origin.y - padY,
    },
    size: {
      width: Math.max(0, rect.size.width + 2 * padX),
      height: Math.max(0, rect.size.height + 2 * padY),
    },
  };
}

function rectToScreenBox(
  rect: Rect,
  scale: number,
  minWidthPx: number,
  minHeightPx: number,
): { left: number; top: number; width: number; height: number } {
  let left = rect.origin.x * scale;
  let top = rect.origin.y * scale;
  let width = rect.size.width * scale;
  let height = rect.size.height * scale;

  if (width < minWidthPx) {
    const dx = (minWidthPx - width) / 2;
    left -= dx;
    width = minWidthPx;
  }
  if (height < minHeightPx) {
    const dy = minHeightPx - height;
    top -= dy * 0.35;
    height = minHeightPx;
  }

  return { left, top, width, height };
}

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

/** Renders one yellow highlight for the active excerpt on one page (place inside Scroller renderPage). */
export function ExcerptHighlightLayer({
  documentId,
  pageIndex,
}: {
  documentId: string;
  pageIndex: number;
}) {
  const byPage = useContext(HighlightContext);
  const documentState = useDocumentState(documentId);
  const rects = byPage?.get(pageIndex);
  const scale = documentState?.scale ?? 1;

  const merged = rects?.length ? unionBoundingRect(rects) : null;
  if (!merged) return null;

  const padded = inflateRect(merged, PAD_X_PDF, PAD_Y_PDF);
  const box = rectToScreenBox(padded, scale, MIN_WIDTH_PX, MIN_HEIGHT_PX);

  return (
    <div
      className="pointer-events-none"
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        background: "rgba(254, 240, 138, 0.72)",
        mixBlendMode: "multiply",
        isolation: "isolate",
        borderRadius: 4,
        zIndex: 5,
      }}
    />
  );
}
