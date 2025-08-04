/**
 * Logger utility to replace direct console.log usage
 * Provides consistent logging across environments with ability to disable in production
 */

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Set default log level based on environment
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.ERROR 
  : LogLevel.DEBUG;

// Current log level - can be changed at runtime
let currentLogLevel = DEFAULT_LOG_LEVEL;

/**
 * Logger class providing better alternatives to console methods
 */
export class Logger {
  /**
   * Set global log level
   * @param level - The log level to set
   */
  static setLogLevel(level: LogLevel): void {
    currentLogLevel = level;
  }

  /**
   * Log error messages (always enabled even in production)
   * @param message - Primary message to log
   * @param optionalParams - Additional data to log
   */
  static error(message: string, ...optionalParams: any[]): void {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...optionalParams);
    }
  }

  /**
   * Log warning messages
   * @param message - Primary message to log
   * @param optionalParams - Additional data to log
   */
  static warn(message: string, ...optionalParams: any[]): void {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  /**
   * Log info messages
   * @param message - Primary message to log
   * @param optionalParams - Additional data to log
   */
  static info(message: string, ...optionalParams: any[]): void {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  /**
   * Log debug messages (disabled in production)
   * @param message - Primary message to log
   * @param optionalParams - Additional data to log
   */
  static debug(message: string, ...optionalParams: any[]): void {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }
}

// Export enum for external use
export { LogLevel };

// Default export for easier imports
export default Logger; 