import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { NewResumeClient } from "./NewResumeClient";

export default function NewResumePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/resume-builder" className="text-sm text-muted-foreground hover:text-foreground">
            ← Resume Builder
          </Link>
          <span className="text-lg font-bold">New Resume</span>
        </div>
        <UserButton />
      </header>
      <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        <NewResumeClient />
      </main>
    </div>
  );
}
