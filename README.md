# Real-Time Device Operations Platform (APS)

A high-reliability, production-grade operations platform for connected hardware fleets. Built with Node 20, TypeScript, Fastify, PostgreSQL 16, Pino, Vitest, and React.

Zero external queuing infrastructure (no Kafka, Redis, or RabbitMQ) — PostgreSQL 16 serves as the single source of truth, durable queue, and real-time event streaming bus.

---

## Documentation Directory

| Document                                          | Description                                                                                                                                     |
| :------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Architecture Guide](docs/ARCHITECTURE.md)**    | System architecture diagram, component roles, transactional boundaries, and end-to-end data flow.                                               |
| **[Protocol Specification](docs/PROTOCOL.md)**    | Ingestion schema, endpoint contracts, per-event result semantics, clock skew rules, and delivery guarantees.                                    |
| **[Architecture Decisions](docs/DECISIONS.md)**   | Rationale, evaluated alternatives (PostgreSQL vs Kafka/Redis, SSE vs WebSockets, HTTP vs MQTT), and trade-offs.                                 |
| **[Failure Modes Matrix](docs/FAILURE_MODES.md)** | 11 failure scenarios mapped to platform behavior, automated test proof, and remaining limitations.                                              |
| **[Production Deployment](docs/DEPLOYMENT.md)**   | Managed RDS/Cloud SQL HA/PITR setup, stateless API scaling, worker concurrency, partitioning, secrets, mTLS, and Kafka/MQTT migration triggers. |
| **[Operations Runbook](docs/RUNBOOK.md)**         | Step-by-step diagnostic workflows, Prometheus alerts, and remediation playbooks for common incidents.                                           |

---

## System Architecture

```
                      ┌─────────────────────────────┐
                      │   Device Fleet / Simulator  │
                      └──────────────┬──────────────┘
                                     │ HTTP POST /v1/events (Bearer Key, Batch <= 500)
                                     ▼
                      ┌─────────────────────────────┐
                      │         Fastify API         │ ◄───────┐
                      └──────────────┬──────────────┘         │
                                     │ ACID Ingestion         │ SSE Change Log
                                     │ (SKIP LOCKED Queue)    │ (Last-Event-ID Replay)
                                     ▼                        │
                      ┌─────────────────────────────┐         │
                      │    PostgreSQL 16 (SSOT)     │ ────────┘
                      └──────────────┬──────────────┘
                                     │ SELECT ... FOR UPDATE SKIP LOCKED
                                     ▼
                      ┌─────────────────────────────┐
                      │      Background Worker      │
                      │  - Pure Rule Engine (Eval)  │
                      │  - Incident Dedup & State   │
                      │  - Absence Leader Election  │
                      │  - Transactional Outbox     │
                      └──────────────┬──────────────┘
                                     │ Webhooks (Exponential Backoff + Jitter + Breaker)
                                     ▼
                      ┌─────────────────────────────┐
                      │      Notification Sink      │
                      │  (Operator Alert Webhooks)  │
                      └─────────────────────────────┘
```

### Core Invariants & Guarantees

1. **PostgreSQL as Single Source of Truth & Durable Queue**:
   - Events are committed transactionally to `events` table with `processing_status: 'pending'`.
   - Worker replicas claim batches using `SELECT ... FOR UPDATE SKIP LOCKED` with a 30-second lease (`locked_until`).
   - If processing fails after `MAX_EVENT_ATTEMPTS=5`, events transition to `failed` (dead-letter).
2. **At-Least-Once Delivery with Strict Database Idempotency**:
   - Ingestion enforces uniqueness via primary key `(device_id, event_id)`.
   - Ingest endpoint returns per-event statuses: `[{ event_id, status: "accepted" | "duplicate" | "rejected" }]`.
   - `accepted` guarantees the event is committed to PostgreSQL disk. Duplicate deliveries return status `duplicate` without re-processing.
   - Future timestamps (> 5 min) and schema violations are rejected individually into the `rejected_events` ring buffer.
