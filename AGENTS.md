You are building a "Real-Time Device Operations Platform" for a take-home assignment
(Forward Deployed Engineer). Priorities: reliability, correctness under failure,
clarity, and runnability. A smaller, well-reasoned system beats a complicated one.
Never add infrastructure (Kafka, Redis, k8s) unless I ask.

STACK: TypeScript monorepo (npm workspaces): apps/api, apps/worker, apps/web (React+Vite),
apps/simulator, apps/notification-sink, packages/shared (zod schemas, types).
Node 20, Fastify, Postgres 16 (use `postgres` or `pg` + plain SQL migrations in /migrations),
pino logging, vitest, Docker Compose. One command to start everything: `docker compose up --build`.

CORE DESIGN (do not deviate without asking):

- Postgres is the single source of truth and the durable queue.
- Device protocol: HTTP POST /v1/events, batch up to 500, Bearer device key (hashed in DB).
  Event: {event_id:uuid, device_id, seq:int (monotonic per device), ts:ISO8601 UTC (device time),
  type, payload:object, schema_version:1}. Server adds received_at.
- Delivery: at-least-once from device; server is idempotent via UNIQUE(device_id,event_id).
  Response is 200 with per-event results [{event_id,status:"accepted"|"duplicate"|"rejected",reason?}].
  "accepted" means committed to Postgres. Malformed events are rejected individually and stored
  in rejected_events (capped). Reject ts more than 5 min in the future.
- Processing queue: events.processing_status (pending|processing|done|failed), attempts, locked_until,
  last_error. Workers claim with FOR UPDATE SKIP LOCKED + lease. Max attempts then "failed" (dead-letter).
- Backpressure: if pending depth > configurable threshold, return 429 + Retry-After. Per-device rate limit.
- Rules: types threshold | event_type | absence. Scoped to all devices, a location, or a device.
  Incident dedup key = rule_id:device_id with a partial unique index on open/acknowledged incidents.
  Repeat matches attach events and increment occurrence_count.
- Incident states: open -> acknowledged -> resolved, plus auto_resolved for absence when device reports again.
  Every state change is stored in incident_history with timestamp and actor.
- Notifications: transactional outbox written in the same transaction as incident creation.
  Notifier retries with exponential backoff + jitter, circuit breaker, dead state. Target = the operator
  assigned to the device's location (operators table) via webhook to notification-sink.
- Real-time: change_log table (bigserial seq) written transactionally; API streams it over SSE using
  LISTEN/NOTIFY and supports Last-Event-ID replay.
- Explainability: rule_evaluations table (event_id, rule_id, matched, reason) and
  GET /api/events/:id/explain.
- Observability: pino JSON logs with correlation ids, /healthz, /readyz (DB + queue lag), /metrics (Prometheus).
- Configuration through env vars with sane defaults, validated by zod at startup.

RULES FOR YOU: Write small, typed, well-named modules. Add tests for every behavior you build.
Never leave TODOs that break the demo. After each task, run lint, typecheck and tests, then summarize
what you did, what you deliberately did NOT do, and any trade-offs. Ask before changing the core design.
