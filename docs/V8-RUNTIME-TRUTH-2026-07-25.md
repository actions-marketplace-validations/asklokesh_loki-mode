# V8 Runtime Truth Audit (Phase 0)

Date: 2026-07-25. Source-verified. Gates the SDK-default flip (task #12).

Method: read the actual code paths, not the comments describing them. Where a
claim concerns the Agent SDK's own capabilities, it is checked against the
primary docs (code.claude.com), not inferred.

## Executive summary

The v8 SDK route is **better engineered than the competitive research assumed**
on the two properties that matter most for trust, and has **one concrete,
fixable gap** that genuinely blocks flipping it to default.

| Property | Status |
|---|---|
| Fail-closed on error | **SOUND** |
| No silent CLI fallback | **SOUND** |
| Module-resolution fail-fast | **SOUND** |
| Rollback escape hatch | **SOUND** |
| Structured degradation event | **ADDED 2026-07-25** |
| Stagnation / done-signal valves | **PORTED 2026-07-24** |
| **Session continuity across iterations** | **GAP - blocks the flip** |

## 1. Route resolution (verified)

`selectClaudeInvokerKind()` (`loki-ts/src/runner/providers.ts`) is pure over env,
so the rollback path is unit-testable without spawning a process:

1. `LOKI_LEGACY_BASH` truthy -> `legacy`. **The rollback always wins**, even if
   the loop is opted-on or later becomes default-on.
2. else `LOKI_SDK_LOOP` truthy -> `sdk`.
3. else -> `legacy` (default-off; byte-identical to v8 as shipped).

`LOKI_SDK_MODE` normalizes to `off|judges|full` on both routes with a fail-safe:
an unknown value falls back to `off`, so the SDK can never be switched on by a
typo. Mirrored byte-for-byte in `autonomy/lib/sdk-mode.sh` and
`loki-ts/src/runner/sdk_mode.ts`.

## 2. Fail-closed behavior (verified, and stronger than claimed)

The research asserted the SDK path might "silently fall back to the CLI". It
does not. In `providers.ts`:

- The SDK is loaded by a **lazy dynamic import**, so the default-off path never
  pays to load it.
- A load failure (SDK missing, platform binary absent) sets `exitCode = 1`.
  There is no CLI fallback branch to take.
- A thrown `query()` is caught, appends the error to captured text, and leaves
  `exitCode = 1`.
- **`exitCode = res.sawResult ? res.exitCode : 1`** - a stream that never
  produced a terminal result is a FAILED iteration, never counted as success.
  This is the property that stops a broken SDK run from being read as a green
  build.

Module resolution is equally strict. `requireModule()`
(`loki-ts/src/runner/autonomous.ts:356`) throws on an unloadable helper rather
than substituting a stub, and the surrounding comment documents why the previous
stubs were removed: they "degraded SILENTLY to WRONG results rather than safe
no-ops".

**Conclusion: acceptance item #3 (no silent SDK-full fallback to legacy) is
SATISFIED in behavior.** What was missing was observability, addressed below.

## 3. Capability degradation is now observable (added this session)

Before: an SDK load or stream failure existed only as prose inside the captured
output. An operator running unattended had nothing to alert on, and no way to
distinguish "the SDK could not load" from "the model did poor work".

Now: `emitSdkDegradationEvent()` appends a structured record to the SAME
append-only `.loki/events.jsonl` stream the hook events use, with the same
`{type, source, timestamp, payload}` envelope, so every existing consumer picks
it up for free:

```json
{"type":"capability_degraded","source":"sdk_loop","timestamp":"...",
 "payload":{"capability":"sdk_query","fail_closed":true,"reason":"...",
            "tier":"...","model":"...","iteration":"..."}}
```

`fail_closed: true` is stated in the record rather than left for a reader to
assume. Deliberately **no new env var**: this is signal an operator always
wants, and a knob to enable your own error reporting is a knob nobody finds.
Guarded by `loki-ts/tests/runner/sdk_degradation_event.test.ts` (5 tests),
including the load-bearing property that it NEVER throws - a diagnostic that
breaks the run it describes is worse than no diagnostic.

## 4. THE GAP: no session continuity on the SDK route

**This is the finding that blocks the flip.**

The legacy invoker stamps and resumes model sessions: `sessionResumeArgv()` /
`sessionStampArgv()` emit `--session-id` on a fresh run, or `--resume <uuid>`
(plus optional `--fork-session`) on a restarted run when `LOKI_RESUME_SESSION=1`
(`providers.ts`, the resume-or-stamp decision mirroring run.sh).

The SDK `query()` path has **no equivalent**. A grep for
`resume|session|continue` across the entire SDK invoker block returns nothing.
Every RARV iteration is a fresh `query()` with no conversation continuity.

**This is not a platform limitation.** Verified against the primary Agent SDK
docs (code.claude.com/docs/en/agent-sdk/sessions): `query()` supports
- `resume: <session_id>` - resume a specific past session,
- `forkSession: true` - branch without losing the original,
- `continue: true` - resume the most recent session in the cwd.

Session IDs are readable from `SDKResultMessage.session_id` (and earlier from
the init `SystemMessage`). Transcripts persist at
`~/.claude/projects/<encoded-cwd>/<session-id>.jsonl`, where `<encoded-cwd>` is
the absolute cwd with every non-alphanumeric character replaced by `-`.

**Consequence if flipped as-is:** the default route would silently lose
cross-iteration context that the legacy route preserves. The agent would
re-derive prior analysis each iteration - worse results AND higher token spend,
with no error to signal it. That is a quiet capability regression, the exact
class this audit exists to prevent.

**Note the cwd caveat** (docs, verbatim): if a `resume` call runs from a
different directory the SDK looks in the wrong place and silently returns a
FRESH session rather than erroring. Any port must pin cwd and assert the
resumed session is actually the intended one, or it will appear to work while
doing nothing.

## 5. Flip prerequisites (task #12)

The approved plan authorizes the flip conditionally: only once parity AND
recovery tests pass. Current state:

| Prerequisite | Status |
|---|---|
| Stagnation + done-signal valves on TS route | **DONE** (2026-07-24, 10 tests, 9 fail against the pre-port stub) |
| No silent fallback | **DONE** (verified sound; degradation event added) |
| Session continuity parity | **NOT DONE - blocker** |
| Acceptance #1 (SDK-full works with `claude` binary absent) | Untested. No binary dependency found in the SDK path, but absence of a grep hit is not a test. |
| Acceptance #7 (SIGKILL recoverable without corruption) | Untested |
| Acceptance #8 (resume does not repeat irreversible actions) | Untested, and depends on session continuity landing first |

**Recommendation: DO NOT FLIP.** Three of six prerequisites are unmet, and one
is a genuine capability regression rather than a missing test. The flip is a
one-line change whose safety is entirely supplied by the work around it.

## 6. What this audit deliberately does not claim

This covers the claude-provider SDK path, route resolution, fail-closed
semantics, and session continuity. It does NOT cover: the judge/subcall path in
detail, MCP tool loading under SDK-full, budget/effort propagation, or the
Codex/Cline/Aider adapters. Those remain untriaged and are the natural next
slice.
