/**
 * Query Helpers - Timeout and Retry Utilities for Supabase Queries
 *
 * Prevents bootloops caused by hanging Supabase queries by providing:
 * 1. Timeout wrapper with configurable duration
 * 2. Auto-retry with exponential backoff
 * 3. Detailed logging for production debugging
 */

export interface QueryError {
  message: string;
  code?: string;
  isTimeout?: boolean;
  retryAttempt?: number;
}

/**
 * Wraps a promise with a timeout to prevent hanging queries
 *
 * @param promise - The promise to wrap (usually a Supabase query)
 * @param timeoutMs - Timeout in milliseconds (default: 8000ms / 8s)
 * @param operationName - Name for logging purposes
 * @returns The promise result or throws timeout error
 *
 * @example
 * const data = await withQueryTimeout(
 *   supabase.from('patients').select('*'),
 *   8000,
 *   'loadPatients'
 * );
 */
export async function withQueryTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 8000,
  operationName = 'Query'
): Promise<T> {
  const startTime = Date.now();

  return new Promise<T>((resolve, reject) => {
    // Timeout timer
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.error(`[QueryTimeout] ${operationName} timed out after ${elapsed}ms (limit: ${timeoutMs}ms)`);

      const error: QueryError = {
        message: `${operationName} timeout after ${timeoutMs}ms`,
        isTimeout: true
      };
      reject(error);
    }, timeoutMs);

    // Execute promise
    Promise.resolve(promise)
      .then((result) => {
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;
        console.log(`[QuerySuccess] ${operationName} completed in ${elapsed}ms`);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;
        console.error(`[QueryError] ${operationName} failed after ${elapsed}ms:`, error);
        reject(error);
      });
  });
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry (should return a Promise)
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @param operationName - Name for logging purposes
 * @returns The function result or throws after all retries exhausted
 *
 * Backoff schedule:
 * - Attempt 1: immediate
 * - Attempt 2: wait 1000ms
 * - Attempt 3: wait 2000ms
 * - Attempt 4: wait 4000ms
 *
 * @example
 * const data = await withRetry(
 *   () => withQueryTimeout(supabase.from('patients').select('*'), 8000, 'loadPatients'),
 *   2,
 *   'loadPatients'
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  operationName = 'Operation'
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`[Retry] ${operationName} - Attempt ${attempt + 1}/${maxRetries + 1} after ${delayMs}ms delay`);
        await sleep(delayMs);
      } else {
        console.log(`[Query] ${operationName} - Attempt ${attempt + 1}/${maxRetries + 1}`);
      }

      const result = await fn();

      if (attempt > 0) {
        console.log(`[RetrySuccess] ${operationName} succeeded on attempt ${attempt + 1}`);
      }

      return result;

    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries;

      console.error(
        `[RetryError] ${operationName} failed on attempt ${attempt + 1}/${maxRetries + 1}:`,
        error?.message || error
      );

      // If this is the last attempt, throw the error
      if (isLastAttempt) {
        console.error(`[RetryExhausted] ${operationName} failed after ${maxRetries + 1} attempts`);

        // Enrich error with retry info
        const enrichedError: QueryError = {
          message: error?.message || 'Query failed after retries',
          code: error?.code,
          isTimeout: error?.isTimeout,
          retryAttempt: attempt + 1
        };
        throw enrichedError;
      }
    }
  }

  // This should never happen, but TypeScript needs it
  throw lastError;
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Combines timeout + retry for robust query execution
 *
 * @param queryFn - Function that returns a Supabase query promise
 * @param options - Configuration options
 * @returns The query result
 *
 * @example
 * const { data, error } = await robustQuery(
 *   () => supabase.from('patients').select('*'),
 *   { timeout: 8000, retries: 2, operationName: 'loadPatients' }
 * );
 */
export async function robustQuery<T>(
  queryFn: () => Promise<T> | PromiseLike<T>,
  options: {
    timeout?: number;
    retries?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    timeout = 8000,
    retries = 2,
    operationName = 'Query'
  } = options;

  return withRetry(
    () => withQueryTimeout(Promise.resolve(queryFn()), timeout, operationName),
    retries,
    operationName
  );
}

/**
 * Format error for user display
 */
export function formatQueryError(error: any): string {
  if (error?.isTimeout) {
    return 'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.';
  }

  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
  }

  if (error?.code === 'PGRST116') {
    return 'No se encontraron datos.';
  }

  return error?.message || 'Error desconocido. Intenta nuevamente.';
}
