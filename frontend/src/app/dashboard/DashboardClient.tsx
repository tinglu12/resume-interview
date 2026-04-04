"use client";

import Link from "next/link";
import { useJobs } from "@/features/jobs/hooks/useJobs";
import { JobCard } from "@/features/jobs/components/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DashboardClient() {
  const { jobs, loading, error } = useJobs();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground mb-4">No jobs yet.</p>
        <Link href="/jobs/new">Create your first job posting</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
