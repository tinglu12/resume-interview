"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useSession } from "@/features/sessions/hooks/useSession";
import { useJob } from "@/features/jobs/hooks/useJob";
import { SessionLayout } from "@/features/sessions/components/SessionLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  sessionId: string;
}

export function SessionPageClient({ sessionId }: Props) {
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    updateAnswer,
  } = useSession(sessionId);
  const {
    job,
    loading: jobLoading,
    error: jobError,
  } = useJob(session?.job_id ?? "");

  console.log("session", session);
  console.log("job", job);
  const loading = sessionLoading || (!!session && jobLoading);
  const error = sessionError ?? jobError;

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b bg-background px-6 py-4 shrink-0">
          <Skeleton className="h-5 w-32" />
          <UserButton />
        </header>
        <div className="flex-1 p-8">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !session || !job) {
    return (
      <div className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b bg-background px-6 py-4 shrink-0">
          <span className="text-sm font-medium">Interview Prep</span>
          <UserButton />
        </header>
        <div className="flex-1 p-8">
          <Alert variant="destructive">
            <AlertDescription>{error ?? "Session not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4 shrink-0">
        <div>
          <Link
            href={`/jobs/${job.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {job.job_title ?? "Job"}
          </Link>
        </div>
        <UserButton />
      </header>
      <div className="flex-1 overflow-hidden">
        <SessionLayout
          job={job}
          session={session}
          onAnswerSaved={updateAnswer}
        />
      </div>
    </div>
  );
}
