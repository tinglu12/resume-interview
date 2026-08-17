"use client";

import { useMemo } from "react";
import { EmbedPDF } from "@embedpdf/core/react";
import type { PluginBatchRegistrations } from "@embedpdf/core";
import {
  DocumentManagerPluginPackage,
  useDocumentManagerCapability,
} from "@embedpdf/plugin-document-manager/react";
import { ViewportPluginPackage } from "@embedpdf/plugin-viewport/react";
import { ScrollPluginPackage, Scroller } from "@embedpdf/plugin-scroll/react";
import {
  RenderPluginPackage,
  RenderLayer,
} from "@embedpdf/plugin-render/react";
import {
  SelectionLayer,
  SelectionPluginPackage,
} from "@embedpdf/plugin-selection/react";
import {
  InteractionManagerPluginPackage,
  GlobalPointerProvider,
  PagePointerProvider,
} from "@embedpdf/plugin-interaction-manager/react";
import type { PdfEngine } from "@embedpdf/models";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import { createPluginRegistration } from "@embedpdf/core";
import { DocumentContent } from "@embedpdf/plugin-document-manager/react";
import { Viewport } from "@embedpdf/plugin-viewport/react";

import { AnnotationHighlight } from "./AnnotationHighlight";
import { ExcerptHighlightLayer } from "./ExcerptHighlightLayer";
import { TextResumeViewer } from "./TextResumeViewer";

interface Props {
  resumeUrl?: string;
  resumeText: string;
  activeExcerpt: string | null;
}

export function ResumeViewer({ resumeUrl, resumeText, activeExcerpt }: Props) {
  const { engine, isLoading } = usePdfiumEngine();

  const { provides } = useDocumentManagerCapability();
  const plugins = useMemo<PluginBatchRegistrations>(
    () => [
      createPluginRegistration(DocumentManagerPluginPackage, {
        initialDocuments: resumeUrl ? [{ url: resumeUrl }] : [],
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(ScrollPluginPackage),
      createPluginRegistration(RenderPluginPackage, { withAnnotations: true }),
      createPluginRegistration(InteractionManagerPluginPackage),
      createPluginRegistration(SelectionPluginPackage),
    ],
    [resumeUrl],
  );

  if (isLoading || !engine) {
    return <div>Loading PDF Engine...</div>;
  }

  if (resumeUrl) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <EmbedPDF engine={engine} plugins={plugins}>
          {({ activeDocumentId }) =>
            activeDocumentId && (
              <DocumentContent documentId={activeDocumentId}>
                {({ isLoaded }) =>
                  isLoaded && (
                    <div className="relative h-full min-h-[min(70vh,560px)] overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                      <AnnotationHighlight
                        documentId={activeDocumentId}
                        activeExcerpt={activeExcerpt ?? ""}
                        engine={engine}
                      >
                        <Viewport
                          documentId={activeDocumentId}
                          className="absolute inset-0 bg-gray-200 dark:bg-gray-800 select-none"
                        >
                          <Scroller
                            documentId={activeDocumentId}
                            renderPage={({ pageIndex }) => (
                              <PagePointerProvider
                                documentId={activeDocumentId}
                                pageIndex={pageIndex}
                              >
                                <RenderLayer
                                  documentId={activeDocumentId}
                                  pageIndex={pageIndex}
                                  className="pointer-events-none"
                                />
                                <ExcerptHighlightLayer
                                  documentId={activeDocumentId}
                                  pageIndex={pageIndex}
                                />
                                <SelectionLayer
                                  documentId={activeDocumentId}
                                  pageIndex={pageIndex}
                                />
                              </PagePointerProvider>
                            )}
                          />
                        </Viewport>
                      </AnnotationHighlight>
                      {/* Selected Text Panel */}
                    </div>
                  )
                }
              </DocumentContent>
            )
          }
        </EmbedPDF>
      </div>
    );
  }

  return (
    <TextResumeViewer resumeText={resumeText} activeExcerpt={activeExcerpt} />
  );
}
