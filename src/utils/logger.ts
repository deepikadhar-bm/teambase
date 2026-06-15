// ============================================================================
// LOGGER (Merged Enterprise Edition)
// ----------------------------------------------------------------------------
// - Supports: DEBUG, INFO, WARN, ERROR, PASS, FAIL
// - Auto-creates logs/ directory
// - Daily log rotation → logs/api-test-YYYY-MM-DD.log
// - Color-coded console output
// - Singleton instance (Logger.getInstance())
// - Supports LOG_LEVEL filtering (INFO, WARN, ERROR etc.)
// - Backward compatible with your old logger API
// ============================================================================

import * as fs from "fs";
import * as path from "path";

// ----------------------------------------------------------------------------
// LOG LEVEL ENUM
// ----------------------------------------------------------------------------
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  PASS = "PASS",
  FAIL = "FAIL",
}

// ----------------------------------------------------------------------------
// TERMINAL COLORS
// ----------------------------------------------------------------------------
const COLORS: Record<string, string> = {
  DEBUG: "\x1b[90m", // grey
  INFO: "\x1b[36m",  // cyan
  WARN: "\x1b[33m",  // yellow
  ERROR: "\x1b[31m", // red
  PASS: "\x1b[32m",  // green
  FAIL: "\x1b[31m",  // red
  RESET: "\x1b[0m",
};

// ============================================================================
// LOGGER CLASS
// ============================================================================
export class Logger {
  private static instance: Logger;
  private readonly logDir: string = "logs";
  private readonly logFile: string;
  private readonly currentLevel: LogLevel;

  private constructor() {
    // Create /logs directory if missing
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Daily rotating file
    const today = new Date().toISOString().split("T")[0];
    this.logFile = path.join(this.logDir, `api-test-${today}.log`);

    // LOG_LEVEL from env, fallback to DEBUG
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    this.currentLevel = LogLevel[envLevel] ? envLevel : LogLevel.DEBUG;
  }

  // ----------------------------------------------------------------------------
  // Singleton Instance
  // ----------------------------------------------------------------------------
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // ----------------------------------------------------------------------------
  // Should log? (based on LOG_LEVEL priority)
  // ----------------------------------------------------------------------------
  private shouldLog(level: LogLevel): boolean {
    const priority: Record<LogLevel, number> = {
      ERROR: 0,
      FAIL: 1,
      WARN: 2,
      INFO: 3,
      PASS: 4,
      DEBUG: 5,
    };

    return priority[level] <= priority[this.currentLevel];
  }

  // ----------------------------------------------------------------------------
  // Format message
  // ----------------------------------------------------------------------------
  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const details = data ? `\n${JSON.stringify(data, null, 2)}` : "";
    return `[${timestamp}] [${level}] ${message}${details}`;
  }

  // ----------------------------------------------------------------------------
  // Write to file + console (non-blocking file operation)
  // ----------------------------------------------------------------------------
  private output(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const formatted = this.format(level, message, data);

    // Console output (colored)
    const color = COLORS[level] || "";
    console.log(color + formatted + COLORS.RESET);

    // File output async
    fs.appendFile(this.logFile, formatted + "\n", () => {});
  }

  // ======================================================================
  // PUBLIC LOG METHODS
  // ======================================================================
  debug(msg: string, data?: any) { this.output(LogLevel.DEBUG, msg, data); }
  info(msg: string, data?: any) { this.output(LogLevel.INFO, msg, data); }
  warn(msg: string, data?: any) { this.output(LogLevel.WARN, msg, data); }
  error(msg: string, data?: any) { this.output(LogLevel.ERROR, msg, data); }

  // Enterprise extra logs
  pass(msg: string, data?: any) { this.output(LogLevel.PASS, msg, data); }
  fail(msg: string, data?: any) { this.output(LogLevel.FAIL, msg, data); }

  // Get log file path (optional)
  getLogFile(): string {
    return this.logFile;
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================
export const logger = Logger.getInstance();
