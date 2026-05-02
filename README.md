# Vehicle Maintenance Scheduler Microservice

A Node.js + Express microservice that solves the optimal vehicle maintenance scheduling problem using a **0/1 Knapsack dynamic programming algorithm**.

## Problem Summary

Each depot has a fixed **mechanic-hour budget**. A shared pool of vehicle tasks, each with a **Duration** (hours) and an **Impact** (importance score), must be optimally assigned. The goal is to **maximise total Impact** without exceeding the budget.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **HTTP Client:** Axios
- **Algorithm:** 0/1 Knapsack (DP) — no external algorithm libraries used
- **Logging:** Custom logging middleware (from `logging_middleware/`)

## Setup

```bash
npm install
```

Add your credentials to `.env`:
```
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
```

## Run the Service

Start in development/normal mode:

```bash
npm start
```

If your project has a dev script, you can use:

```bash
npm run dev
```

By default, the service runs on the configured `PORT` (or your app default).

## Test the Service

### 1) Health Check

```bash
curl http://localhost:3000/health
```

Expected: a success/healthy response.

### 2) Test Scheduling Endpoints

```bash
curl http://localhost:3000/schedule/all
curl http://localhost:3000/schedule/depot/1
curl http://localhost:3000/schedule/depots
curl http://localhost:3000/schedule/vehicles
```

### 3) Using Postman (optional)

- Create a new collection.
- Add the same GET routes listed above.
- Set base URL to `http://localhost:3000`.
- Send requests and verify response fields like `success`, `schedule`, and `totalImpactScore`.

### 4) Automated Tests (if present)

If this repository includes test scripts in `package.json`, run:

```bash
npm test
```

```bash
npm start
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Service health check |
| GET | `/schedule/all` | Optimal schedule for all 5 depots |
| GET | `/schedule/depot/:id` | Optimal schedule for a specific depot |
| GET | `/schedule/depots` | Raw depot list from eval server |
| GET | `/schedule/vehicles` | Raw vehicle list from eval server |

## Example Response — `/schedule/depot/1`

```json
{
  "success": true,
  "message": "Maintenance schedule generated for Depot 1",
  "totalAvailableTasks": 50,
  "schedule": {
    "depotId": 1,
    "mechanicHoursBudget": 60,
    "totalHoursUsed": 58,
    "remainingHours": 2,
    "totalImpactScore": 240,
    "scheduledTaskCount": 12,
    "scheduledTasks": [...]
  }
}
```

## Algorithm

The **0/1 Knapsack** algorithm is implemented from scratch in `src/services/schedulerService.js`. It uses a 1D DP array with backtracking to find the exact optimal solution — no approximations, no external libraries.

Time complexity: **O(n × W)** where n = tasks, W = mechanic-hours budget.
