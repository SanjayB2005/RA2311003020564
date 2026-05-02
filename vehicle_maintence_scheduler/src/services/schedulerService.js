/**
 * schedulerService.js
 *
 * Core scheduling logic using the 0/1 Knapsack algorithm.
 *
 * Problem:
 *   Given a list of vehicle tasks (each with Duration and Impact),
 *   and a mechanic-hour budget for a depot, find the subset of tasks
 *   that maximises total Impact without exceeding the budget.
 *
 * Algorithm Choice:
 *   0/1 Knapsack via dynamic programming — O(n * W) time complexity
 *   where n = number of tasks, W = mechanic-hours budget.
 *   This gives the exact optimal solution, not an approximation.
 *
 *   For very large W (>10,000), a greedy ratio-based approach would
 *   be faster but sacrifices optimality. The DP approach is used here
 *   as it handles real-world scale inputs correctly.
 *
 * No external algorithm libraries are used — implemented from scratch.
 */

/**
 * Runs 0/1 Knapsack DP to find the optimal set of vehicle tasks
 * for a given mechanic-hour budget.
 *
 * @param {Array<{TaskID: string, Duration: number, Impact: number}>} vehicles
 * @param {number} budget - total mechanic-hours available for this depot
 * @param {object} logger - request-scoped logger
 * @returns {{ selectedTasks: Array, totalImpact: number, totalHours: number }}
 */
function runKnapsack(vehicles, budget, logger) {
  const n = vehicles.length;

  logger.info("Starting 0/1 Knapsack algorithm", {
    totalTasks: n,
    mechanicHoursBudget: budget,
  });

  // Edge case: no tasks or zero budget
  if (n === 0 || budget <= 0) {
    logger.warn("Knapsack skipped due to empty input or zero budget", {
      n,
      budget,
    });
    return { selectedTasks: [], totalImpact: 0, totalHours: 0 };
  }

  // ─── Build DP table ─────────────────────────────────────────────────────
  // dp[i][w] = max Impact achievable using first i tasks within w hours
  // We use a 1D rolling array to save memory: dp[w]
  const dp = new Array(budget + 1).fill(0);

  // keep[i][w] = true if task i is included in the optimal solution for dp[i][w]
  // Needed for backtracking to find which tasks were selected
  const keep = Array.from({ length: n }, () => new Array(budget + 1).fill(false));

  for (let i = 0; i < n; i++) {
    const { Duration, Impact } = vehicles[i];

    // Traverse budget from high to low to ensure each task is used at most once (0/1)
    for (let w = budget; w >= Duration; w--) {
      const withItem = dp[w - Duration] + Impact;
      if (withItem > dp[w]) {
        dp[w] = withItem;
        keep[i][w] = true;
      }
    }
  }

  const maxImpact = dp[budget];
  logger.info("Knapsack DP table built", { maxImpact });

  // ─── Backtrack to find selected tasks ────────────────────────────────────
  const selectedTasks = [];
  let remainingCapacity = budget;

  for (let i = n - 1; i >= 0; i--) {
    if (keep[i][remainingCapacity]) {
      selectedTasks.push(vehicles[i]);
      remainingCapacity -= vehicles[i].Duration;
    }
  }

  const totalHours = budget - remainingCapacity;

  logger.info("Knapsack backtracking complete", {
    selectedCount: selectedTasks.length,
    totalImpact: maxImpact,
    totalHoursUsed: totalHours,
    remainingHours: remainingCapacity,
  });

  return {
    selectedTasks,
    totalImpact: maxImpact,
    totalHours,
  };
}

/**
 * Generates a full maintenance schedule for a single depot.
 *
 * @param {object} depot - { ID: number, MechanicHours: number }
 * @param {Array} vehicles - all available vehicle tasks
 * @param {object} logger - request-scoped logger
 * @returns {object} Schedule result for the depot
 */
function scheduleForDepot(depot, vehicles, logger) {
  logger.info("Scheduling for depot", {
    depotId: depot.ID,
    mechanicHours: depot.MechanicHours,
  });

  const { selectedTasks, totalImpact, totalHours } = runKnapsack(
    vehicles,
    depot.MechanicHours,
    logger
  );

  return {
    depotId: depot.ID,
    mechanicHoursBudget: depot.MechanicHours,
    totalHoursUsed: totalHours,
    remainingHours: depot.MechanicHours - totalHours,
    totalImpactScore: totalImpact,
    scheduledTaskCount: selectedTasks.length,
    scheduledTasks: selectedTasks,
  };
}

/**
 * Generates maintenance schedules for all depots.
 *
 * @param {Array} depots - all depots
 * @param {Array} vehicles - all vehicle tasks (shared pool)
 * @param {object} logger - request-scoped logger
 * @returns {Array} Array of schedule results, one per depot
 */
function scheduleForAllDepots(depots, vehicles, logger) {
  logger.info("Generating schedule for all depots", {
    depotCount: depots.length,
    vehicleCount: vehicles.length,
  });

  const schedules = depots.map((depot) =>
    scheduleForDepot(depot, vehicles, logger)
  );

  const totalImpact = schedules.reduce((sum, s) => sum + s.totalImpactScore, 0);

  logger.info("All depot schedules complete", {
    depotCount: schedules.length,
    combinedTotalImpact: totalImpact,
  });

  return schedules;
}

module.exports = { scheduleForDepot, scheduleForAllDepots };
