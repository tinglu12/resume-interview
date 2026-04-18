"use client";

import { useState } from "react";
import { QuestionCard } from "./QuestionCard";
import type { Answer, Job, SessionWithAnswers } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ProgressionSection } from "./ProgressionSection";
import { QuestionNavigation } from "./QuestionNavigation";
import { ResumeContainer } from "./ResumeContainer";

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
      <ResumeContainer
        job={job}
        currentQuestion={currentQuestion}
        resumeOpen={resumeOpen}
        setResumeOpen={setResumeOpen}
      />

      {/* Question panel */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Progress summary */}
        <ProgressionSection
          answeredCount={answeredCount}
          totalCount={job.questions.length}
        />

        <QuestionNavigation
          job={job}
          session={session}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />

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
