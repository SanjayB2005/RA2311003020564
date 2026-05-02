/**
 * apiService.js
 *
 * Handles all outbound HTTP calls to the Affordmed Evaluation Server.
 * Uses Client ID and Client Secret for authentication on protected routes.
 */

const axios = require("axios");
const config = require("../config/env");

const BASE_URL = config.evalServer.baseUrl;
let cachedToken = config.evalServer.token;

function extractToken(data) {
  return (
    data?.access_token ||
    data?.accessToken ||
    data?.token ||
    data?.accessToken?.token ||
    data?.data?.access_token ||
    data?.data?.accessToken ||
    data?.data?.token
  );
}

async function getBearerToken() {
  if (cachedToken) return cachedToken;

  const { clientId, clientSecret, accessCode, email, name, rollNo } = config.evalServer;
  if (!clientId || !clientSecret || !accessCode || !email || !name || !rollNo) {
    throw new Error(
      "Missing evaluation server auth values. Set EVAL_SERVER_TOKEN/ACCESS_TOKEN, or set CLIENT_ID, CLIENT_SECRET, ACCESS_CODE, EVAL_EMAIL, EVAL_NAME, and EVAL_ROLL_NO"
    );
  }

  const response = await axios.post(`${BASE_URL}/evaluation-service/auth`, {
    email,
    name,
    rollNo,
    clientID: clientId,
    clientSecret,
    accessCode,
  });

  cachedToken = extractToken(response.data);
  if (!cachedToken) {
    throw new Error("Auth succeeded but no bearer token was found in the response");
  }

  return cachedToken;
}

/**
 * Builds the Authorization header.
 * Uses HTTP Bearer token since that's what Affordmed expects using Client credentials or Access code logic
 * Actually, per standard Affordmed evaluation: Basic Auth with Client ID & Secret or Bearer Token.
 */
async function getAuthHeaders() {
  const token = await getBearerToken();
  return {
    Authorization: `Bearer ${token}`,
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
    const response = await axios.get(url, { headers: await getAuthHeaders() });
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
    const response = await axios.get(url, { headers: await getAuthHeaders() });
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
