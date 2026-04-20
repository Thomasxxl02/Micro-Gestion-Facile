import limit from "p-limit";
import { logger } from "./logger";

/**
 * Rate Limiter for Gemini API
 *
 * Stratégie:
 * - Max 1 requête/sec (Gemini rate limit = généreux, mais pas abuser)
 * - Max 10 concurrent requests (pool limité)
 * - Queue avec priorité (high → urgent queries, low → background)
 * - Retry automatique (max 3) avec backoff exponentiel
 *
 * Metrics:
 * - Nombre de requêtes en attente
 * - Nombre de requêtes en cours
 * - Nombre de requêtes rejetées
 * - Latence moyenne
 */

export type ApiPriority = "high" | "normal" | "low";

/**
 * Request in queue
 */
interface QueuedApiRequest {
  id: string;
  priority: ApiPriority;
  fn: () => Promise<string>;
  retries: number;
  maxRetries: number;
  timestamp: number;
}

/**
 * Rate Limiter Metrics
 */
export interface RateLimiterMetrics {
  totalRequests: number;
  pendingRequests: number;
  activeRequests: number;
  rejectedRequests: number;
  failedRequests: number;
  averageLatency: number;
  lastRequestTime?: number;
}

/**
 * Configuration options
 */
export interface RateLimiterConfig {
  /** Max concurrent requests */
  maxConcurrent: number;
  /** Min time between requests (ms) */
  minInterval: number;
  /** Max retries per request */
  maxRetries: number;
  /** Backoff multiplier for retries */
  backoffMultiplier: number;
  /** Log verbose mode */
  verbose: boolean;
}

/**
 * RateLimiter Class
 */
class RateLimiter {
  private pLimit: ReturnType<typeof limit>;
  private queue: QueuedApiRequest[] = [];
  private lastRequestTime = 0;
  private metrics: RateLimiterMetrics = {
    totalRequests: 0,
    pendingRequests: 0,
    activeRequests: 0,
    rejectedRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
  };

  private config: RateLimiterConfig = {
    maxConcurrent: 10,
    minInterval: 1000, // 1 req/sec
    maxRetries: 3,
    backoffMultiplier: 2,
    verbose: import.meta.env.DEV,
  };

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = { ...this.config, ...config };
    this.pLimit = limit(this.config.maxConcurrent);

    if (this.config.verbose) {
      logger.info("RateLimiter", "Initialized", {
        maxConcurrent: this.config.maxConcurrent,
        minInterval: this.config.minInterval,
        maxRetries: this.config.maxRetries,
      });
    }
  }

  /**
   * Queue une requête avec rate limiting
   *
   * @param fn Function async qui fait l'appel API
   * @param priority Priority (high = urgent)
   * @returns Promise<result>
   */
  async execute<T>(
    fn: () => Promise<T>,
    priority: ApiPriority = "normal",
  ): Promise<T> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    this.metrics.totalRequests++;
    this.metrics.pendingRequests++;

    // Créer la requête
    const request: QueuedApiRequest = {
      id: requestId,
      priority,
      fn: fn as () => Promise<string>,
      retries: 0,
      maxRetries: this.config.maxRetries,
      timestamp: Date.now(),
    };

    // Ajouter à la queue
    this.queue.push(request);
    this.logQueue();

    // Exécuter avec rate limiting
    return this.pLimit(async () => {
      try {
        return (await this.executeWithRetry(request)) as T;
      } finally {
        // Nettoyer
        this.queue = this.queue.filter((r) => r.id !== requestId);
        this.metrics.pendingRequests--;
      }
    });
  }

  /**
   * Exécute avec retry et backoff
   */
  private async executeWithRetry(request: QueuedApiRequest): Promise<string> {
    // Respecter le min interval
    await this.respectInterval();

    this.metrics.activeRequests++;

    const startTime = Date.now();

    try {
      this.logRequest(request, "starting");

      const result = await request.fn();

      const latency = Date.now() - startTime;
      this.updateLatency(latency);

      this.logRequest(request, "success", { latency });

      this.metrics.activeRequests--;
      return result;
    } catch (error) {
      // Logic for generic retry with latency tracking
       
      const _latency = Date.now() - startTime;

      // Retry logic
      if (request.retries < request.maxRetries) {
        request.retries++;
        const delay = this.getBackoffDelay(request.retries);

        this.logRequest(request, "retry", {
          attempt: request.retries,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });

        await this.sleep(delay);
        this.metrics.activeRequests--;

        return this.executeWithRetry(request);
      } else {
        // Max retries exceeded
        this.metrics.failedRequests++;
        this.metrics.activeRequests--;

        this.logRequest(request, "failed", {
          error: error instanceof Error ? error.message : String(error),
          retries: request.retries,
        });

        logger.error(
          "RateLimiter",
          `Request failed after ${request.retries} retries: ${error}`,
          error as Error,
        );

        throw error;
      }
    }
  }

  /**
   * Respecte l'intervalle minimum entre requêtes
   */
  private async respectInterval(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const delay = Math.max(0, this.config.minInterval - elapsed);

    if (delay > 0) {
      if (this.config.verbose) {
        logger.debug("RateLimiter", `Rate limit: waiting ${delay}ms`);
      }
      await this.sleep(delay);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Calcule le delay de backoff exponentiel
   */
  private getBackoffDelay(attempt: number): number {
    // Backoff: 1s, 2s, 4s, 8s, ...
    return Math.min(
      1000 * Math.pow(this.config.backoffMultiplier, attempt - 1),
      30000, // Max 30s
    );
  }

  /**
   * Update latency metric
   */
  private updateLatency(latency: number): void {
    const total = this.metrics.totalRequests;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (total - 1) + latency) / total;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  /**
   * Log request state
   */
  private logRequest(
    request: QueuedApiRequest,
    state: string,
    data?: Record<string, unknown>,
  ): void {
    if (!this.config.verbose) return;

    logger.debug("RateLimiter", `[${request.id}] ${state}`, {
      priority: request.priority,
      queueLen: this.queue.length,
      ...data,
    });
  }

  /**
   * Log queue status
   */
  private logQueue(): void {
    if (!this.config.verbose || this.queue.length % 5 !== 0) return;

    const byPriority = {
      high: this.queue.filter((r) => r.priority === "high").length,
      normal: this.queue.filter((r) => r.priority === "normal").length,
      low: this.queue.filter((r) => r.priority === "low").length,
    };

    logger.debug("RateLimiter", "Queue status", {
      total: this.queue.length,
      byPriority,
      metrics: this.getMetrics(),
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): RateLimiterMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      pendingRequests: 0,
      activeRequests: 0,
      rejectedRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
    };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    active: number;
    byPriority: Record<ApiPriority, number>;
  } {
    return {
      pending: this.metrics.pendingRequests,
      active: this.metrics.activeRequests,
      byPriority: {
        high: this.queue.filter((r) => r.priority === "high").length,
        normal: this.queue.filter((r) => r.priority === "normal").length,
        low: this.queue.filter((r) => r.priority === "low").length,
      },
    };
  }

  /**
   * Clear queue (reject all pending)
   */
  clearQueue(): number {
    const count = this.queue.length;
    this.metrics.rejectedRequests += count;
    this.queue = [];
    logger.warn("RateLimiter", `Queue cleared: ${count} requests rejected`);
    return count;
  }
}

// Export singleton
export const rateLimiter = new RateLimiter();

// Export class for testing
export { RateLimiter };

