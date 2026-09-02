import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockGenerateBlockContent } from "./mockGenerateBlockContent";

describe("mockGenerateBlockContent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("streams a summary word by word and completes with the full text", () => {
    const onToken = vi.fn();
    const onComplete = vi.fn();

    mockGenerateBlockContent("summary", "concise", onToken, onComplete);

    vi.runAllTimers();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const [patch] = onComplete.mock.calls[0];
    expect(patch.text).toMatch(/^Data analyst/);
    // last onToken call should equal the completed text
    const lastTokenCall = onToken.mock.calls.at(-1)?.[0];
    expect(lastTokenCall).toEqual([patch.text]);
    expect(onToken.mock.calls.length).toBeGreaterThan(1);
  });

  it("streams work-experience bullets one at a time and completes with all bullets", () => {
    const onToken = vi.fn();
    const onComplete = vi.fn();

    mockGenerateBlockContent("work_experience", "impact", onToken, onComplete);

    vi.runAllTimers();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const [patch] = onComplete.mock.calls[0];
    expect(patch.bullets).toHaveLength(3);
    // final onToken call should show all three completed bullets
    const lastTokenCall = onToken.mock.calls.at(-1)?.[0];
    expect(lastTokenCall).toEqual(patch.bullets);
  });

  it("stops emitting further tokens once cancelled", () => {
    const onToken = vi.fn();
    const onComplete = vi.fn();

    const { cancel } = mockGenerateBlockContent("summary", "concise", onToken, onComplete);

    vi.advanceTimersByTime(45);
    const callsBeforeCancel = onToken.mock.calls.length;
    expect(callsBeforeCancel).toBeGreaterThan(0);

    cancel();
    vi.runAllTimers();

    expect(onToken.mock.calls.length).toBe(callsBeforeCancel);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("never streams or completes for a block type with no mock bullets", () => {
    const onToken = vi.fn();
    const onComplete = vi.fn();

    mockGenerateBlockContent("custom", "concise", onToken, onComplete);

    vi.runAllTimers();

    expect(onToken).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
