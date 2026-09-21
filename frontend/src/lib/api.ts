export const API_URL: string = (
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8000"
).replace(/\/$/, "");

export type Student = {
  id: string;
  name: string;
  document: string;
  created_at: string;
};

export type Admin = {
  id: string;
  username: string;
  created_at: string;
};

export type VerifyResult = {
  access_granted: boolean;
  user: Student | null;
  distance: number | null;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  token?: string | null;
  json?: unknown;
  body?: FormData;
  headers?: Record<string, string>;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", token, json, body, headers = {} } = options;
  const finalHeaders: Record<string, string> = { ...headers };
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  if (json !== undefined) finalHeaders["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: json !== undefined ? JSON.stringify(json) : (body ?? null),
    });
  } catch {
    throw new ApiError(0, `Não foi possível falar com o servidor em ${API_URL}.`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Erro ${response.status}`;
    throw new ApiError(response.status, detail);
  }

  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/auth/admin/login", {
      method: "POST",
      json: { username, password },
    }),

  verify: (photo: Blob) => {
    const form = new FormData();
    form.append("photo", photo, "shot.jpg");
    return request<VerifyResult>("/auth/verify", { method: "POST", body: form });
  },

  listStudents: (token: string) => request<Student[]>("/users", { token }),

  createStudent: (token: string, name: string, document: string, photo: Blob) => {
    const form = new FormData();
    form.append("name", name);
    form.append("document", document);
    form.append("photo", photo, "shot.jpg");
    return request<Student>("/users", { method: "POST", token, body: form });
  },

  updateStudent: (
    token: string,
    id: string,
    fields: { name?: string; document?: string; photo?: Blob | null },
  ) => {
    const form = new FormData();
    if (fields.name !== undefined) form.append("name", fields.name);
    if (fields.document !== undefined) form.append("document", fields.document);
    if (fields.photo) form.append("photo", fields.photo, "shot.jpg");
    return request<Student>(`/users/${id}`, { method: "PATCH", token, body: form });
  },

  deleteStudent: (token: string, id: string) =>
    request<void>(`/users/${id}`, { method: "DELETE", token }),

  listAdmins: (token: string) => request<Admin[]>("/admins", { token }),

  createAdmin: (token: string, username: string, password: string) =>
    request<Admin>("/admins", { method: "POST", token, json: { username, password } }),

  createFirstAdmin: (setupKey: string, username: string, password: string) =>
    request<Admin>("/admins", {
      method: "POST",
      json: { username, password },
      headers: { "X-Setup-Key": setupKey },
    }),

  updateAdmin: (token: string, id: string, fields: { username?: string; password?: string }) =>
    request<Admin>(`/admins/${id}`, { method: "PATCH", token, json: fields }),

  deleteAdmin: (token: string, id: string) =>
    request<void>(`/admins/${id}`, { method: "DELETE", token }),
};
