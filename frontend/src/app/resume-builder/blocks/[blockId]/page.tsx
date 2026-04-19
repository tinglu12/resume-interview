import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BlockEditClient } from "./BlockEditClient";

export default async function BlockEditPage({
  params,
}: {
  params: Promise<{ blockId: string }>;
}) {
  const { blockId } = await params;
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/resume-builder" className="text-sm text-muted-foreground hover:text-foreground">
            ← Resume Builder
          </Link>
          <span className="text-lg font-bold">Edit Block</span>
        </div>
        <UserButton />
      </header>
      <main className="flex-1 px-6 py-8 max-w-xl mx-auto w-full">
        <BlockEditClient blockId={blockId} />
      </main>
    </div>
  );
}
