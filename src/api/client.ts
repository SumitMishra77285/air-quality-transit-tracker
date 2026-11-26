import type { ApiError } from '../types';

export class RequestError extends Error {
  public readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'RequestError';
    this.apiError = apiError;
  }
}

export async function fetchJson<T>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 10000, ...init } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new RequestError({
        code: 'HTTP_ERROR',
        status: response.status,
        message: `Request failed with status ${String(response.status)} (${response.statusText || 'Unknown error'})`,
      });
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new RequestError({
        code: 'PARSE_ERROR',
        message: 'Received an invalid JSON response from the server.',
      });
    }
  } catch (err) {
    if (err instanceof RequestError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new RequestError({
        code: 'TIMEOUT',
        message: 'The request timed out. Check your connection and try again.',
      });
    }
    throw new RequestError({
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Network error occurred.',
    });
  } finally {
    window.clearTimeout(timer);
  }
}
