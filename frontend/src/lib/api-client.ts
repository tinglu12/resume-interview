import { config } from "@/config";

type RequestOptions = Omit<RequestInit, "body"> & {
  token?: string;
  body?: unknown;
  formData?: FormData;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, body, formData, ...rest } = options;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${config.apiUrl}${path}`, {
    ...rest,
    headers: { ...headers, ...rest.headers },
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

async function requestNoContent(path: string, options: RequestOptions = {}): Promise<void> {
  const { token, body, formData, ...rest } = options;
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...rest,
    headers: { ...headers, ...rest.headers },
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "Request failed");
  }
}

export const apiClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, token?: string, body?: unknown) =>
    request<T>(path, { method: "POST", token, body }),
  postForm: <T>(path: string, token: string, formData: FormData) =>
    request<T>(path, { method: "POST", token, formData }),
  patch: <T>(path: string, token: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", token, body }),
  delete: (path: string, token: string) =>
    requestNoContent(path, { method: "DELETE", token }),
};
