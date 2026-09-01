import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavCta } from "./NavCta";

describe("NavCta", () => {
  it("shows sign-in and sign-up links when signed out", () => {
    render(<NavCta signedIn={false} />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/sign-up");
  });

  it("shows a single link to the dashboard when signed in", () => {
    render(<NavCta signedIn={true} />);
    expect(screen.getByRole("link", { name: "Go to Resume Builder" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });
});
