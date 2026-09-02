import { describe, expect, it, vi } from "vitest";
import { requireToken } from "./require-token";

describe("requireToken", () => {
  it("returns the token when getToken resolves a value", async () => {
    const getToken = vi.fn().mockResolvedValue("abc123");
    await expect(requireToken(getToken)).resolves.toBe("abc123");
  });

  it("throws when getToken resolves null", async () => {
    const getToken = vi.fn().mockResolvedValue(null);
    await expect(requireToken(getToken)).rejects.toThrow("Not authenticated");
  });

  it("throws when getToken resolves an empty string", async () => {
    const getToken = vi.fn().mockResolvedValue("");
    await expect(requireToken(getToken)).rejects.toThrow("Not authenticated");
  });
});
