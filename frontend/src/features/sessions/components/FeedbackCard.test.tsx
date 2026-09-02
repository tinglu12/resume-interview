import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FeedbackCard } from "./FeedbackCard";
import type { Feedback } from "@/features/sessions/types";

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    score: 7,
    strengths: "Clear structure and concrete numbers.",
    improvements: "Could tie the impact back to the team's goals.",
    example_answer: "Here's a stronger version of that answer...",
    ...overrides,
  };
}

describe("FeedbackCard", () => {
  it("labels a score of 8 or above as 'Great'", () => {
    render(<FeedbackCard feedback={makeFeedback({ score: 8 })} />);
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText(/Great/)).toBeInTheDocument();
  });

  it("labels a score between 5 and 7 as 'Good'", () => {
    render(<FeedbackCard feedback={makeFeedback({ score: 5 })} />);
    expect(screen.getByText(/Good/)).toBeInTheDocument();
  });

  it("labels a score below 5 as 'Needs work'", () => {
    render(<FeedbackCard feedback={makeFeedback({ score: 4 })} />);
    expect(screen.getByText(/Needs work/)).toBeInTheDocument();
  });

  it("shows the strengths and improvements text", () => {
    render(<FeedbackCard feedback={makeFeedback()} />);
    expect(screen.getByText("Clear structure and concrete numbers.")).toBeInTheDocument();
    expect(
      screen.getByText("Could tie the impact back to the team's goals."),
    ).toBeInTheDocument();
  });

  it("reveals the example answer once the disclosure is opened", () => {
    render(<FeedbackCard feedback={makeFeedback()} />);
    const details = screen.getByText("See example answer").closest("details")!;
    expect(details.open).toBe(false);

    fireEvent.click(screen.getByText("See example answer"));

    expect(details.open).toBe(true);
    expect(screen.getByText("Here's a stronger version of that answer...")).toBeInTheDocument();
  });
});
