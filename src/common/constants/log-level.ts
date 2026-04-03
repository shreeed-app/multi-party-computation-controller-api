/**
 * Pino log level constants used to configure transports and the root logger.
 *
 * Levels follow the standard Pino priority order (trace < debug < info < warn
 * < error < fatal).
 */
enum LogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export { LogLevel };
