/**
 * apiService.js
 *
 * Handles all outbound HTTP calls to the Affordmed Evaluation Server.
 * Uses Client ID and Client Secret for authentication on protected routes.
 */

const axios = require("axios");
const config = require("../config/env");

const BASE_URL = config.evalServer.baseUrl;
const CLIENT_ID = config.evalServer.clientId;
const CLIENT_SECRET = config.evalServer.clientSecret;

/**
 * Builds the Authorization header.
 * Uses HTTP Bearer token since that's what Affordmed expects using Client credentials or Access code logic
 * Actually, per standard Affordmed evaluation: Basic Auth with Client ID & Secret or Bearer Token.
 */
function getAuthHeaders() {
  return {
    Authorization: `Bearer ${process.env.ACCESS_CODE}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetches all depots from the evaluation server.
 * Each depot has: { ID: number, MechanicHours: number }
 *
 * @param {object} logger - request-scoped logger from req.logger
 * @returns {Promise<Array>} Array of depot objects
 */
async function fetchDepots(logger) {
  const url = `${BASE_URL}/evaluation-service/depots`;

  logger.info("Fetching depots from evaluation server", { url });

  try {
    const response = await axios.get(url, { headers: getAuthHeaders() });
    const depots = response.data.depots;

    logger.info("Depots fetched successfully", { count: depots.length });
    return depots;
  } catch (error) {
    const errDetail = {
      url,
      status: error.response?.status,
      message: error.message,
    };
    logger.error("Failed to fetch depots", errDetail);
    throw new Error(`Depot fetch failed: ${error.message}`);
  }
}

/**
 * Fetches all vehicle tasks from the evaluation server.
 * Each vehicle has: { TaskID: string (uuid), Duration: number, Impact: number }
 *
 * @param {object} logger - request-scoped logger from req.logger
 * @returns {Promise<Array>} Array of vehicle task objects
 */
async function fetchVehicles(logger) {
  const url = `${BASE_URL}/evaluation-service/vehicles`;

  logger.info("Fetching vehicles from evaluation server", { url });

  try {
    const response = await axios.get(url, { headers: getAuthHeaders() });
    const vehicles = response.data.vehicles;

    logger.info("Vehicles fetched successfully", { count: vehicles.length });
    return vehicles;
  } catch (error) {
    const errDetail = {
      url,
      status: error.response?.status,
      message: error.message,
    };
    logger.error("Failed to fetch vehicles", errDetail);
    throw new Error(`Vehicle fetch failed: ${error.message}`);
  }
}

module.exports = { fetchDepots, fetchVehicles };
