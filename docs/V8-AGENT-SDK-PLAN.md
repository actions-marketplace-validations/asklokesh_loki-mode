# V8: SDK-Based Runtime Migration Plan

Status: PROPOSED (planning only, no code)
Target branch: `feature/v8-agent-sdk`
Author: architecture spike (research-grounded, live SDK docs verified)
Scope: replace the bash `claude -p` wrapper with the Anthropic TypeScript SDKs. Codex/Cline/Aider stay on bash. This is a multi-week arc, not one workflow.

---

## 0. The one fact that reframes everything

Loki already has a full TypeScript port of the autonomous runner. It is not hypothetical and it is not a stub.

`loki-ts/src/runner/` contains 12,300 lines across 22 modules that mirror the bash runner byte-for-byte: `autonomous.ts` (983), `build_prompt.ts` (1582), `council.ts` (806), `quality_gates.ts` (2805), `providers.ts` (562), `rarv.ts`, `budget.ts`, `checkpoint.ts`, `completion.ts`, `state.ts`, etc. Many of these are explicitly "parity-locked" with their bash siblings (grep `run.sh` for "Parity-locked with ... loki-ts/src/runner").

The catch, verified at `autonomy/run.sh:17271`:

> "The claude provider in loki-ts/src/runner/providers.ts is implemented but is NOT reached for `start` (start is not ported to the Bun router; the shim falls through to bash), so its flag set has zero live impact today."

And the transport, `loki-ts/src/runner/providers.ts:305`: `const r = await shellRun(argv, ...)` — the TS runner shells out to the `claude` binary exactly like bash does.

So the v8 work is NOT "port 35k lines of bash to TypeScript." That port largely exists. The v8 work is two much smaller things:

1. **Finish wiring the existing TS runner into `loki start`** (the Bun router in `bin/loki` already routes ~8 commands to Bun and falls through to bash for the rest, including `start`).
2. **Swap the invocation transport inside that TS runner** from `shellRun(["claude", ...])` to the SDK: `query()` for the agentic loop, `messages.create()` for the one-shot judges.

This changes the shape, risk, and phasing of the whole migration. It is a transport swap inside an existing, parity-locked TS codebase, done incrementally behind the `LOKI_LEGACY_BASH` rollback flag that already exists.

---

## 1. Target architecture

### 1.1 Two SDKs, two layers (the split is real and load-bearing)

| Layer | What runs there | SDK | Why |
|---|---|---|---|
| **One-shot judges / graders** — code review (B1), completion council members (B3/B4), council-v2 (B5/B6), done-recognition (B7), PRD enrich (C1), grill (C2), USAGE regen (C3), doc-gen (C4), merge-conflict resolve (B8) | `@anthropic-ai/sdk` (raw Client SDK, `messages.create` / `messages.parse` / `messages.stream`) | Pure HTTPS to `api.anthropic.com`. **Zero binary.** One prompt in, one (optionally schema-constrained) JSON answer out. No tool loop, no filesystem, no subprocess. This is the honest `--bare` path. |
| **The autonomous RARV dev loop** (A1) and the migration/heal agentic execs (C5/C6/C7) | `@anthropic-ai/claude-agent-sdk` (`query()`) | Needs the built-in Read/Write/Edit/Bash/Glob/Grep tool loop, MCP, hooks, subagents, sessions. Reimplementing all of that on the raw SDK is exactly the wheel the Agent SDK exists to avoid. |

**This split is not gold-plating — it is forced by what each site needs.** A judge that returns one JSON verdict must not carry a filesystem-agent harness. A dev iteration that writes files agentically must not be hand-rolled on `messages.create`. The `providers/` abstraction already models a per-provider invoke; we add an SDK-backed claude invoker with two code paths keyed on a flag the runner already threads: `call.mainLoop` (agentic → Agent SDK) vs one-shot (raw SDK).

### 1.2 Who owns it: the existing loki-ts runner (do NOT start a new module)

The runner lives in `loki-ts/src/runner/`. It is parity-locked and mostly written. We do not create a parallel module and we do not move logic out of it. We:

- Add `loki-ts/src/runner/sdk_invoker.ts` — the SDK-backed replacement for the `shellRun(["claude", ...])` call inside `providers.ts` `claudeProvider()`. Same `ProviderInvoker` contract (`invoke(call): {exitCode, capturedOutputPath}`), so the runner above it does not change.
- Add `loki-ts/src/runner/sdk_stream_parser.ts` — consumes typed `SDKMessage` objects and writes the same `.loki/state/agents.json`, `.loki/events.jsonl` hook events, and `.loki/metrics/result-cost-<iter>.json` that the ~350-line embedded Python stream-json parser writes today (`run.sh:17371+`). This is the one genuinely new piece of logic, and it is a translation of an existing parser, not a new design.
- Finish the `bin/loki` router so `start` (and `heal`, `migrate`) route to Bun when the SDK path is enabled, and fall through to bash otherwise.

