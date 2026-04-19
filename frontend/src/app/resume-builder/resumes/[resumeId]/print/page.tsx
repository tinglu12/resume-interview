import { ResumePrintClient } from "./ResumePrintClient";

export default async function ResumePrintPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  return <ResumePrintClient resumeId={resumeId} />;
}
