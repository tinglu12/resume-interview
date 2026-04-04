import Link from "next/link";
import type { JobSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  job: JobSummary;
}

export function JobCard({ job }: Props) {
  const date = new Date(job.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card className="transition-shadow hover:shadow-md h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base font-semibold leading-snug">
              {job.job_title ?? "Untitled role"}
            </CardTitle>
            <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
          </div>
          {job.company && (
            <p className="text-sm text-muted-foreground">{job.company}</p>
          )}
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">
            {job.session_count} {job.session_count === 1 ? "session" : "sessions"}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