### 1.3 Honest correction to the founder premise: "no binary" is only true of the raw SDK

Verified from the unpacked `@anthropic-ai/claude-agent-sdk@0.3.207` tarball and live docs:

- **`@anthropic-ai/claude-agent-sdk` bundles and spawns a native Claude Code binary** (8 platform-specific `optionalDependencies`; `sdk.mjs` calls `spawn()`; `Options.pathToClaudeCodeExecutable` exists). It is Claude Code as a library, not a pure HTTP client. It removes the *separately-installed, interactively-authed, independently-versioned* CLI — but a native executable still runs as a child process.
- **`@anthropic-ai/sdk` (raw Client SDK, v0.111.0) is pure HTTPS. No binary.**

So the accurate strategic pitch (Section 3) is: **the judge layer (raw SDK) is genuinely binary-free; the dev-loop layer (Agent SDK) replaces the unmanaged PATH CLI with a bundled, version-pinned, API-key-authed one.** Both deliver "no `claude auth`, no CLI install step, no runtime flag drift." Only the raw-SDK layer delivers "literally zero binary." State it that way to the founder — a reviewer will catch "no binary at all" and it is not true of the Agent SDK.

### 1.4 Model IDs (verified against live model catalog, replacing the placeholders in the codebase)

The codebase memory lists placeholder model names. The live, correct IDs to wire in:

| RARV tier | Model ID | Used for |
|---|---|---|
| planning / architecture | `claude-opus-4-8` | Opus tier — planning, devil's advocate, requirements-verifier |
| development / execution | `claude-sonnet-5` | Sonnet tier — the main dev loop default (`LOKI_SESSION_MODEL`), test-auditor |
| fast / unit / simple judges | `claude-haiku-4-5` | Haiku tier — council members, convergence-voter, USAGE regen |

Effort maps directly: `output_config.effort` / Agent SDK `effort` supports `low|medium|high|xhigh|max`. `xhigh` is the recommended default for coding/agentic work on Sonnet 5 / Opus 4.8.

---

## 2. Feature-preservation matrix ("lose nothing")

Every capability the bash route uses today, and how v8 preserves or enhances it. Nothing is silently dropped. Grounded in `autonomy/run.sh:17195-17369`, `lib/claude-flags.sh`, and the two SDKs' verified APIs.

