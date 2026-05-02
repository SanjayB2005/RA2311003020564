/**
 * scheduler.js — Route definitions for Vehicle Maintenance Scheduler
 *
 * Routes:
 *   GET /schedule/all          → schedule for all depots
 *   GET /schedule/depot/:id    → schedule for a specific depot by ID
 */

const express = require("express");
const router = express.Router();
const { fetchDepots, fetchVehicles } = require("../services/apiService");
const {
  scheduleForDepot,
  scheduleForAllDepots,
} = require("../services/schedulerService");


router.get("/all", async (req, res) => {
  const logger = req.logger;

  logger.info("Route hit: GET /schedule/all");

  try {
    // Fetch data from evaluation server
    const [depots, vehicles] = await Promise.all([
      fetchDepots(logger),
      fetchVehicles(logger),
    ]);

    // Run scheduler for all depots
    const schedules = scheduleForAllDepots(depots, vehicles, logger);

    const summary = {
      success: true,
      message: "Maintenance schedule generated for all depots",
      totalDepots: depots.length,
      totalAvailableTasks: vehicles.length,
      schedules,
    };

    logger.info("GET /schedule/all completed successfully", {
      depotCount: depots.length,
    });

    return res.status(200).json(summary);
  } catch (error) {
    logger.error("GET /schedule/all failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to generate schedule",
      error: error.message,
    });
  }
});

/**
 * GET /schedule/depot/:id
 * Returns the optimal maintenance schedule for a single depot by its ID.
 */
router.get("/depot/:id", async (req, res) => {
  const logger = req.logger;
  const depotId = parseInt(req.params.id, 10);

  logger.info("Route hit: GET /schedule/depot/:id", { depotId });

  if (isNaN(depotId)) {
    logger.warn("Invalid depot ID provided", { raw: req.params.id });
    return res.status(400).json({
      success: false,
      message: "Invalid depot ID. Must be a number.",
    });
  }

  try {
    // Fetch data from evaluation server
    const [depots, vehicles] = await Promise.all([
      fetchDepots(logger),
      fetchVehicles(logger),
    ]);

    // Find the requested depot
    const depot = depots.find((d) => d.ID === depotId);

    if (!depot) {
      logger.warn("Depot not found", { depotId });
      return res.status(404).json({
        success: false,
        message: `Depot with ID ${depotId} not found`,
        availableDepotIds: depots.map((d) => d.ID),
      });
    }

    // Run scheduler for the specific depot
    const schedule = scheduleForDepot(depot, vehicles, logger);

    logger.info("GET /schedule/depot/:id completed successfully", { depotId });

    return res.status(200).json({
      success: true,
      message: `Maintenance schedule generated for Depot ${depotId}`,
      totalAvailableTasks: vehicles.length,
      schedule,
    });
  } catch (error) {
    logger.error("GET /schedule/depot/:id failed", {
      depotId,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to generate schedule for depot",
      error: error.message,
    });
  }
});

/**
 * GET /schedule/depots
 * Returns raw depot list from the evaluation server (utility/debug route).
 */
router.get("/depots", async (req, res) => {
  const logger = req.logger;

  logger.info("Route hit: GET /schedule/depots");

  try {
    const depots = await fetchDepots(logger);
    return res.status(200).json({ success: true, depots });
  } catch (error) {
    logger.error("GET /schedule/depots failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch depots",
      error: error.message,
    });
  }
});

/**
 * GET /schedule/vehicles
 * Returns raw vehicle list from the evaluation server (utility/debug route).
 */
router.get("/vehicles", async (req, res) => {
  const logger = req.logger;

  logger.info("Route hit: GET /schedule/vehicles");

  try {
    const vehicles = await fetchVehicles(logger);
    return res.status(200).json({
      success: true,
      totalVehicles: vehicles.length,
      vehicles,
    });
  } catch (error) {
    logger.error("GET /schedule/vehicles failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error.message,
    });
  }
});

module.exports = router;
