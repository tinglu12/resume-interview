import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./api-client";

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => body,
  } as Response;
}

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a GET with the bearer token and no body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "1" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiClient.get<{ id: string }>("/resumes/1", "tok");

    expect(result).toEqual({ id: "1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/resumes/1");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.body).toBeUndefined();
  });

  it("sends a POST with a JSON body and Content-Type header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.post("/resumes", "tok", { title: "Hello" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "Hello" }));
  });

  it("sends form data as-is without a Content-Type header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const form = new FormData();
    form.append("resume", "file-contents");
    await apiClient.postForm("/resumes", "tok", form);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("throws the server-provided detail message on a non-OK response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ detail: "Resume not found" }, { ok: false, status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.get("/resumes/missing", "tok")).rejects.toThrow("Resume not found");
  });

  it("falls back to the status text when the error body isn't valid JSON", async () => {
    const response = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response;
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.get("/resumes/1", "tok")).rejects.toThrow("Internal Server Error");
  });

  it("resolves with no return value on delete", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.delete("/resumes/1", "tok")).resolves.toBeUndefined();
  });
});