| # | Claude Code capability today | Bash site | v8 preservation | E = enhancement |
|---|---|---|---|---|
| 1 | Agentic tool-use loop (RARV dev iteration) | `run.sh:17365` `-p` + stream-json | Agent SDK `query()` runs the loop; consume `SDKMessage` stream | E: typed messages replace ~350-line stdout parser |
| 2 | Built-in tools Read/Write/Edit/Bash/Glob/Grep/WebSearch/WebFetch | implicit in `claude -p` | Agent SDK ships them; gate via `allowedTools` | E: adds `Monitor` (watch background script), not available today |
| 3 | `--dangerously-skip-permissions` | `run.sh:17195` | `permissionMode: 'bypassPermissions'` | — |
| 4 | `--allowedTools` least-privilege allowlist | `run.sh:11003` (review) | `allowedTools: [...]` | note: SDK `allowedTools` = auto-approve, not restrict; use `disallowedTools` to actually block |
| 5 | `--disallowedTools` reviewer denylist | council/grill | `disallowedTools: ["Bash(rm *)", ...]` | E: scoped patterns block even under bypass — stronger than today |
| 6 | Subagents `--agents <json>` | `voter-agents.sh:284` | `agents: Record<string, AgentDefinition>` + `Agent` in allowedTools | E: typed AgentDefinition; delete the `VOTE:` regex fallback (structured output guaranteed) |
| 7 | Hooks (SessionStart/PreToolUse/Stop) | `.claude/settings.json`, migration-hooks | Agent SDK `hooks: {...}` in-process callbacks | E: healing hooks run in-process with structured input, not shelled scripts |
| 8 | MCP `--mcp-config` / `--strict-mcp-config` | `run.sh:4166` | Agent SDK `mcpServers: {...}` + `strictMcpConfig`; raw SDK `mcp_servers` (beta `mcp-client-2025-11-20`) | Loki's own `mcp/server.py` (34 tools) plugs in unchanged |
| 9 | `--append-system-prompt` (autonomy override) | `run.sh:17200` | Agent SDK `systemPrompt: {preset:'claude_code', append}`; raw SDK `system:"..."` | — |
| 10 | `--setting-sources user,project,local` | `run.sh:17210` | Agent SDK `settingSources: ['user','project','local']` | 1:1 |
| 11 | CLAUDE.md auto-discovery | implicit | Agent SDK loads it when `settingSources` includes source | E: native; the bash route fights CLAUDE.md via `--append-system-prompt` |
| 12 | Prompt caching | implicit | Agent SDK: managed by harness. Raw SDK: manual `cache_control` breakpoints | E: the inert `[CACHE_BREAKPOINT]` marker in `build_prompt` can finally set real `cache_control` on the stable prefix |
| 13 | `--json-schema` structured output | `done-recognition.sh:66`, `council-v2.sh:312`, `voter-agents.sh` | raw SDK `output_config:{format:{type:'json_schema',schema}}` / `messages.parse()`; Agent SDK `outputFormat:{type:'json_schema',schema}` | E: `messages.parse()` validates + types the result; deletes `cr-rematerialize.py` re-materialization step |
| 14 | `--effort` per RARV tier | `run.sh:17307` | raw SDK `output_config.effort`; Agent SDK `effort` | 1:1 (`low..max`) |
| 15 | **`--max-budget-usd` per-call backstop** | `run.sh:17315` | **NO per-call USD cap primitive in either SDK.** Keep Loki's own cumulative `check_budget_limit` PAUSE gate (already ported: `loki-ts/src/runner/budget.ts`). Nearest SDK primitive: `output_config.task_budget` (TOKENS, beta `task-budgets-2026-03-13`) or Agent SDK `maxBudgetUsd` field | **REAL GAP — see Risks §8.** Agent SDK exposes `maxBudgetUsd` per docs; raw SDK does not. Convert USD estimate to token `task_budget` on the judge path, keep the deterministic budget gate on both. |
| 16 | `--fallback-model` | `run.sh:17323` | Agent SDK `fallbackModel` field; raw SDK: catch overload error + retry with fallback model, or server-side `fallbacks` (Fable-5-only beta — not applicable to Opus/Sonnet tiers) | verify Agent SDK `fallbackModel` before relying (Risks §8) |
| 17 | Session resume `--resume`/`--fork-session`/`--session-id` | `run.sh:17239` | Agent SDK `resume`, `forkSession`, `sessionId`, `continue`, `persistSession`, `resumeSessionAt` | E: `resumeSessionAt` (resume at a message UUID) finer than CLI; `listSessions()`/`getSessionMessages()` replace `~/.claude` JSONL filename-scraping for dashboard correlation |
| 18 | Streaming `stream-json --verbose` + `--include-partial-messages` | `run.sh:17366` | Agent SDK `query()` async iterator; `includePartialMessages`; `includeHookEvents` | E: dashboard stream parser replaced by typed message objects |
| 19 | `--bare` cheap-subcall mode | `claude-flags.sh:147` | raw SDK IS the bare path — one HTTP call, no discovery. The `--bare` OAuth-vs-keychain gymnastics (`claude-flags.sh:157-185`) vanish | E: always `ANTHROPIC_API_KEY`, no OAuth branch |
| 20 | Model selection `--model` (tiers) | `run.sh:17195` | Agent SDK `model:'opus'/'sonnet'/'haiku'` or full ID; raw SDK `model:"claude-opus-4-8"` | 1:1 |
| 21 | `claude auth status` preflight | `run.sh:2169`,`2382` | replaced by "is `ANTHROPIC_API_KEY` set?" (or Bedrock/Vertex/Foundry env). Third-party products may NOT use claude.ai login | E: auth-preflight branch (`run.sh:2355-2456`) collapses to a key check |
| D1 | `claude ultrareview` (native cloud review) | `loki:18013` | **NO SDK equivalent.** Keep the binary for this command OR reimplement as an Agent SDK multi-agent workflow | BLOCKER — see §2.1 |
| D2 | `claude -p "ultracode: ..."` (Dynamic Workflows) | `loki:18137` | **NO SDK equivalent.** Same options as D1 | BLOCKER |
| D3 | `claude remote-control` (cockpit) | `loki:23619` | **NO SDK equivalent** (long-lived interactive exec). Keep the binary | BLOCKER |
| D4 | quick-start `claude --dangerously-skip-permissions` (literal launcher) | `loki:13274` | printed entrypoint for humans; keep as-is or point at `claude` if installed | cosmetic |

### 2.1 The Cluster-D landmine (the real "lose no features" risk)

`ultrareview`, `ultracode`/Dynamic Workflows, and `remote-control` are native Claude Code *CLI subcommands* with no `@anthropic-ai/sdk` or `@anthropic-ai/claude-agent-sdk` equivalent. Two honest options, decided before claiming zero-binary deployment:

