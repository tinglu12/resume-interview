import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { Resume } from "@/types";
import { ResumeCard } from "./ResumeCard";


type ResumeMapProps =  {
  isLoading: boolean;
  resumes: Resume[];
  onDuplicateClick: (r: Resume) => void;
};

export function ResumeMap({ isLoading, resumes, onDuplicateClick }: ResumeMapProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[220px] rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {resumes.map((resume) => (
        <ResumeCard key={resume.id} resume={resume} onDuplicateClick={onDuplicateClick} />
      ))}

      <Link href="/resume-builder/resumes/new" className="block">
        <div className="h-full min-h-[220px] bg-card border-[1.5px] border-dashed border-muted-foreground/40 rounded-xl p-4.5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent-teal hover:text-accent-teal transition-colors">
          <div className="w-[30px] h-[30px] rounded-full bg-panel flex items-center justify-center text-base text-foreground">
            +
          </div>
          <div className="text-[13px] font-semibold">New resume</div>
          <div className="text-[11px] text-center opacity-70">
            From upload or from scratch
          </div>
        </div>
      </Link>
    </div>

  );
}
