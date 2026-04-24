/**
 * Centralized Logger
 *
 * Gère tous les logs de l'application:
 * - Logs console (dev)
 * - Logs stockés (IndexedDB)
 * - Logs versés à Sentry (prod)
 *
 * Niveaux: DEBUG, INFO, WARN, ERROR, CRITICAL
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

/**
 * Log Entry Structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string; // ex: "InvoiceManager", "geminiService"
  message: string;
  data?: Record<string, unknown>;
  stack?: string; // Stack trace si error
  sessionId: string;
}

/**
 * Logger Configuration
 */
export interface LoggerConfig {
  enableConsole: boolean;
  enableIndexedDB: boolean;
  enableSentry: boolean;
  maxLogsInDB: number;
  minLevelForDB: LogLevel;
  minLevelForSentry: LogLevel;
}

// Configuration par défaut
const DEFAULT_CONFIG: LoggerConfig = {
  enableConsole: console !== undefined,
  enableIndexedDB: typeof indexedDB !== "undefined",
  enableSentry: false, // Activer en prod avec SENTRY_DSN
  maxLogsInDB: 500,
  minLevelForDB: "debug",
  minLevelForSentry: "error",
};

// Session ID unique pour chaque session utilisateur
const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Store local pour la config
let currentConfig: LoggerConfig = { ...DEFAULT_CONFIG };

// Ordre de sévérité
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

/**
 * Logger Class
 */
class CentralizedLogger {
  private readonly dbName = "micro-gestion-logs";
  private readonly storeName = "logs";

  /**
   * Ouvre (ou crée) la base IndexedDB avec le bon objectStore.
   * Partagé par logToIndexedDB, getLogs et clearLogs.
   */
  private _getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("level", "level", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Configure le logger
   */
  configure(config: Partial<LoggerConfig>): void {
    currentConfig = { ...currentConfig, ...config };
    if (import.meta.env.DEV) {
      console.warn("[Logger] Configuration mise à jour:", currentConfig);
    }
  }

  /**
   * Log une entrée
   */
  private async log(
    level: LogLevel,
    context: string,
    message: string,
    data?: Record<string, unknown>,
    stack?: string,
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      stack,
      sessionId: SESSION_ID,
    };

    // Console output
    if (currentConfig.enableConsole) {
      this.logToConsole(entry);
    }

    // IndexedDB storage
    if (
      currentConfig.enableIndexedDB &&
      LOG_LEVELS[level] >= LOG_LEVELS[currentConfig.minLevelForDB]
    ) {
      await this.logToIndexedDB(entry);
    }

    // Sentry integration
    if (
      currentConfig.enableSentry &&
      LOG_LEVELS[level] >= LOG_LEVELS[currentConfig.minLevelForSentry]
    ) {
      this.logToSentry(entry);
    }
  }

  /**
   * Log to console with colors
   */
  private logToConsole(entry: LogEntry): void {
    const colors: Record<LogLevel, string> = {
      debug: "#999",
      info: "#0066cc",
      warn: "#ff9900",
      error: "#cc0000",
      critical: "#990000",
    };

    const prefix = `[${entry.context}]`;
    const timestamp = entry.timestamp.split("T")[1].slice(0, 8);

    if (entry.level === "error" || entry.level === "critical") {
      console.error(
        `%c${timestamp} ${prefix} ${entry.level.toUpperCase()}: ${entry.message}`,
        `color: ${colors[entry.level]}; font-weight: bold;`,
        entry.data ?? entry.stack,
      );
    } else if (entry.level === "warn") {
      console.warn(
        `%c${timestamp} ${prefix} ${entry.level.toUpperCase()}: ${entry.message}`,
        `color: ${colors[entry.level]}; font-weight: bold;`,
        entry.data,
      );
    } else {
      console.warn(
        `%c${timestamp} ${prefix} ${entry.level.toUpperCase()}: ${entry.message}`,
        `color: ${colors[entry.level]};`,
        entry.data,
      );
    }
  }

