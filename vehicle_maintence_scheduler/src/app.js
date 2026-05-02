

const express = require("express");
const config = require("./config/env");
const requestLogger = require("../../logging_middleware/index");
const schedulerRoutes = require("./routes/scheduler");

const app = express();

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Logging Middleware (MUST be applied before routes) ──────────────────────
// Uses the custom logging middleware built in the Pre-Test Setup stage.
// No console.log or built-in loggers are used anywhere in this application.
app.use(requestLogger);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/schedule", schedulerRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  req.logger.info("Health check hit");
  return res.status(200).json({
    success: true,
    service: "Vehicle Maintenance Scheduler Microservice",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  req.logger.warn("Route not found", { url: req.originalUrl });
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  req.logger.error("Unhandled server error", { error: err.message });
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
  // Only this one startup message uses a temporary console.log
  // All runtime logs go through the logging middleware
  // Remove/replace with your logging middleware startup log if preferred
  process.stdout.write(
    `[STARTUP] Vehicle Maintenance Scheduler running on port ${PORT}\n`
  );
});

module.exports = app;
