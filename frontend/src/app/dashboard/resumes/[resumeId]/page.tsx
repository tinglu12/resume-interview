import { ResumeCanvasClient } from "./ResumeCanvasClient";
import { PdfDownloadButton } from "@/features/resume-builder/components/PdfDownloadButton";

export default async function ResumeCanvasPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-end border-b bg-background px-6 py-2">
        <PdfDownloadButton resumeId={resumeId} />
      </div>
      <main className="flex-1 min-h-0 flex overflow-hidden">
        <ResumeCanvasClient resumeId={resumeId} />
      </main>
    </div>
  );
}