  /**
   * Log to IndexedDB
   */
  private async logToIndexedDB(entry: LogEntry): Promise<void> {
    try {
      const db = await this._getDB();
      const transaction = db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);

      // Ajouter la log
      store.add(entry);

      // Nettoyer si trop de logs
      this.cleanupOldLogs(db);
    } catch (_) {
      // Silent fail - pas de log récursive
    }
  }

  /**
   * Nettoie les vieux logs si DB trop grande
   */
  private cleanupOldLogs(db: IDBDatabase): void {
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;

      if (count > currentConfig.maxLogsInDB) {
        // Supprimer les plus vieilles
        const index = store.index("timestamp");
        const deleteRequest = index.openCursor();
        let deleted = 0;
        const toDelete = count - currentConfig.maxLogsInDB;

        deleteRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && deleted < toDelete) {
            cursor.delete();
            deleted++;
            cursor.continue();
          }
        };
      }
    };
  }

  /**
   * Log to Sentry
   */
  private logToSentry(entry: LogEntry): void {
    // Will be implemented with Sentry SDK in production
    // For now, just log
    const window_ = typeof window !== "undefined" ? window : undefined;
    if (
      window_ &&
      typeof (window_ as unknown as Record<string, unknown>).Sentry !==
        "undefined"
    ) {
      const Sentry = (window_ as unknown as Record<string, unknown>).Sentry as {
        captureMessage: (message: string, level: string) => void;
      };
      Sentry.captureMessage(entry.message, entry.level);
    }
  }

  // Public methods matching LogLevel
  debug(
    context: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    void this.log("debug", context, message, data);
  }

  info(context: string, message: string, data?: Record<string, unknown>): void {
    void this.log("info", context, message, data);
  }

  warn(
    context: string,
    message: string,
    data?: Record<string, unknown> | Error,
  ): void {
    if (data instanceof Error) {
      const errorData: Record<string, unknown> = {
        errorName: data.name,
        errorMessage: data.message,
        stack: data.stack,
      };
      void this.log("warn", context, message, errorData);
    } else {
      void this.log("warn", context, message, data);
    }
  }

  error(
    context: string,
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    const errorData = {
      ...data,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
    };

    const stack = error instanceof Error ? error.stack : undefined;

    void this.log("error", context, message, errorData, stack);
  }

  critical(
    context: string,
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    const errorData = {
      ...data,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
    };

    const stack = error instanceof Error ? error.stack : undefined;

    void this.log("critical", context, message, errorData, stack);
  }

  /**
   * Récupère les logs stockés
   */
  async getLogs(filter?: {
    level?: LogLevel;
    context?: string;
    hours?: number;
  }): Promise<LogEntry[]> {
    try {
      const db = await this._getDB();
      return await new Promise<LogEntry[]>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const allRequest = store.getAll();

        allRequest.onsuccess = () => {
          let logs = (allRequest.result || []) as LogEntry[];

          // Appliquer filters
          if (filter?.level) {
            logs = logs.filter((l) => l.level === filter.level);
          }

          if (filter?.context) {
            logs = logs.filter((l) => l.context === filter.context);
          }

          if (filter?.hours) {
            const since = new Date(Date.now() - filter.hours * 60 * 60 * 1000);
            logs = logs.filter((l) => new Date(l.timestamp) > since);
          }

          resolve(logs);
        };

        allRequest.onerror = () => reject(allRequest.error);
      });
    } catch (_) {
      return [];
    }
  }

  /**
   * Exporte les logs
   */
  async exportLogs(format: "json" | "csv" = "json"): Promise<string> {
    const logs = await this.getLogs();

    if (format === "json") {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV
      const headers = ["timestamp", "level", "context", "message", "data"];
      const rows = logs.map((log) => [
        log.timestamp,
        log.level,
        log.context,
        log.message,
        JSON.stringify(log.data ?? {}),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((v) => `"${v}"`).join(",")),
      ].join("\n");

      return csv;
    }
  }

  /**
   * Efface tous les logs
   */
  async clearLogs(): Promise<void> {
    try {
      const db = await this._getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });
    } catch (_) {
      // Silent fail if DB unavailable
    }
  }
}

// Export singleton
export const logger = new CentralizedLogger();

// Exporter aussi la config pour tests
export { DEFAULT_CONFIG, LOG_LEVELS, SESSION_ID };
