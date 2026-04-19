import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { DashboardClient } from "./DashboardClient";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold">
          Interview Prep
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/resume-builder" className="text-sm text-muted-foreground hover:text-foreground">
            Resume Builder
          </Link>
          <UserButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">My jobs</h1>
          <Link href="/jobs/new" >
            + New job
          </Link>
        </div>
        <Separator className="mb-6" />
        <DashboardClient />
      </main>
    </div>
  );
}
