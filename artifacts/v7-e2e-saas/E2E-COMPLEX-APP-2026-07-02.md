# Autonomi-SaaS complex-app E2E (v7.117) - 2026-07-02

The founder's named validation: a GENUINELY complex app (real HTTP API + PostgreSQL + Redis
cache) built through the FULL autonomi-saas product path, then ground-truthed. Every fact below
is observed from logs/artifacts, not fabricated. n=1.

## Stack (all real, verified via HTTP)
web :5180 (200), BFF :8788 (remapped from 8787 - an lm-gtm-agent claude-sidecar shadowed 8787;
a DIFFERENT project, NOT killed; remap is reversible via BFF_HOST_PORT), worker, postgres/redis/
minio (compose, healthy), host loki engine :57374 running v7.117.0 (latest, installed this session).
Observability dashboard :58080 kept up.

## The build (real product path: web -> BFF -> worker -> engine.startBuild)
Spec: Task Management REST API, Express + PostgreSQL persistence (migration) + Redis cache-aside,
10 acceptance criteria incl. cache-hit-vs-miss AND cache optional-degrade (Redis-down still works).
- buildId e25fc013-91eb-4c85-aa67-7fa3106fcfdf, projectId 0d722695, runId run-20260702165352.
- Worker: job_received -> running -> run_id_harvested (real product path confirmed).
- The engine built a genuinely MODULAR app: src/db/{pool,tasksRepo,migrate}.js, src/cache/redisClient.js,
  src/middleware/validateTask.js, src/routes/tasks.js, migrations/001_create_tasks.sql, 3 test files
  incl. cache-degrade.test.js. 2 commits (implement + a test-glob fix). Cost ~$5.38, ~25min, sonnet-5+opus.

## RESULT (honest, decisive): build reported FAILED - and that was CORRECT

The product did NOT deliver a working deliverable AND did NOT fake-green it. It correctly reported
failure. Both a real gap and a real validation of the trust thesis. Root cause chain (observed):

1. The inner agent OVER-CLAIMED: its final message said "18 tests all passing ... complete and
   verified end-to-end." But that was true ONLY in a manually-provisioned environment - the agent
   had hand-started taskapi-test-pg / taskapi-test-redis containers. (The engine's own mid-build
   advisor call flagged exactly this: "the 18 tests pass only if those containers are still up.")
2. The DETERMINISTIC test gate re-ran the suite in a clean environment (no manual containers) ->
   tests FAILED -> the engine wrote .loki/signals/TESTS_FAILED (NOT COMPLETION_REQUESTED).
3. Because tests failed, NO proof.json / COMPLETED was emitted (correct - no verified-completion
   without passing evidence).
4. The worker polled 600 times (~10min) for a workspace-scoped completion proof, never found one,
   and honestly reported finalState:failed.

**This is the anti-fake-green thesis working end-to-end on a real complex build**: the agent's
self-report was optimistic; the deterministic gate + proof rail refused to certify it; the product
said "failed" rather than shipping a broken app as done. That is the single most important result
of this E2E, and it is a WIN.

## Measured vs OUR prior baseline (NOT vs competitors - head-to-head is founder-gated #8)
| Metric | Prior (URL-shortener, simple) | This (Task API + PG + Redis, complex) |
|---|---|---|
| Wall-clock | ~7 min | ~25 min |
| ACT iterations | 1 | 1 |
| Outcome | completion_promise_fulfilled, works | FAILED (honest; over-claim caught by gate) |
| Self-heal rounds | 0 | 0 (no recovery iteration after TESTS_FAILED - see finding 2) |
| Deliverable works | YES (ground-truthed) | NO (tests fail without a provisioned datastore env) |
Honest: a complex PG+Redis app did NOT one-shot; the simple app did. That is expected and is the
value of this test - it exposes where the product's single-pass ceiling is.

## Findings filed (separated; severities honest)
1. POSITIVE + a sub-question: the gate correctly caught the over-claim (no fake-green). Sub-question:
   did the v7.114 rank-8 build_prompt line ("Verify once - the gates are the authority; do not
   re-verify redundantly") induce the agent to claim done off its first pass without re-running the
   tests it needed a live datastore for? Prompt-level, checkable, small if confirmed.
2. CONVERGENCE GAP (pre-existing, NOT a this-session regression): after TESTS_FAILED on iteration 1,
   the loop did NOT run a recovery iteration to fix the failing tests (ACT iterations=1). git-blame:
   the TESTS_FAILED path (run.sh:9560-9575) last changed in v7.48.0 (2026-06-16), untouched this
   session -> pre-existing single-pass limitation that only SURFACES on a complex app that cannot
   one-shot (every prior calibration succeeded in one iteration, so this is the first run to exercise
   it). Priority: high (it is the flagship use case), but NOT a trust breach (gate held).
3. POST-SESSION HANG (possibly separate): the loki-run wrapper PID stayed alive (SNs) with logs
   quiet for 9+ min after the session logged exit 0 - a wrapper not fully reaping after the run
   ended. Distinct from finding 2.

## Honest scope
Measures OUR run only, n=1. No competitor was run (never fabricate a head-to-head). The
"self-healing + error monitoring" build slice is grounded in finding 2 (the real recovery gap this
run exposed), not speculative.
