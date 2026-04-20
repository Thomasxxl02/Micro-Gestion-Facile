/**
 * Performance Monitoring — Web Vitals Tracking
 *
 * Captures LCP, FID/INP, CLS, FCP, TTFB metrics
 * Stores metrics in IndexedDB for offline access
 * Reports to analytics endpoint in production
 *
 * Targets (2026):
 * - LCP < 2.5s (Largest Contentful Paint)
 * - INP < 200ms (Interaction to Next Paint)
 * - CLS < 0.1 (Cumulative Layout Shift)
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
  navigationType?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface PerformanceReport {
  sessionId: string;
  userId?: string;
  metrics: PerformanceMetric[];
  exportedAt: string;
  pageLoadTime: number; // ms
  resourcesCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private pageLoadTime: number = 0;
  private isEnabled: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = globalThis.performance.now();
  }

  /**
   * Initialize performance monitoring
   */
  initialize(enableReporting: boolean = false): void {
    if (this.isEnabled) return;
    this.isEnabled = true;

    // Track LCP
    onLCP((metric: Metric) => {
      this.processMetric({
        name: "LCP",
        value: metric.value,
        rating: this.getLCPRating(metric.value),
      });
    });

    // Track INP (or FID for older browsers)
    onINP((metric: Metric) => {
      this.processMetric({
        name: "INP",
        value: metric.value,
        rating: this.getINPRating(metric.value),
      });
    });

    // Track CLS
    onCLS((metric: Metric) => {
      this.processMetric({
        name: "CLS",
        value: metric.value,
        rating: this.getCLSRating(metric.value),
      });
    });

    // Track FCP
    onFCP((metric: Metric) => {
      this.processMetric({
        name: "FCP",
        value: metric.value,
        rating: this.getFCPRating(metric.value),
      });
    });

    // Track TTFB
    onTTFB((metric: Metric) => {
      this.processMetric({
        name: "TTFB",
        value: metric.value,
        rating: this.getTTFBRating(metric.value),
      });
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn("✅ Performance monitoring initialized");
    }

    // Report metrics in production
    if (enableReporting && import.meta.env.PROD) {
      this.scheduleReporting();
    }
  }

  /**
   * Process and store metric
   */
  private processMetric(
    data: Omit<PerformanceMetric, "timestamp" | "url" | "userAgent">,
  ): void {
    const metric: PerformanceMetric = {
      ...data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(metric);

    // Log to console in development
    if (import.meta.env.DEV) {
      let status: string;
      if (metric.rating === "good") status = "✅";
      else if (metric.rating === "needs-improvement") status = "⚠️";
      else status = "❌";
      console.warn(
        `${status} ${metric.name}: ${metric.value.toFixed(2)}ms → ${metric.rating}`,
      );
    }

    // Store in IndexedDB
    void this.persistMetric(metric);
  }

  /**
   * Persist metric to IndexedDB
   */
  private async persistMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const db = await this.openMetricsDB();
      const tx = db.transaction("metrics", "readwrite");
      const store = tx.objectStore("metrics");
      store.add({
        ...metric,
        id: `${metric.name}-${metric.timestamp}`,
      });
    } catch (error) {
      // Silently fail — don't disrupt app if storage fails
      if (import.meta.env.DEV) {
        console.warn("⚠️ Failed to persist performance metric:", error);
      }
    }
  }

  /**
   * Open/create metrics IndexedDB
   */
  private openMetricsDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("PerformanceMetrics", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("metrics")) {
          db.createObjectStore("metrics", { keyPath: "id" });
        }
      };
    });
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Generate performance report
   */
  async generateReport(userId?: string): Promise<PerformanceReport> {
    const resources = globalThis.performance.getEntriesByType("resource");
    return {
      sessionId: this.sessionId,
      userId,
      metrics: this.metrics,
      exportedAt: new Date().toISOString(),
      pageLoadTime: globalThis.performance.now() - this.pageLoadTime,
      resourcesCount: resources.length,
    };
  }

  /**
   * Schedule reporting to backend (every 30s or on page unload)
   */
  private scheduleReporting(): void {
    // Report every 30 seconds
    window.setInterval(() => {
      void this.generateReport().then((report) => {
        if (report.metrics.length > 0) {
          void this.sendReport(report);
        }
      });
    }, 30000);

    // Report on page unload
    window.addEventListener("beforeunload", () => {
      void this.generateReport().then((report) => {
        if (report.metrics.length > 0) {
          navigator.sendBeacon("/api/metrics", JSON.stringify(report));
        }
      });
    });
  }

  /**
   * Send report to backend
   */
  private async sendReport(report: PerformanceReport): Promise<void> {
    try {
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
        // Best-effort delivery — failures are logged but don't affect app
      });
    } catch (error) {
      // Silently fail
      if (import.meta.env.DEV) {
        console.warn("⚠️ Failed to send performance report:", error);
      }
    }
  }

  /**
   * Rating functions based on Web Vitals thresholds
   */
  private getLCPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }

  private getINPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 200) return "good";
    if (value <= 500) return "needs-improvement";
    return "poor";
  }

  private getFIDRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 100) return "good";
    if (value <= 300) return "needs-improvement";
    return "poor";
  }

  private getCLSRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }

  private getFCPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 1800) return "good";
    if (value <= 3000) return "needs-improvement";
    return "poor";
  }

  private getTTFBRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 600) return "good";
    if (value <= 1200) return "needs-improvement";
    return "poor";
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = [];
  }

  /**
   * Get performance summary for dashboard
   */
  getSummary(): Record<string, { value: number; rating: string }> {
    const summary: Record<string, { value: number; rating: string }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { value: metric.value, rating: metric.rating };
      } else {
        // Keep the worst rating
        if (
          this.ratingScore(metric.rating) >
          this.ratingScore(summary[metric.name].rating)
        ) {
          summary[metric.name] = { value: metric.value, rating: metric.rating };
        }
      }
    }

    return summary;
  }

  /**
   * Score ratings for comparison
   */
  private ratingScore(rating: string): number {
    switch (rating) {
      case "good":
        return 0;
      case "needs-improvement":
        return 1;
      case "poor":
        return 2;
      default:
        return -1;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
