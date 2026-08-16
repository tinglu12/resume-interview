import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardTitle } from "@/components/ui/card";
import type { Resume } from "@/types";

function formatCreatedDate(s: string) {
  return `Created ${new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

type ResumeCardProps = {
  resume: Resume;
  onDuplicateClick: (resume: Resume) => void;
};

export function ResumeCard(props: ResumeCardProps) {
  const { resume, onDuplicateClick } = props;

  return (
    <Card key={resume.id} className="p-4.5 gap-3.5">
      <Link href={`/resume-builder/resumes/${resume.id}`} className="block group">
        <div className="h-[78px] bg-background border border-hairline rounded-md px-3 py-2.5 flex flex-col gap-1.5 mb-3.5">
          <div className="w-[60%] h-1.5 bg-foreground/70 rounded-full" />
          <div className="w-[38%] h-1 bg-muted-foreground/40 rounded-full mt-0.5" />
          <div className="w-[90%] h-1 bg-hairline rounded-full mt-1.5" />
          <div className="w-[80%] h-1 bg-hairline rounded-full" />
        </div>
        <CardTitle className="text-sm font-semibold group-hover:text-accent-teal">
          {resume.display_name ?? resume.filename}
        </CardTitle>
        <div className="font-mono text-[9.5px] tracking-[0.06em] uppercase text-muted-foreground mt-1">
          {formatCreatedDate(resume.created_at)}
        </div>
      </Link>
      <div className="flex justify-between items-center border-t border-hairline pt-3">
        <button
          onClick={() => onDuplicateClick(resume)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Duplicate
        </button>
        <Link
          href={`/resume-builder/resumes/${resume.id}`}
          className="text-xs font-semibold text-accent-teal hover:underline"
        >
          Open →
        </Link>
      </div>
    </Card>
  );
}
