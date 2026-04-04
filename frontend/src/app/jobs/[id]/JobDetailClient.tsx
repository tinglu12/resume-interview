"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import { useJob } from "@/features/jobs/hooks/useJob";
import { createSession } from "@/features/jobs/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  jobId: string;
}

export function JobDetailClient({ jobId }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { job, loading, error } = useJob(jobId);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

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
          <CardHeader className="p-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDescriptionOpen((v) => !v)}
              aria-expanded={descriptionOpen}
              className="h-auto w-full justify-between rounded-none px-4 py-3 font-normal hover:bg-muted/50"
            >
              <span className="font-heading text-base font-medium leading-snug">
                Job description
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  descriptionOpen && "rotate-180",
                )}
              />
            </Button>
          </CardHeader>
          {descriptionOpen && (
            <CardContent className="pt-0">
              <div className="max-h-96 min-h-0 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
                <p className="whitespace-pre-wrap pb-1 pr-2 text-sm leading-relaxed text-muted-foreground">
                  {job.job_description.trim()
                    ? job.job_description
                    : "No description provided."}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

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
