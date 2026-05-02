/**
 * Logging Middleware
 *
 * NOTE: This file re-exports the logging middleware built during
 * the Pre-Test Setup stage (logging_middleware folder).
 *
 * It wraps your existing logger so it can be used as Express middleware
 * in this microservice. All request/response logging flows through it.
 *
 * DO NOT use console.log or built-in language loggers anywhere in the app.
 */

// ─── Import your logging middleware from the logging_middleware folder ───────
// Adjust the relative path below if your folder is at the repo root level
// e.g. if repo root has: /logging_middleware/index.js
// const { logRequest } = require("../../../logging_middleware");

// ─── Fallback: local structured logger (remove once you wire in the real one) ─
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, "app.log");

/**
 * Writes a structured log entry to the log file.
 * @param {"INFO"|"ERROR"|"WARN"} level
 * @param {string} message
 * @param {object} meta
 */
function writeLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const line = JSON.stringify(entry) + "\n";
  fs.appendFileSync(LOG_FILE, line);
}

/**
 * Express middleware: logs every incoming request and its response.
 * Attaches a logger instance to req.logger for use inside route handlers.
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Attach a scoped logger to the request object
  req.logger = {
    info: (message, meta = {}) => writeLog("INFO", message, meta),
    error: (message, meta = {}) => writeLog("ERROR", message, meta),
    warn: (message, meta = {}) => writeLog("WARN", message, meta),
  };

  // Log the incoming request
  writeLog("INFO", "Incoming Request", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent") || "unknown",
  });

  // Intercept res.json to log response details after send
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const duration = Date.now() - startTime;
    writeLog("INFO", "Outgoing Response", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    });
    return originalJson(body);
  };

  next();
}

module.exports = requestLogger;
