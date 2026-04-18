import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResumeViewer } from "./ResumeViewer";
import type { Job, QuestionItem } from "@/types";

interface Props {
  job: Job;
  currentQuestion: QuestionItem | null;
  setResumeOpen: (open: boolean) => void;
  resumeOpen: boolean;
}

export function ResumeContainer({
  job,
  currentQuestion,
  resumeOpen,
  setResumeOpen,
}: Props) {
  return (
    <>
      <div className="lg:hidden border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setResumeOpen(!resumeOpen)}
          className="w-full justify-between rounded-none px-4 py-3 h-auto text-sm font-medium"
        >
          <span>Resume</span>
          <span className="text-muted-foreground">
            {resumeOpen ? "▲" : "▼"}
          </span>
        </Button>
        {resumeOpen && (
          <ScrollArea className="max-h-64 min-h-0 px-4 pb-4">
            <ResumeViewer
              resumeUrl={job.resume_url}
              resumeText={job.resume_text}
              activeExcerpt={currentQuestion?.resume_excerpt ?? null}
            />
          </ScrollArea>
        )}
      </div>

      <aside className="hidden lg:flex lg:flex-col w-3/5 xl:w-2/3 border-r border-border bg-muted/30">
        <div className="px-6 pt-6 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resume
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6 **:data-[slot=scroll-area-viewport]:min-h-0">
          <ResumeViewer
            resumeUrl={job.resume_url}
            resumeText={job.resume_text}
            activeExcerpt={currentQuestion?.resume_excerpt ?? null}
          />
        </ScrollArea>
      </aside>
    </>
  );
}
