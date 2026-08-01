# Environment variables

The operator-facing knobs, with defaults read from the source rather than from
memory. Every variable on this page is asserted by a test to still exist, so
this document cannot quietly rot into fiction.

## What this page is not

The codebase references a few hundred `LOKI_*` tokens. Most are internal
plumbing between the CLI and the runner (`LOKI_REG_TARGET`,
`LOKI_CI_JSON_FINDINGS`, and similar), or prefix fragments that are never a
whole variable. Publishing that number as an "operator surface" would be
misleading, so this page covers only what an operator would deliberately set.

`loki config schema` lists 64 more keys that map to environment variables and
can be written to `.loki/config.yaml`. Those are not repeated here. The
variables below are the ones **not** in that schema -- historically the ones
with nowhere to look them up.

## Running a build

| Variable | Default | Effect |
|---|---|---|
| `LOKI_PRD_FILE` | none | Path to a spec file, as an alternative to the positional argument. |
| `LOKI_MAX_ITERATIONS` | `1000` | Hard cap on iterations. Reaching it is a deterministic terminal failure, not a success. Also in `config schema`. |
| `LOKI_BUDGET_LIMIT` | unset (no cap) | Spend cap in USD. On exhaustion the run stops and reports a terminal failure -- see [exit codes](./exit-codes.md). |
| `LOKI_MAX_DURATION` | unset (no cap) | Wall-clock cap in seconds. Stops cleanly at the next iteration boundary with a `max_duration_reached` terminal status. `loki start --max-duration` also accepts `90m` / `2h`. |
| `LOKI_AUTO_CONFIRM` | unset | `true`/`false` to control prompts. Takes precedence over `CI`. |
| `LOKI_CONFIG_DUMP` | `0` | `1` prints the resolved configuration and exits **without starting a run or spending anything**. |

For a cost estimate before committing to a run, `loki plan <spec> --json` is
the better tool: it reports complexity, iterations, tokens and cost without
executing. See [cost controls](./cost-controls.md) for how the three caps
interact and why hitting one is a failure rather than a success.

## Choosing a model and provider

| Variable | Default | Effect |
|---|---|---|
| `LOKI_PROVIDER` | `claude` | `claude`, `cline`, `codex`, `aider`, or `opencode`. |
| `LOKI_SESSION_MODEL` | `medium` | The capability tier for the run: `small`, `medium`, or `high`. See below. |
| `LOKI_MAX_TIER` | unlimited | Caps model tier, so a run cannot escalate past what you are willing to pay for. |
| `LOKI_MODEL_OVERRIDE` | unset | Overrides the resolved model outright. |
| `LOKI_TIER` | `oss` | **Not a model setting.** The open-core licensing seam. Leave it unset. |

### Picking a model without naming one

You do not need to know any vendor's model names. Ask for a capability class
and each provider supplies its own latest model in that class:

| Tier | Means | Claude | Codex | Cline / Aider / OpenCode |
|---|---|---|---|---|
| `small` | cheap and fast | `claude-haiku-4-5` | account default | `deepseek-chat` |
| `medium` | the workhorse (**default**) | `claude-sonnet-5` | account default | `deepseek-v3.2` |
| `high` | the most capable | `claude-opus-4-8` | account default | `deepseek-v3.2` |

```bash
LOKI_SESSION_MODEL=small loki start ./prd.md    # or: loki start --session-model small ./prd.md
```

`medium` is the default and resolves to the same model today's builds already
use, so setting it explicitly changes nothing. The older spellings
(`fast`/`development`/`planning`, and the Claude aliases `haiku`/`sonnet`/
`opus`) still work and are unchanged.

**To see what a tier actually resolves to on your machine, run `loki provider
models`.** It prints the dispatched model per tier per provider along with
which environment variable set it, so you can verify what you will really get
rather than trusting the table above. Codex deliberately shows a provider
default: it sends no `--model` flag and lets Codex pick a model appropriate to
your account, because a hardcoded name breaks ChatGPT-account users.

Override a single tier for one provider with `LOKI_<PROVIDER>_MODEL_<TIER>`
(for example `LOKI_CLAUDE_MODEL_FAST=claude-haiku-4-5`), or every tier at once
with `LOKI_<PROVIDER>_MODEL`.

`LOKI_MAX_TIER` is the cost control worth knowing: it bounds escalation, while
`LOKI_BUDGET_LIMIT` bounds total spend. They answer different questions and are
usefully set together. Note that `LOKI_MAX_TIER` is a **ceiling** and
`LOKI_SESSION_MODEL` is a **choice** -- the ceiling still clamps the choice.

## Output volume

| Variable | Default | Effect |
|---|---|---|
| `LOKI_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, or `error`. |
| `LOKI_QUIET` | `0` | `1` is shorthand for `warn`. |

**Errors are never suppressed.** `error` is the floor, so even the quietest
setting still prints failures -- a verbosity control that could hide why a
build failed would be a footgun. An unrecognized value falls back to `info`
rather than silencing the run, so a typo in a pipeline config cannot blind you.

Available as flags too: `loki start --quiet`, `loki start --log-level LEVEL`.

Decorative output (the HUD, the completion card, the start headline) already
suppresses itself when stdout is not a TTY, so CI logs were never the wall of
banners you might expect. These variables control the remaining `[INFO]` and
`[STEP]` lines.

## Platform integration

| Variable | Default | Effect |
|---|---|---|
| `LOKI_DURABLE_STATE` | `0` | `1` enables durable state **and** the richer process-exit contract that lets Kubernetes distinguish a deterministic failure from a crash. See [exit codes](./exit-codes.md). |
| `LOKI_SDK_LOOP` | unset | Routes the run through the Bun/TypeScript runner instead of bash. Both implement the same exit contract. |

`LOKI_DURABLE_STATE=1` is the one to set in a Job or task definition. Without
it every failure collapses to exit 1 and the platform cannot tell "re-running
this is pointless" from "this crashed and should resume".

## Precedence

Command-line flags beat environment variables, which beat `.loki/config.yaml`,
which beats `~/.config/loki-mode/config.yaml`.

To see what actually resolved, without starting a run:

```sh
LOKI_CONFIG_DUMP=1 loki start ./prd.md
```

## Setting these persistently

`loki config set` writes to the config file for the keys it supports:

```sh
loki config set budget 25
loki config set provider claude
loki config set maxTier sonnet
```

`loki config schema` lists every key the config file understands, and
`loki config show` prints the current effective values.
