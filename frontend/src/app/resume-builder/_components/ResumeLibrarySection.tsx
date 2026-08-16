import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Resume } from "@/types";
import { ResumeMap } from "./ResumeMap";

interface ResumeLibrarySectionProps {
  resumes: Resume[];
  isLoading: boolean;
  onImportClick: () => void;
  onDuplicateClick: (resume: Resume) => void;
}


export function ResumeLibrarySection({
  resumes,
  isLoading,
  onImportClick,
  onDuplicateClick,
}: ResumeLibrarySectionProps) {

  return (
    <section>
      <div className="flex items-end justify-between mb-7">
        <div>
          <h2 className="font-bold text-2xl tracking-[-0.01em] mb-1.5">
            Your resumes
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Every resume here shares blocks from one library. Editing a block
            updates every resume using it.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/resume-builder/blocks">Block Library</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onImportClick}
          >
            Import from PDF
          </Button>
          <Button size="sm" asChild>
            <Link href="/resume-builder/resumes/new">+ New resume</Link>
          </Button>
        </div>
      </div>
      <ResumeMap
        isLoading={isLoading}
        resumes={resumes}
        onDuplicateClick={onDuplicateClick}
      />
    </section>
  );
}
