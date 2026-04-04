import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { JobForm } from "@/features/jobs/components/JobForm";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewJobPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold">
          Interview Prep
        </Link>
        <UserButton />
      </header>
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/dashboard" className="mb-2 -ml-2 text-muted-foreground">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">New job</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your resume and paste the job description. We&apos;ll
            generate tailored interview questions for you.
          </p>
        </div>
        <Separator className="mb-6" />
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Job details</CardTitle>
          </CardHeader>
          <CardContent>
            <JobForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