- **(a) Carve-out (recommended for v8):** keep the `claude` binary available for exactly these three commands; everything else goes SDK. The SaaS/enterprise win (Section 3) still lands for the 99% hot path (RARV loop + judges); these three are power-user/interactive commands rarely run in a headless container.
- **(b) Reimplement** each as an Agent SDK multi-agent workflow (`ultrareview` → a review subagent fan-out; `ultracode` → a planned Agent SDK workflow). Large, deferrable, out of the v8 critical path.

The plan proceeds with (a). D1-D4 are explicitly OUT of the v8 phases below and tracked as a separate arc. This must be stated to the founder: "zero binary" is true of the hot path, not of these three commands, unless we fund option (b).

---

## 3. Enterprise / SaaS deployment section (the headline win, made concrete)

The strategic win is real, with the §1.3 correction applied. Three concrete deletions and three concrete gains.

### 3.1 What gets deleted from the deployment surface

1. **No CLI install step.** Today a container needs the `claude` binary installed and on PATH (`curl | sh`, PATH wiring in the Dockerfile). With the raw SDK: `npm install @anthropic-ai/sdk` — pure JS, no native dep. With the Agent SDK: `npm install @anthropic-ai/claude-agent-sdk` — the platform binary ships as a pinned optional dependency inside the package; still no separate install step, no PATH wiring.
2. **No interactive login.** The bash route runs `claude auth status` preflight and branches on OAuth vs keychain (`run.sh:2355-2456`, `claude-flags.sh:157-185`). Both SDKs authenticate from `ANTHROPIC_API_KEY` (or Bedrock `CLAUDE_CODE_USE_BEDROCK=1` + `ANTHROPIC_AWS_WORKSPACE_ID`, Vertex `CLAUDE_CODE_USE_VERTEX=1`, Foundry `CLAUDE_CODE_USE_FOUNDRY=1`). No `claude login`, no `~/.claude/.credentials.json` dance. Third-party products may NOT use claude.ai subscription login via the SDK — API-key/cloud-provider only. This deletes the entire auth-preflight branch.
3. **No runtime CLI-version drift.** Today Loki greps `claude --help` at runtime to feature-detect `--json-schema`/`--agents`/`--effort`/`--fallback-model` (`claude-flags.sh:120-136`, `loki_claude_flag_supported` gating ~10 flags) precisely *because* the external CLI drifts. The SDK either has the typed option or it does not — no `--help` grep. The whole capability-probe layer (`lib/claude-flags.sh`) plus ~12 `command -v claude` presence probes and the `pkill claude` cleanup disappear.

### 3.2 The three concrete gains for Autonomi SaaS

1. **Multi-tenant by env injection.** Per-tenant `ANTHROPIC_API_KEY` (or per-tenant Bedrock workspace via `ANTHROPIC_AWS_WORKSPACE_ID`) injected as env at container spawn. One image, no per-container CLI provisioning, no per-tenant `claude login`.
2. **Deterministic packaging / reproducible builds.** `loki@X ⇒ @anthropic-ai/sdk@Y` (judges) and `⇒ @anthropic-ai/claude-agent-sdk@Z ⇒ pinned binary@Z` (loop). No "works-on-my-CLI-version." The Agent SDK pins its own binary to its package version in `package.json`.
3. **Richer structured telemetry, no stdout scraping.** Result messages carry `total_cost_usd`, `usage` (incl. cache read/creation), `modelUsage`, `num_turns`, `duration_ms`, `permission_denials`. The dashboard reads a typed object instead of the embedded Python stream-json parser (`run.sh:17371+`).

### 3.3 The honest asterisk (must appear in the founder deck)

The Agent SDK layer still spawns a bundled native binary per container. The accurate claim is **"no unmanaged, separately-installed, interactively-authed, independently-versioned CLI"** — not "no binary at all." The judge layer (raw SDK) IS literally binary-free. If the founder needs literally-zero-binary for the whole runtime, the fork is: run the RARV loop on the raw SDK too and re-own the tool loop (which `run_autonomous` + the 8 gates + council mostly already own) — larger, and evaluated as a future arc, not v8.

---

## 4. Phases (ordered by value / risk / dependency)

Each phase is a discrete, agent-sized, independently-shippable unit with parity + rollback. The `LOKI_LEGACY_BASH=1` flag and the per-command `bin/loki` router already exist, so every phase ships behind a flag with bash as the live fallback until SDK-proven.

Guiding principle: **judges before the loop.** The one-shot judges (raw SDK) are low-risk, high-parity-testability (deterministic verdict comparison), and prove the SDK bridge end-to-end without touching the RARV hot path. Do them first. The Agent SDK loop is last and hardest.

