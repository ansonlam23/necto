/**
 * Retry logic with exponential backoff for 0G Storage operations
 */

/** Retry configuration options */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs: number;
}

/** Default retry configuration */
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Check if an error is retryable (network, timeout, rate limit)
 * Don't retry auth errors or invalid input
 */
export function isRetryableError(error: unknown): boolean {
  if (error === null || error === undefined) {
    return false;
  }

  const errorMessage = String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors - retryable
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('etimedout') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('econnreset') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('socket') ||
    lowerMessage.includes('abort')
  ) {
    return true;
  }

  // Rate limiting - retryable
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests') ||
    lowerMessage.includes('429')
  ) {
    return true;
  }

  // Server errors - retryable
  if (
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('504')
  ) {
    return true;
  }

  // Non-retryable errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('404') ||
    lowerMessage.includes('auth')
  ) {
    return false;
  }

  // Default to retryable for unknown errors
  return true;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 * delay = baseDelay * 2^attempt + random(0, 1000)
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

  // Add jitter (0-1000ms) to prevent thundering herd
  const jitter = Math.floor(Math.random() * 1000);

  // Cap at max delay
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Wrap an async function with retry logic
 * @param fn - The function to retry
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...defaultRetryConfig, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Attempt the operation
      const result = await fn();

      // If successful, log success after retry
      if (attempt > 0) {
        console.log(`[withRetry] Succeeded after ${attempt} retry(s)`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if this is the last attempt
      if (attempt === retryConfig.maxRetries) {
        console.error(
          `[withRetry] All ${retryConfig.maxRetries} retries exhausted. Last error:`,
          error
        );
        throw error;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.log('[withRetry] Non-retryable error encountered, giving up:', error);
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        retryConfig.baseDelayMs,
        retryConfig.maxDelayMs
      );

      console.log(
        `[withRetry] Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed. ` +
          `Retrying in ${delay}ms...`
      );

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}
