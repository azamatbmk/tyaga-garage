type ApiErrorBody = {
  message?: string | string[];
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const message = Array.isArray(body.message)
      ? body.message.join(". ")
      : body.message;
    throw new Error(message || "Не удалось выполнить запрос");
  }

  return response.json() as Promise<T>;
}