### Phase 0 — Spikes (no production code; de-risk the unknowns)

- Spike A: `bun add @anthropic-ai/claude-agent-sdk`, run a trivial `query()` under Bun 1.3.13. Confirm Bun resolves the platform-gated optionalDependencies and spawns the bundled binary. If it fails, the loop runs under Node while judges stay on Bun. **This gates Phase 4's runtime choice.**
- Spike B: confirm `@anthropic-ai/sdk` `messages.parse()` + `output_config.format` produces the exact JSON shape `loki-ts/data/done-recognition-schema.json` expects.
- Spike C: confirm Agent SDK `maxBudgetUsd` and `fallbackModel` fields exist in `sdk.d.ts@0.3.207` (research flagged `fallbackModel` present, `maxBudgetUsd` present; `--max-budget-usd` has no raw-SDK analog).
- Verification: a throwaway script per spike; no `.loki/` writes; results recorded in the phase's PR description.
- Rollback: n/a (no production code).

### Phase 1 — done-recognition on the raw SDK (the bridge proof)

**Smallest real SDK adoption that proves the bridge end-to-end.** done-recognition (B7) is CLAUDE-ONLY (no provider sibling to keep in sync), one prompt → one schema-constrained JSON answer, already has an inline schema (`loki-ts/data/done-recognition-schema.json`), and fails inconclusive-safe. Perfect first target.

- Files touched: `loki-ts/src/runner/sdk_invoker.ts` (new, judge path only), `autonomy/lib/done-recognition.sh` (add an SDK branch gated behind `LOKI_SDK_DONE_RECOG=1`, keeping the `claude`/deterministic fallback), `loki-ts/data/done-recognition-schema.json` (reused as-is).
- Stays on bash (fallback): the existing `claude -p --json-schema` path and the deterministic fallback, both live when the flag is off.
- Moves to SDK: the LLM call becomes `@anthropic-ai/sdk` `messages.parse()` with `output_config.format` + the existing schema, `model: claude-haiku-4-5`, `effort: low`.
- Parity proof: run both routes (`LOKI_SDK_DONE_RECOG=0` vs `=1`) over a fixed corpus of `.loki` states; the parsed `requirements` verdict object must match. Wire into `local-ci.sh` bun-parity matrix.
- Rollback: unset `LOKI_SDK_DONE_RECOG`. One env var. Zero blast radius (single CLAUDE-ONLY helper).

### Phase 2 — the rest of the one-shot judges on the raw SDK

Extend `sdk_invoker.ts`'s judge path to the remaining single-shot sites, one PR per cluster, each behind its own flag with the bash arm intact:

- 2a: council-v2 reviewers (B5/B6) — `council-v2.sh`, schema `loki-ts/data/council-v2-schema.json`. Delete the sed-carving text fallback (structured output guaranteed).
- 2b: completion-council members + devil's advocate (B3/B4) — `completion-council.sh`. Replace `VOTE:` regex parsing with `messages.parse()`.
- 2c: code-review 3-reviewer (B1) — `run.sh:11035`, schema `loki-ts/data/code-review-schema.json`. Deletes the `cr-rematerialize.py` re-materialization to legacy `VERDICT:` text.
- 2d: aux helpers — PRD enrich (C1), grill (C2), USAGE regen (C3), doc-gen (C4), merge-conflict resolve (B8). All captured-text, no schema.
- Files: the six `.sh`/`run.sh` sites above + `sdk_invoker.ts`. Codex/Cline/Aider `case` arms untouched.
- Parity proof: verdict/text comparison per cluster over a fixed corpus; council decisions must be identical.
- Rollback: per-cluster env flag; bash arm live throughout.

### Phase 3 — the council as a single-dispatch Agent SDK `agents` call (the cleanest enhancement)

`voter-agents.sh:284` already fans out to N named reviewers in one `claude --agents <json>` call. This maps 1:1 to Agent SDK `agents: Record<string, AgentDefinition>`.

