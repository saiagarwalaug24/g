/**
 * Get the Groq API key stored in localStorage by the Settings page.
 */
export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('echolens-groq-key');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Build headers that include the Groq API key from localStorage.
 */
export function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const key = getStoredApiKey();
  if (key) {
    headers['x-groq-key'] = key;
  }
  return headers;
}

/**
 * Make a JSON POST request with API key header included.
 */
export async function apiPost(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
}

/**
 * Make a FormData POST request with API key header included.
 */
export async function apiPostForm(url: string, formData: FormData): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: apiHeaders(),
    body: formData,
  });
}