3. **Queue Backpressure & Sliding-Window Rate Limiting**:
   - If pending queue depth exceeds threshold (`QUEUE_BACKPRESSURE_THRESHOLD=5000`), the API responds with `429 Too Many Requests` + `Retry-After: 5`.
   - Per-device sliding window limits each device to a configurable rate (default: 120 req/min).
4. **Rule Evaluation & Incident Deduplication**:
   - Evaluates `threshold`, `event_type`, and `absence` rules with device/location/global scopes.
   - Partial unique index enforces dedup key `rule_id:device_id` across open and acknowledged incidents.
   - Repeat rule triggers attach to the existing incident and increment `occurrence_count`.
5. **Absence Monitoring & Automatic Resolution**:
   - Distributed leader election via PostgreSQL advisory lock (`pg_try_advisory_lock(424242)`).
   - Devices missing heartbeats beyond rule threshold transition to `offline` and trigger absence incidents.
   - When an offline device reports a new event, open absence incidents auto-resolve (`status: auto_resolved`) with full audit history.
6. **Transactional Outbox with Circuit Breaker**:
   - Notification records are written in the same atomic database transaction as incident creation/escalation.
   - Notifier worker delivers webhooks with exponential backoff and full random jitter (`calculateBackoffWithJitter`).
   - Circuit breaker trips to `OPEN` on consecutive failures to protect downstream webhook targets, probing with `HALF_OPEN` state.
7. **Real-Time Streaming with Gapless Replay**:
   - Mutations write sequentially to `change_log (seq BIGSERIAL)` and notify via `pg_notify('change_log')`.
   - Web console connects via Server-Sent Events (SSE) `GET /api/stream`.
   - Supports `Last-Event-ID` header for gapless reconnect replay and signals `resync_required` if gap exceeds buffer.

---

## Monorepo Layout

```
aps/
├── packages/
│   └── shared/             # Zod schemas, types, crypto, resilience, db pool, migrations, seed
├── apps/
│   ├── api/                # Fastify REST & SSE server (ingest, operator APIs, health, metrics)
│   ├── worker/             # Durable queue worker, rule engine, absence monitor, outbox notifier
│   ├── web/                # React 18 + Vite + Tailwind CSS operator dashboard
│   ├── simulator/          # Autonomous device simulator (steady, spikes, offline-reconnect, bursts)
│   └── notification-sink/  # Operator webhook sink with chaos simulation mode (ok/fail/slow)
├── tests/                  # Integration test suite for assignment failure scenarios
├── migrations/             # Plain SQL migrations (001_initial_schema.sql)
├── scripts/                # Automated end-to-end demo scripts (Bash & PowerShell)
├── docs/                   # Architecture, protocol, decisions, failure modes, deployment, runbook
└── docker-compose.yml      # Multi-container orchestration
```

---

## Prerequisites

- **Node.js**: `v20.12.0` or higher
- **npm**: `v10.0.0` or higher
- **Docker & Docker Compose**: Docker Engine 24+ with Compose v2+
- **Git**

---

## One-Command Startup

Start the entire platform (PostgreSQL 16, API, Worker, Simulator, Notification Sink, and Web Console):

```bash
docker compose up --build
```

### Web Interfaces & Endpoints

