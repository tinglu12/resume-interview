import { ResumeCanvasClient } from "./ResumeCanvasClient";

export default async function ResumeCanvasPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  return (
    <main className="flex-1 min-h-0 flex overflow-hidden">
      <ResumeCanvasClient resumeId={resumeId} />
    </main>
  );
}
