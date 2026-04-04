"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useJob } from "@/features/jobs/hooks/useJob";
import { createSession } from "@/features/jobs/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface Props {
  jobId: string;
}

export function JobDetailClient({ jobId }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { job, loading, error } = useJob(jobId);

  async function handleStartSession() {
    const token = await getToken();
    if (!token || !job) return;
    const session = await createSession(job.id, token);
    router.push(`/sessions/${session.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between border-b bg-background px-6 py-4">
          <span className="text-lg font-bold">Interview Prep</span>
          <UserButton />
        </header>
        <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between border-b bg-background px-6 py-4">
          <Link href="/dashboard" className="text-lg font-bold">Interview Prep</Link>
          <UserButton />
        </header>
        <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <Alert variant="destructive">
            <AlertDescription>{error ?? "Job not found"}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <Link href="/dashboard" className="text-lg font-bold">
          Interview Prep
        </Link>
        <UserButton />
      </header>
      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </Link>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              {job.job_title ?? "Untitled role"}
            </h1>
            {job.company && (
              <Badge variant="secondary">{job.company}</Badge>
            )}
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Interview questions
              <Badge variant="outline" className="ml-2">{job.questions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              {job.questions.map((q, i) => (
                <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {q.question}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Button onClick={handleStartSession} className="w-full" size="lg">
          Start practice session
        </Button>
      </main>
    </div>
  );
}
