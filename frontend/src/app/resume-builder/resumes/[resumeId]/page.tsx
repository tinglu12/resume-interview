import { ResumeCanvasClient } from "./ResumeCanvasClient";
import { PdfDownloadButton } from "@/features/resume-builder/components/PdfDownloadButton";

export default async function ResumeCanvasPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-end border-b bg-background px-6 py-2">
        <PdfDownloadButton resumeId={resumeId} />
      </div>
      <main className="flex-1 flex overflow-hidden">
        <ResumeCanvasClient resumeId={resumeId} />
      </main>
    </div>
  );
}
