"use client";

import { useState } from "react";
import { ResumeViewer } from "./ResumeViewer";
import { QuestionCard } from "./QuestionCard";
import type { Answer, Job, SessionWithAnswers } from "@/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  job: Job;
  session: SessionWithAnswers;
  onAnswerSaved: (answer: Answer) => void;
}

export function SessionLayout({ job, session, onAnswerSaved }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [resumeOpen, setResumeOpen] = useState(false);

  const currentQuestion = job.questions[activeIndex];
  const existingAnswer = session.answers.find(
    (a) => a.question_index === activeIndex,
  );

  const answeredCount = session.answers.length;

  return (
    <div className="flex h-full flex-col lg:flex-row gap-0">
      {/* Resume panel — collapsible on mobile, sidebar on desktop */}
      <div className="lg:hidden border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setResumeOpen((v) => !v)}
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

      {/* Question panel */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Progress summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Session progress</p>
          <Badge variant="outline">
            {answeredCount} / {job.questions.length} answered
          </Badge>
        </div>

        {/* Question navigation */}
        <nav className="flex flex-wrap gap-2">
          {job.questions.map((_, i) => {
            const answered = session.answers.some(
              (a) => a.question_index === i,
            );
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

        <Separator />

        <QuestionCard
          sessionId={session.id}
          questionIndex={activeIndex}
          total={job.questions.length}
          questionItem={currentQuestion}
          existingAnswer={existingAnswer}
          onAnswerSaved={onAnswerSaved}
        />
      </main>
    </div>
  );
}