| Service                   | URL                                                            | Purpose                                                                   |
| :------------------------ | :------------------------------------------------------------- | :------------------------------------------------------------------------ |
| **Web Console**           | [http://localhost:5173](http://localhost:5173) (or `:8080`)    | Live React dashboard: stats, devices, live stream, incidents, rules, ops. |
| **API Server**            | [http://localhost:3000](http://localhost:3000)                 | Device ingestion (`/v1/events`) and Operator REST/SSE APIs (`/api/*`).    |
| **Notification Sink**     | [http://localhost:4000](http://localhost:4000)                 | Operator webhook destination and chaos admin controls (`/admin/mode`).    |
| **Readiness & Queue Lag** | [http://localhost:3000/readyz](http://localhost:3000/readyz)   | Health probe verifying database connection and queue lag metrics.         |
| **Prometheus Metrics**    | [http://localhost:3000/metrics](http://localhost:3000/metrics) | Ingestion counters, queue depth, outbox state, circuit breaker status.    |
| **PostgreSQL Database**   | `localhost:5432`                                               | Database `aps`, user `postgres`, password `postgres`.                     |

---

## Seed Data & Credentials

Default seed data is initialized automatically on container startup:

### Devices & Ingestion Keys

| Device ID | Device Name             | Location                                 | Bearer API Key              |
| :-------- | :---------------------- | :--------------------------------------- | :-------------------------- |
| `dev-001` | Warehouse Sensor A      | `loc-warehouse-1` (East Coast Warehouse) | `Bearer key-dev-001-secret` |
| `dev-002` | Warehouse Gateway B     | `loc-warehouse-1` (East Coast Warehouse) | `Bearer key-dev-002-secret` |
| `dev-003` | Datacenter HVAC 1       | `loc-datacenter-1` (Northern Datacenter) | `Bearer key-dev-003-secret` |
| `dev-004` | Datacenter Rack Monitor | `loc-datacenter-1` (Northern Datacenter) | `Bearer key-dev-004-secret` |
| `dev-005` | Datacenter Edge Node    | `loc-datacenter-1` (Northern Datacenter) | `Bearer key-dev-005-secret` |

### Operator Authentication

- **Operator Bearer Token**: `Bearer operator-secret-token` (configurable via `OPERATOR_TOKEN` env var).
- Used for all `/api/*` endpoints and authenticated web dashboard operations.

### Seeded Rules

1. `rule-temp-high`: Threshold `temperature > 80` (Critical Temperature Alert).
2. `rule-device-absence`: Absence `timeout_seconds: 60` (Heartbeat Absence).
3. `rule-device-error`: Event Type `device.error` (Device Error Alert).

---

## 5-Minute Evaluation Walkthrough

Follow this step-by-step walkthrough to verify every primary capability and resilience guarantee in under five minutes:

### Step 1: Launch Stack & Open Dashboard

1. Run `docker compose up --build -d` in the project root.
2. Open the **Operator Dashboard** at [http://localhost:5173](http://localhost:5173).
3. Verify that the **Real-time Connection Banner** displays `CONNECTED`, the stats cards show live event ingestion, and the **Live Events** page streams telemetry in real-time.

### Step 2: Automated End-to-End Demo Script

Run the automated demonstration script (available for POSIX and Windows):

```bash
# On Linux / macOS / Git Bash:
./scripts/demo.sh

# On Windows PowerShell:
powershell -ExecutionPolicy Bypass -File ./scripts/demo.ps1
```

The script performs an automated 6-step verification:

- Verifies healthy baseline ingestion from simulator.
- Simulates external webhook outage by flipping the notification sink to `503 Service Unavailable`.
- Ingests a critical high-temperature reading (`temperature: 92.5`).
- Verifies incident creation and outbox retry backoff while the sink is down.
- Restores the notification sink to `200 OK` and confirms delivery.
- Simulates worker crash (`docker compose kill worker`), ingests events, restarts worker (`docker compose start worker`), and verifies queue recovery with zero lost events.

### Step 3: Test Incident Deduplication

Run the temperature spike simulator scenario:

```bash
npm run scenario:spike
```

1. Navigate to the **Incidents** tab in the Web Console.
2. Observe that a single incident is opened for the affected device.
3. As the device continues reporting temperatures above 80°C, observe that **no duplicate incidents are created**; instead, `occurrence_count` increments and new events attach to the incident history.

### Step 4: Test Explainability

1. In the Web Console, click on an event in the **Live Events** list or an incident in the **Incidents** list.
2. In the drawer, inspect the **Rule Evaluation Explanation** section.
3. Observe the exact evaluation reasoning returned by `GET /api/events/:id/explain`:
   ```
   Rule: High Temperature Critical (> 80°C) -> MATCHED
   Reason: "Threshold matched: temperature (89.2) > 80"
   ```

### Step 5: Test Device Absence & Auto-Resolution

1. Stop the simulator container:
   ```bash
   docker compose stop simulator
   ```
2. Wait 60 seconds (the configured absence timeout).
3. In the Web Console, observe device statuses transition to `stale` then `offline`, and a **Device Absence** incident opens.
4. Restart the simulator:
   ```bash
   docker compose start simulator
   ```
5. As soon as the device sends its next event, observe the absence incident automatically transition to `auto_resolved` with a timestamped history entry: `"Device dev-001 resumed reporting events"`.

### Step 6: Test Operator State Machine

1. In the Web Console, click on an open incident.
2. Click **Acknowledge**: the status updates optimistically to `acknowledged` with actor `operator`.
3. Click **Resolve**: the status updates to `resolved`.
4. Check the **Audit Timeline** in the drawer to verify immutable record keeping.

---

## Simulator CLI & Scenarios

The simulator (`apps/simulator`) is a resilience test tool featuring persistent file-backed event buffers, automatic retries with exponential backoff, `Retry-After` handling, and intentional chaos injection.

```bash
# Run simulator with specific flags
npm run --workspace=@aps/simulator cli -- --devices 5 --rate 2 --scenario steady
```

### Pre-configured Scenarios (`npm run scenario:<name>`)

| Scenario                 | Command                              | Tested Behavior                                                                                                                                                                                             |
| :----------------------- | :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Steady**               | `npm run scenario:steady`            | Continuous normal telemetry, periodic heartbeats, occasional errors.                                                                                                                                        |
| **Offline & Reconnect**  | `npm run scenario:offline-reconnect` | Device goes dark for 2 min while buffering events locally to disk. On reconnect, replays backlog in chunks, injects duplicates to prove deduplication, and shuffles chunks to prove out-of-order tolerance. |
| **Temperature Spike**    | `npm run scenario:spike`             | Injects telemetry above threshold (> 80°C) for 30s to verify incident deduplication and occurrence counting.                                                                                                |
| **Burst & Backpressure** | `npm run scenario:burst`             | 10x event rate for 30s to trigger queue depth backpressure (`429 Too Many Requests`). Verifies client honors `Retry-After`.                                                                                 |
| **Malformed Ingestion**  | `npm run scenario:malformed`         | Injects malformed payloads (future timestamps > 5 min, invalid schemas, non-UUIDs) to prove per-event rejection without rejecting valid events in the batch.                                                |
| **Duplicate Storm**      | `npm run scenario:duplicate-storm`   | Re-transmits bursts of identical events to verify database idempotency.                                                                                                                                     |
| **Worker Failover**      | `npm run scenario:kill-worker`       | Continuous ingestion during worker restarts to verify queue durability and recovery.                                                                                                                        |

---

## Testing & Quality Gates

### Run All Tests

Runs 134 unit and integration tests across 21 test suites:

```bash
npm test
```

### Run Failure Scenario Integration Suite

Runs the end-to-end integration test suite against PostgreSQL:

```bash
npm run test:failure
```

The failure test suite covers all 8 core assignment scenarios:

1. `duplicate delivery`: Identical events received multiple times return `duplicate` and process exactly once.
2. `accepted-but-processing-fails`: Simulated database error increments attempts and schedules backoff.
3. `worker restart mid-processing`: Expired leases are reclaimed and processed without data loss.
4. `notification service down then up`: Webhook failures trip circuit breaker; outbox retries deliver when sink recovers.
5. `device offline then burst replay`: Offline absence triggers incident; burst replay auto-resolves absence.
6. `ingestion exceeding capacity`: Pending depth triggers 429 + `Retry-After: 5`; queue drains cleanly.
7. `malformed payloads`: Invalid events and future timestamps are rejected individually into `rejected_events`.
8. `SSE reconnect`: Reconnect with `Last-Event-ID` replays missed events with no gaps or duplicates.

### Typecheck & Lint

```bash
npm run typecheck    # 0 errors across all 6 workspaces + tests/
npm run lint         # ESLint check
npx prettier --check .
```
