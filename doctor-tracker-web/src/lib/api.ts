export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  if (res.status === 204) {
    return {} as T;
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.message ?? "Something went wrong",
      json?.error?.details
    );
  }
  return json as T;
}

export function toQueryString(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  return sp.toString();
}
