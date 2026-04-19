import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ResumeCanvasClient } from "./ResumeCanvasClient";
import { PdfDownloadButton } from "@/features/resume-builder/components/PdfDownloadButton";

export default async function ResumeCanvasPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/resume-builder" className="text-sm text-muted-foreground hover:text-foreground">
            ← Resume Builder
          </Link>
          <span className="text-lg font-bold">Resume Canvas</span>
        </div>
        <div className="flex items-center gap-3">
          <PdfDownloadButton resumeId={resumeId} />
          <UserButton />
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <ResumeCanvasClient resumeId={resumeId} />
      </main>
    </div>
  );
}
