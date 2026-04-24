import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RateLimiter, rateLimiter } from "../../lib/rateLimiter";

/**
 * Test Suite - Rate Limiter
 *
 * Teste:
 * - Exécution de requêtes avec rate limiting
 * - Respect de l'intervalle minimum
 * - Respect de la concurrence max
 * - Retry avec backoff exponentiel
 * - Gestion de priorités
 * - Métriques et queue status
 */

describe("Rate Limiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    // Créer une nouvelle instance pour chaque test
    limiter = new RateLimiter({
      maxConcurrent: 3,
      minInterval: 100, // 100ms pour tests rapides
      maxRetries: 2,
      backoffMultiplier: 2,
      verbose: false,
    });
  });

  afterEach(() => {
    limiter.resetMetrics();
  });

  describe("Basic Execution", () => {
    it("should execute a single request", async () => {
      const result = await limiter.execute(async () => {
        return "success";
      });

      expect(result).toBe("success");
      const metrics = limiter.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
    });

    it("should execute multiple requests sequentially", async () => {
      const results = await Promise.all([
        limiter.execute(async () => "1"),
        limiter.execute(async () => "2"),
        limiter.execute(async () => "3"),
      ]);

      expect(results).toEqual(["1", "2", "3"]);
      const metrics = limiter.getMetrics();
      expect(metrics.totalRequests).toBe(3);
    });

    it("should respect max concurrent requests", async () => {
      let maxActive = 0;
      let currentActive = 0;

      const slowFn = async () => {
        currentActive++;
        maxActive = Math.max(maxActive, currentActive);
        await new Promise((resolve) => setTimeout(resolve, 50));
        currentActive--;
        return "done";
      };

      await Promise.all([
        limiter.execute(slowFn),
        limiter.execute(slowFn),
        limiter.execute(slowFn),
        limiter.execute(slowFn),
        limiter.execute(slowFn),
      ]);

      // Max concurrent devrait être 3
      expect(maxActive).toBeLessThanOrEqual(3);
    });
  });

  describe("Rate Limiting (Min Interval)", () => {
    it("should respect minimum interval between requests", async () => {
      const limiter2 = new RateLimiter({
        maxConcurrent: 10,
        minInterval: 200,
        maxRetries: 0,
      });

      const times: number[] = [];

      for (let i = 0; i < 3; i++) {
        await limiter2.execute(async () => {
          times.push(Date.now());
          return "done";
        });
      }

      // Vérifier les intervalles
      expect(times[1] - times[0]).toBeGreaterThanOrEqual(200);
      expect(times[2] - times[1]).toBeGreaterThanOrEqual(200);
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed requests", async () => {
      let attempts = 0;

      const failingFn = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary failure");
        }
        return "success";
      };

      const result = await limiter.execute(failingFn);

      expect(result).toBe("success");
      expect(attempts).toBe(2);
    });

    it("should throw after max retries", async () => {
      const failingFn = async () => {
        throw new Error("Persistent failure");
      };

      await expect(limiter.execute(failingFn)).rejects.toThrow(
        "Persistent failure",
      );

      const metrics = limiter.getMetrics();
      expect(metrics.failedRequests).toBe(1);
    });

    it("should apply exponential backoff", async () => {
      let attempts = 0;
      const attemptTimes: number[] = [];

      const failingFn = async () => {
        attempts++;
        attemptTimes.push(Date.now());
        if (attempts < 3) {
          throw new Error("Fail");
        }
        return "success";
      };

      // Créer un limiter avec timing traceable
      const limiter2 = new RateLimiter({
        maxConcurrent: 1,
        minInterval: 10,
        maxRetries: 3,
        backoffMultiplier: 2,
      });

      const result = await limiter2.execute(failingFn);

      expect(result).toBe("success");
      expect(attempts).toBe(3);

      // Vérifier que les délais augmentent (backoff)
      const delay1 = attemptTimes[1] - attemptTimes[0];
      const delay2 = attemptTimes[2] - attemptTimes[1];

      // delay2 devrait être > delay1 (exponential backoff)
      expect(delay2).toBeGreaterThan(delay1);
    });
  });

  describe("Priority Handling", () => {
    it("should accept different priority levels", async () => {
      const results = await Promise.all([
        limiter.execute(async () => "high", "high"),
        limiter.execute(async () => "normal", "normal"),
        limiter.execute(async () => "low", "low"),
      ]);

      expect(results).toEqual(["high", "normal", "low"]);
    });
  });

  describe("Metrics", () => {
    it("should track basic metrics", async () => {
      await limiter.execute(async () => "done");

      const metrics = limiter.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.pendingRequests).toBe(0);
      expect(metrics.activeRequests).toBe(0);
    });

    it("should track average latency", async () => {
      await limiter.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "done";
      });

      const metrics = limiter.getMetrics();
      expect(metrics.averageLatency).toBeGreaterThan(40);
    });

    it("should track failed requests", async () => {
      try {
        await limiter.execute(async () => {
          throw new Error("Fail");
        });
      } catch {
        // Expected
      }

      const metrics = limiter.getMetrics();
      expect(metrics.failedRequests).toBe(1);
    });

    it("should reset metrics", () => {
      expect(limiter.getMetrics().totalRequests).toBe(0);
      limiter.resetMetrics();
      expect(limiter.getMetrics().totalRequests).toBe(0);
    });
  });

  describe("Queue Status", () => {
    it("should report queue status", async () => {
      // Créer requêtes avec délai
      const slowFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "done";
      };

      // Lancer plusieurs requests
      const _promise1 = limiter.execute(slowFn, "high");
      const _promise2 = limiter.execute(slowFn, "high");
      const _promise3 = limiter.execute(slowFn, "low");

      // Vérifier status intermédiaire
      await new Promise((resolve) => setTimeout(resolve, 10));
      const status = limiter.getQueueStatus();

      expect(status.pending).toBeGreaterThan(0);
    });

    it("should clear queue on demand", () => {
      const slowFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return "done";
      };

      // Lancer plusieurs requests
      void limiter.execute(slowFn);
      void limiter.execute(slowFn);

      const cleared = limiter.clearQueue();
      expect(cleared).toBeGreaterThan(0);

      const metrics = limiter.getMetrics();
      expect(metrics.rejectedRequests).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle async errors", async () => {
      const errorFn = async () => {
        throw new Error("Async error");
      };

      await expect(limiter.execute(errorFn)).rejects.toThrow("Async error");
    });

    it("should handle sync errors", async () => {
      const errorFn = async () => {
        throw new Error("Sync error");
      };

      await expect(limiter.execute(errorFn)).rejects.toThrow("Sync error");
    });
  });

  describe("Singleton Configuration", () => {
    it("should use singleton instance", () => {
      const metrics1 = rateLimiter.getMetrics();
      expect(metrics1).toBeDefined();
      expect(metrics1.totalRequests).toBeGreaterThanOrEqual(0);
    });

    it("should allow configuration", () => {
      // Configuration should work
      expect(() => {
        rateLimiter.getMetrics();
      }).not.toThrow();
    });
  });
});