- Files: `loki-ts/src/runner/council.ts` (already ported), `autonomy/lib/voter-agents.sh` (SDK branch behind flag), schema `loki-ts/data/finding-schema.json`.
- Moves to SDK: the Python-generated `agents_json` becomes a typed `Record<string, AgentDefinition>`; `--json-schema` becomes `outputFormat`. KEEP the decision engine (effective-threshold floor, exact-quorum gate, devil's-advocate override, transcript writing) — none of that is an SDK concept.
- Parity proof: `.loki/council/votes/round-<iter>.json` must match across routes over a corpus.
- Rollback: flag; bash `--agents` arm and the heuristic council fallback both stay.
- Note: this is the first use of the Agent SDK (bundled binary). If Spike A found Bun can't spawn it, this phase and Phase 4 run under Node.

### Phase 4 — the RARV main loop on the Agent SDK (the hot path, highest risk, done last)

The single hardest site (A1). Replace `shellRun(["claude", ...stream-json...])` in `providers.ts` `claudeProvider()` with `query()`.

- Files: `loki-ts/src/runner/providers.ts` (claude mainLoop path → `sdk_invoker.ts` agentic path), `loki-ts/src/runner/sdk_stream_parser.ts` (new — translates the embedded Python stream-json parser: writes `.loki/state/agents.json`, `.loki/events.jsonl` hook events, `.loki/metrics/result-cost-<iter>.json`), `bin/loki` (route `start` to Bun when `LOKI_SDK_LOOP=1`).
- KEEP unchanged: `run_autonomous` outer loop, `build_prompt()` (parity-locked; consumed as `query({prompt})`), all 8 quality gates + evidence/checklist/heldout/assumption gates, the completion council, `.loki/` state machine, the stateless-per-iteration session design. **RARV-C is NOT replaced by any SDK primitive** (verified: no `outcome`/iterate-until-done primitive in the Agent SDK; `maxTurns`/`maxBudgetUsd`/`taskBudget` bound ONE call, not the grader loop).
- Flag mapping: `--model`→`model`, `--effort`→`effort`, `--append-system-prompt`→`systemPrompt:{preset:'claude_code',append}`, `--setting-sources`→`settingSources`, `--include-partial-messages`→`includePartialMessages`, `--dangerously-skip-permissions`→`permissionMode:'bypassPermissions'`, `--session-id`/`--resume`/`--fork-session`→`sessionId`/`resume`/`forkSession`. `--max-budget-usd`→ keep the deterministic budget gate + `maxBudgetUsd` if verified (Spike C). `--fallback-model`→`fallbackModel` if verified, else catch-and-retry.
- Enhancement to fold in: split the inert `[CACHE_BREAKPOINT]` in `build_prompt` and set real `cache_control` on the stable prefix (the migration is the moment this becomes possible).
- Parity proof: run a fixed PRD corpus through both routes (`LOKI_SDK_LOOP=0` vs `=1`); compare per-iteration cost/usage, gate outcomes, and completion decision. This is the phase that needs the `sdlc-fleet` council (3 Opus/Sonnet reviewers, unanimous APPROVE) per `CLAUDE.md`.
- Rollback: `LOKI_SDK_LOOP=0` or `LOKI_LEGACY_BASH=1` → `start` falls through to bash. Bash route stays the canonical route until this is SDK-proven across the discriminator corpus.

### Phase 5 — agentic exec sites + probe/cleanup deletion

- Migration/heal execs (C5/C6/C7) → Agent SDK `query()` (same agentic path as Phase 4), behind flags, bash arms intact.
- Delete the now-dead capability layer: `lib/claude-flags.sh` `loki_claude_flag_supported`, the `claude --help` cache, ~12 `command -v claude` probes, `claude --version` calls, `pkill claude` — but ONLY on the SDK route; the bash route still needs them until every phase is proven and the bash route is retired (a later decision, not v8).
- Rollback: flags per site.

### Phase 6 (later arc, NOT v8) — Cluster D + bash-route retirement

`ultrareview`/`ultracode`/`remote-control` reimplementation (or documented binary carve-out), and the eventual removal of the bash route once all SDK phases are proven in production. Explicitly out of v8 scope.

---

## 5. Per-phase: bash vs SDK vs parity vs rollback (summary)

| Phase | Stays on bash (fallback) | Moves to SDK | Parity proof | Rollback flag |
|---|---|---|---|---|
| 1 | done-recog `claude`+deterministic | raw SDK `messages.parse` | verdict object match over corpus | `LOKI_SDK_DONE_RECOG` |
| 2 | all six judge `case` arms (+ codex/cline/aider) | raw SDK judges | per-cluster verdict/text match | per-cluster flag |
| 3 | `--agents` + heuristic council | Agent SDK `agents` | votes/round-N.json match | council SDK flag |
| 4 | full bash RARV route | Agent SDK `query()` loop | cost/gate/completion match over PRD corpus | `LOKI_SDK_LOOP` / `LOKI_LEGACY_BASH` |
| 5 | migration/heal `case` arms | Agent SDK `query()` | display/output equivalence | per-site flag |

In every phase the codex/cline/aider `case` arms are untouched, and bash is the live route until the SDK route passes parity in `local-ci.sh`.

---

## 6. RARV-C / council / memory → SDK primitives (honest mapping)

| Component | Verdict | Grounding |
|---|---|---|
| RARV-C outer loop (`run_autonomous`) | **KEEP** — no SDK primitive replaces it | No `outcome`/iterate-until-grader-says-done in the Agent SDK (verified live). Managed Agents' Outcomes (`user.define_outcome` + rubric, hosted REST) is the nearest analog but is a **different product** — hosting completion on Anthropic's grader would cede Loki's council. Do NOT wire it. |
| The 8 quality gates + evidence/checklist/heldout/assumption gates | **KEEP** — deterministic graders, zero SDK equivalent | Loki's trust moat. Already ported: `quality_gates.ts`. |
| `build_prompt()` | **KEEP verbatim** — SDK consumes its string | Parity-locked with `build_prompt.ts`. `[CACHE_BREAKPOINT]` becomes a real `cache_control` split (E). |
| Completion council dispatch | **WRAP** — `--agents`→`agents`, `--json-schema`→`outputFormat` | Cleanest SDK fit. Delete `VOTE:` regex fallback. KEEP threshold-floor/quorum/devil's-advocate. |
| `memory/` package (15 modules) | **KEEP** — richer than any SDK memory feature | SDK `AgentDefinition.memory` is a source selector, not task-aware top-k retrieval / episodic→semantic consolidation / anti-pattern retrieval / cross-project RAG. Retrieved text still flows into `prompt` (or `systemPrompt.append` for better prefix-cache). **Preserve `rag_injector.py` sanitization** — the SDK does not sanitize stored memory (prompt-injection property). |
| `memory/managed_memory/` | **KEEP** (already on `anthropic` SDK, default-OFF) | The one existing SDK touchpoint; gated on `LOKI_MANAGED_MEMORY=true`. Out of the critical path. |
| Session UUID + resume/fork | **WRAP** — field-for-field SDK options | KEEP stateless-per-iteration design. `resumeSessionAt`/`listSessions` are E wins. |

The founder's "SDK outcome may map onto RARV-C" hypothesis is **false per live docs**. The SDK gives a bounded tool-use loop; the iterate-until-council-says-done loop stays Loki's. This is a WRAP-the-invocation migration, not a re-architecture.

---

## 7. Provider-agnosticism (where Anthropic-only forces a claude-gated path)

Both SDKs are Anthropic-specific. 18 of 25 model-work sites already branch to codex/cline/aider in the same `case`. The v8 SDK port replaces ONLY the `claude)` arm; the sibling arms keep their bash invocation:

- Codex: `codex exec --sandbox workspace-write` (`CODEX_MODEL_REASONING_EFFORT` env). Ported model in `providers.ts` codex arm.
- Cline: `invoke_cline` / `cline -y`.
- Aider: `aider --message ... --yes-always`.

The provider loader gates the SDK path on `LOKI_PROVIDER=claude`. The 7 CLAUDE-ONLY sites (B7, C1, C3, D1-D4) have no cross-provider story today and gain none from v8. An OpenAI-compatible layer (Codex/Cline via a shared HTTP client) is a **LATER arc, explicitly out of scope here**. The bash route staying alive per-piece IS the multi-provider + rollback fallback until each SDK piece is proven.

---

## 8. Risks + unknowns (spikes needed)

All UNVERIFIED items from the research, plus what the phases surface:

1. **Bun + Agent SDK bundled binary (Spike A, gates Phase 3/4).** Whether Bun 1.3.13 resolves the platform-gated `optionalDependencies` and spawns the bundled `claude` binary cleanly is unverified. If not: loop under Node 22+, judges under Bun (raw SDK is pure JS, Bun-safe). Test before choosing the loop runtime.
2. **`--max-budget-usd` has NO raw-SDK equivalent (§2 #15).** Confirmed absent from `messages.create`. Agent SDK exposes `maxBudgetUsd` per research; verify in `sdk.d.ts@0.3.207` (Spike C). Regardless, keep Loki's deterministic cumulative budget gate (`budget.ts`) on both paths — do not delegate budget enforcement to the SDK.
3. **`--fallback-model` (§2 #16).** Agent SDK `fallbackModel` field reported present but not code-verified; raw SDK has no per-call fallback field for Opus/Sonnet (server-side `fallbacks` is Fable-5-only beta). Implement catch-and-retry on the judge path as the safe default; use `fallbackModel` on the loop path only after Spike C confirms it.
4. **UNVERIFIED SDK type shapes.** `SDKAssistantMessage`/`SDKPartialAssistantMessage` content-block shapes, `ThinkingConfig` union, `CanUseTool` options — the fields exist but inner shapes must be re-read from `sdk.d.ts@0.3.207` before writing the stream parser (Phase 4). The verified `.d.ts` is at `scratchpad/package/sdk.d.ts`.
5. **Only one valid `SdkBeta`** (`context-1m-2025-08-07`). Other API betas (compaction, fast-mode) are not first-class Agent SDK options. If a phase needs one, it may require the raw SDK path instead.
6. **Bedrock/Vertex/Foundry env pass-through** through the Agent SDK `env` option is documented at overview level, not shown as a `query()` example — smoke-test before promising enterprise cloud auth in the SaaS pitch.
7. **Cluster D (§2.1)** — `ultrareview`/`ultracode`/`remote-control` have no SDK equivalent. v8 keeps the binary carve-out; "zero binary" is hot-path-only until a later arc reimplements them.
8. **Managed Agents temptation.** It IS the hosted grader/outcome loop the founder hypothesized, but adopting it cedes Loki's council and re-platforms completion onto Anthropic's grader. Deliberately NOT wired in v8. Flag if the founder wants to reconsider — it is a strategy decision, not a migration step.
9. **Model-name drift.** The codebase memory carries placeholder model names; wire the verified live IDs (`claude-opus-4-8` / `claude-sonnet-5` / `claude-haiku-4-5`, §1.4). Re-verify against the live model catalog at implementation time (IDs evolve).

---

## 9. The first implementable work item (concrete enough to start)

**Phase 1: migrate done-recognition to the raw SDK behind `LOKI_SDK_DONE_RECOG=1`.**

Preconditions: run Spike A/B/C first (they are cheap throwaway scripts and de-risk the whole arc). Then:

1. `cd loki-ts && bun add @anthropic-ai/sdk` (pure JS, Bun-safe — no binary).
2. Create `loki-ts/src/runner/sdk_invoker.ts` exporting a judge function:
   - Input: `{ prompt: string, schemaPath: string, model: string, effort: string, timeoutMs: number }`.
   - Body: `const client = new Anthropic()` (reads `ANTHROPIC_API_KEY`); `client.messages.create({ model, max_tokens: 16000, output_config: { format: { type: 'json_schema', schema } }, messages: [{ role: 'user', content: prompt }] })`; parse the single text block as JSON (guaranteed valid by `output_config.format`). Model `claude-haiku-4-5`, effort `low`.
   - Return the parsed object; on any error, throw so the caller falls to the deterministic path (inconclusive-safe, matching current behavior).
   - Load the schema from `loki-ts/data/done-recognition-schema.json` (already exists; do not invent a schema).
3. In `autonomy/lib/done-recognition.sh`, add a branch at the top of the invoke helper: if `LOKI_SDK_DONE_RECOG=1` and `ANTHROPIC_API_KEY` is set, shell into `bun loki-ts/... internal done-recog-sdk "$prompt"` (a thin `internal` subcommand wrapping the judge function); otherwise keep the existing `claude -p --json-schema` → deterministic fallback chain exactly as-is.
4. Parity harness: a script that runs the same fixed set of `.loki` states through both `LOKI_SDK_DONE_RECOG=0` and `=1`, asserts the parsed `requirements` verdict object is equal, and cleans up. Add it to `scripts/local-ci.sh`'s bun-parity matrix.
5. Do NOT bump version, do NOT commit, do NOT touch any other site. One helper, one flag, one parity test.

This proves the entire bridge (SDK auth from env, structured output via `output_config.format`, schema reuse, bash-fallback rollback, parity testing) on the single lowest-risk CLAUDE-ONLY site before anything touches the RARV hot path.

---

## Appendix: verified sources

- Agent SDK types: unpacked `@anthropic-ai/claude-agent-sdk@0.3.207` `sdk.d.ts` (6923 lines) at `scratchpad/package/sdk.d.ts`.
- Raw SDK: `@anthropic-ai/sdk@0.111.0`; `messages.parse` / `output_config.format` / `task_budget` / model IDs from the live claude-api skill (authoritative for API shapes).
- Installed `claude` CLI: v2.1.207.
- Existing TS runner: `loki-ts/src/runner/` (12,300 lines, parity-locked, NOT reached for `start` per `run.sh:17271`).
- Bash invocation surface: `autonomy/run.sh:17195-17369`, `lib/claude-flags.sh`, `lib/done-recognition.sh`, `lib/prd-enrich.sh`, `completion-council.sh`, `council-v2.sh`, `grill.sh`, `lib/voter-agents.sh`, `providers/claude.sh`.
- Existing rollback flag + router: `bin/loki` (`LOKI_LEGACY_BASH`, per-command Bun routing).
- Model IDs: live catalog — `claude-opus-4-8`, `claude-sonnet-5`, `claude-haiku-4-5`.
