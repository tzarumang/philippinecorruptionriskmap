/**
 * HTTP access for connectors.
 *
 * FR-4 fixes the policy: 3 attempts with exponential backoff, and a timeout
 * per attempt. Every source is public and unauthenticated, so there are no
 * credentials to handle here — if that ever changes, it changes behind this
 * function rather than in each connector.
 */

export interface FetchOptions {
  attempts?: number;
  timeoutMs?: number;
  /** Called before each retry, for progress reporting. */
  onRetry?: (attempt: number, error: Error) => void;
}

const USER_AGENT =
  'PCRM-ingestion/0.1 (Philippine Corruption Risk Map; public-interest research)';

export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { attempts = 3, timeoutMs = 60_000, onRetry } = options;

  let lastError: Error = new Error(`No attempt was made for ${url}`);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { accept: 'application/json', 'user-agent': USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < attempts) {
        onRetry?.(attempt, lastError);
        // 1s, 2s, 4s… — enough to ride out a slow upstream without hammering it.
        await delay(2 ** (attempt - 1) * 1000);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `Failed after ${attempts} attempts: ${url} — ${lastError.message}`,
    { cause: lastError },
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
