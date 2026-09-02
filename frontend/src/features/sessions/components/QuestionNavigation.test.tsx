import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuestionNavigation } from "./QuestionNavigation";
import type { Job } from "@/features/jobs/types";
import type { SessionWithAnswers } from "@/features/sessions/types";

function makeJob(questionCount: number): Job {
  return {
    id: "job-1",
    job_title: "Senior Data Analyst",
    company: "Wayfair",
    job_description: "",
    resume_url: "",
    resume_text: "",
    created_at: "2024-01-01T00:00:00.000Z",
    questions: Array.from({ length: questionCount }, (_, i) => ({
      question: `Question ${i + 1}`,
      resume_excerpt: "",
    })),
  };
}

function makeSession(answeredIndexes: number[]): SessionWithAnswers {
  return {
    id: "session-1",
    job_id: "job-1",
    created_at: "2024-01-01T00:00:00.000Z",
    answers: answeredIndexes.map((question_index) => ({
      id: `answer-${question_index}`,
      session_id: "session-1",
      question_index,
      answer_text: "",
      audio_url: null,
      feedback: null,
      created_at: "2024-01-01T00:00:00.000Z",
    })),
  };
}

describe("QuestionNavigation", () => {
  it("renders one numbered button per question", () => {
    render(
      <QuestionNavigation
        job={makeJob(3)}
        session={makeSession([])}
        activeIndex={0}
        setActiveIndex={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("marks the active question with the primary background class", () => {
    render(
      <QuestionNavigation
        job={makeJob(2)}
        session={makeSession([])}
        activeIndex={1}
        setActiveIndex={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "2" }).className).toContain("bg-primary");
    expect(screen.getByRole("button", { name: "1" }).className).not.toContain("bg-primary");
  });

  it("marks an answered, inactive question with the green answered class", () => {
    render(
      <QuestionNavigation
        job={makeJob(2)}
        session={makeSession([0])}
        activeIndex={1}
        setActiveIndex={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "1" }).className).toContain("bg-green-100");
  });

  it("calls setActiveIndex with the clicked question's index", () => {
    const setActiveIndex = vi.fn();
    render(
      <QuestionNavigation
        job={makeJob(3)}
        session={makeSession([])}
        activeIndex={0}
        setActiveIndex={setActiveIndex}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "3" }));

    expect(setActiveIndex).toHaveBeenCalledWith(2);
  });
});
