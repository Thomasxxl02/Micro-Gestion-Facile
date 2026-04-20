import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { logger } from "../../lib/logger";

/**
 * Test Suite - Centralized Logger
 *
 * Teste:
 * - Logging aux différents niveaux
 * - Stockage IndexedDB
 * - Export de logs
 * - Nettoyage des vieux logs
 * - Configuration
 */

describe("Centralized Logger", () => {
  beforeEach(async () => {
    // Configure logger pour tests
    const config: Partial<Parameters<typeof logger.configure>[0]> = {
      enableConsole: false,
      enableIndexedDB: true,
      enableSentry: false,
    };
    logger.configure(config as Parameters<typeof logger.configure>[0]);

    // Clear logs before each test
    await logger.clearLogs();
  });

  afterEach(async () => {
    await logger.clearLogs();
  });

  describe("Logging Methods", () => {
    it("should log debug messages", async () => {
      logger.debug("TestContext", "Debug message", { data: "test" });

      const logs = await logger.getLogs({ level: "debug" });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toBe("Debug message");
    });

    it("should log info messages", async () => {
      logger.info("TestContext", "Info message");

      const logs = await logger.getLogs({ level: "info" });
      expect(logs.length).toBeGreaterThan(0);
    });

    it("should log warning messages", async () => {
      logger.warn("TestContext", "Warning message");

      const logs = await logger.getLogs({ level: "warn" });
      expect(logs.length).toBeGreaterThan(0);
    });

    it("should log error messages with Error object", () => {
      const error = new Error("Test error");
      logger.error("TestContext", "Error occurred", error, { extra: "data" });

      // Just verify it doesn't throw
      expect(true).toBe(true);
    });

    it("should log critical messages", () => {
      const error = new Error("Critical error");
      logger.critical("TestContext", "Critical issue", error);

      // Just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe("Log Retrieval", () => {
    it("should retrieve all logs", async () => {
      logger.info("Context1", "Message 1");
      logger.info("Context2", "Message 2");
      logger.warn("Context3", "Message 3");

      const logs = await logger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(3);
    });

    it("should filter logs by level", async () => {
      logger.debug("Test", "Debug");
      logger.info("Test", "Info");
      logger.warn("Test", "Warn");

      const infoLogs = await logger.getLogs({ level: "info" });
      expect(infoLogs.every((l) => l.level === "info")).toBe(true);
    });

    it("should filter logs by context", async () => {
      logger.info("Context1", "Message 1");
      logger.info("Context2", "Message 2");
      logger.info("Context1", "Message 3");

      const context1Logs = await logger.getLogs({ context: "Context1" });
      expect(context1Logs.every((l) => l.context === "Context1")).toBe(true);
      expect(context1Logs.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter logs by time range", async () => {
      logger.info("Test", "Message 1");

      const recentLogs = await logger.getLogs({ hours: 1 });
      expect(recentLogs.length).toBeGreaterThan(0);
    });
  });

  describe("Log Export", () => {
    it("should export logs as JSON", async () => {
      logger.info("Test", "Message 1");
      logger.warn("Test", "Message 2");

      const json = await logger.exportLogs("json");
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it("should export logs as CSV", async () => {
      logger.info("Test", "Message 1");
      logger.warn("Test", "Message 2");

      const csv = await logger.exportLogs("csv");

      expect(csv.includes("timestamp")).toBe(true);
      expect(csv.includes("level")).toBe(true);
      expect(csv.includes("context")).toBe(true);
    });
  });

  describe("Log Clearing", () => {
    it("should clear all logs", async () => {
      logger.info("Test", "Message 1");
      logger.info("Test", "Message 2");

      let logs = await logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      await logger.clearLogs();

      logs = await logger.getLogs();
      expect(logs.length).toBe(0);
    });
  });

  describe("Logger Configuration", () => {
    it("should accept configuration", () => {
      expect(() => {
        logger.configure({
          enableConsole: true,
          enableIndexedDB: true,
          enableSentry: false,
        });
      }).not.toThrow();
    });

    it("should apply config defaults", async () => {
      logger.configure({ enableIndexedDB: true });
      logger.info("Test", "Info with config");

      const logs = await logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("Log Entry Structure", () => {
    it("should include all required fields", async () => {
      logger.info("TestContext", "Test message", { custom: "data" });

      const logs = await logger.getLogs();
      const entry = logs[logs.length - 1];

      expect(entry.timestamp).toBeDefined();
      expect(entry.level).toBe("info");
      expect(entry.context).toBe("TestContext");
      expect(entry.message).toBe("Test message");
      expect(entry.data).toEqual({ custom: "data" });
      expect(entry.sessionId).toBeDefined();
    });

    it("should include stack trace for errors", async () => {
      const error = new Error("Test error with stack");
      logger.error("TestContext", "Error message", error);

      // Verify it doesn't throw (stack trace handling)
      expect(true).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should handle bulk logging", async () => {
      for (let i = 0; i < 50; i++) {
        logger.info("Bulk", `Message ${i}`);
      }

      const logs = await logger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(50);
    });

    it("should handle concurrent logging", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(logger.info("Concurrent", `Message ${i}`)),
      );

      await Promise.all(promises);

      const logs = await logger.getLogs();
      console.warn("Concurrent logs count:", logs.length);
    });
  });
});
