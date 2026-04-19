import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { ResumeBuilderDashboardClient } from "./ResumeBuilderDashboardClient";

export default function ResumeBuilderPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
          <span className="text-lg font-bold">Resume Builder</span>
        </div>
        <UserButton />
      </header>
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <Separator className="mb-6" />
        <ResumeBuilderDashboardClient />
      </main>
    </div>
  );
}
