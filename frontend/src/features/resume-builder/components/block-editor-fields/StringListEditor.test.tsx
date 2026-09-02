import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StringListEditor } from "./StringListEditor";

describe("StringListEditor", () => {
  it("renders one input per value with the given placeholder", () => {
    render(
      <StringListEditor
        label="Technologies"
        values={["Python", "dbt"]}
        onChange={vi.fn()}
        placeholder="Add a technology"
      />,
    );
    const inputs = screen.getAllByPlaceholderText("Add a technology");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue("Python");
    expect(inputs[1]).toHaveValue("dbt");
  });

  it("calls onChange with the edited value in place when a row is typed into", () => {
    const onChange = vi.fn();
    render(<StringListEditor label="Technologies" values={["Python", "dbt"]} onChange={onChange} />);

    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Rust" } });

    expect(onChange).toHaveBeenCalledWith(["Rust", "dbt"]);
  });

  it("calls onChange with the row removed when its × button is clicked", () => {
    const onChange = vi.fn();
    render(<StringListEditor label="Technologies" values={["Python", "dbt"]} onChange={onChange} />);

    fireEvent.click(screen.getAllByRole("button", { name: "×" })[0]);

    expect(onChange).toHaveBeenCalledWith(["dbt"]);
  });

  it("calls onChange with a new empty row appended when 'Add' is clicked", () => {
    const onChange = vi.fn();
    render(<StringListEditor label="Technologies" values={["Python"]} onChange={onChange} />);

    fireEvent.click(screen.getByText("+ Add"));

    expect(onChange).toHaveBeenCalledWith(["Python", ""]);
  });
});
