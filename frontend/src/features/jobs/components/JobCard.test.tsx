import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobCard } from "./JobCard";
import type { JobSummary } from "@/features/jobs/types";

function makeJob(overrides: Partial<JobSummary> = {}): JobSummary {
  return {
    id: "job-1",
    job_title: "Senior Data Analyst",
    company: "Wayfair",
    created_at: "2024-03-15T00:00:00.000Z",
    session_count: 2,
    ...overrides,
  };
}

describe("JobCard", () => {
  it("renders the title, company, formatted date, and links to the job detail page", () => {
    const job = makeJob();
    render(<JobCard job={job} />);

    const expectedDate = new Date(job.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    expect(screen.getByText("Senior Data Analyst")).toBeInTheDocument();
    expect(screen.getByText("Wayfair")).toBeInTheDocument();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/jobs/job-1");
  });

  it("falls back to 'Untitled role' when job_title is null", () => {
    render(<JobCard job={makeJob({ job_title: null })} />);
    expect(screen.getByText("Untitled role")).toBeInTheDocument();
  });

  it("omits the company line when company is null", () => {
    render(<JobCard job={makeJob({ company: null })} />);
    expect(screen.queryByText("Wayfair")).not.toBeInTheDocument();
  });

  it("uses the singular 'session' label for a count of 1", () => {
    render(<JobCard job={makeJob({ session_count: 1 })} />);
    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  it("uses the plural 'sessions' label for a count other than 1", () => {
    render(<JobCard job={makeJob({ session_count: 0 })} />);
    expect(screen.getByText("0 sessions")).toBeInTheDocument();
  });
});
