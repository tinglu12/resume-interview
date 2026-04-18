import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Job, SessionWithAnswers } from "@/types";

interface Props {
  job: Job;
  session: SessionWithAnswers;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export function QuestionNavigation({
  job,
  session,
  activeIndex,
  setActiveIndex,
}: Props) {
  return (
    <nav className="flex flex-wrap gap-2">
      {job.questions.map((_, i) => {
        const answered = session.answers.some((a) => a.question_index === i);
        const isActive = i === activeIndex;
        return (
          <Button
            key={i}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "h-8 w-8 rounded-full p-0 text-xs font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : answered
                  ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/50"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {i + 1}
          </Button>
        );
      })}
    </nav>
  );
}
