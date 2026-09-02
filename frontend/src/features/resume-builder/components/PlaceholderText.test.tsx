import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceholderText } from "./PlaceholderText";

describe("PlaceholderText", () => {
  it("renders plain text unchanged when there are no placeholders", () => {
    render(<PlaceholderText text="Owned delivery across daily jobs." />);
    expect(screen.getByText("Owned delivery across daily jobs.")).toBeInTheDocument();
  });

  it("renders a single [X] token specially", () => {
    render(<PlaceholderText text="Cut runtime by [X]%." />);
    const marker = screen.getByText("[X]");
    expect(marker.tagName).toBe("SPAN");
    expect(marker.className).toContain("font-mono");
  });

  it("renders every occurrence when multiple placeholders are present", () => {
    render(<PlaceholderText text="Rebuilt the pipeline, cutting runtime from [X]h to [X]m." />);
    expect(screen.getAllByText("[X]")).toHaveLength(2);
  });
});
