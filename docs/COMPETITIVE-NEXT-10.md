# The next items vs Factory.ai and 8090

Written 2026-09-09. Every item below cites a file:line, a command output, or a
fetched URL. Items that research proposed but that turned out to be **already
shipped** are listed at the bottom under "Not items" with the evidence, because
a plan that re-builds working code is worse than a shorter plan.

There are **eight** real items, not ten. Three of the research's candidates were
already implemented, and two more are architecturally unavailable to Loki as
designed. Padding to ten would mean inventing work.

Items 1, 2 and 7 shipped in v9.27.0-v9.27.3. Item 8 was found by this work
rather than by the research: a flaky trust suite that cost two release cycles.
It is listed OPEN and unpatched, with the reason stated, rather than quietly
fixed by loosening an assertion.

---

## What the market actually rewards

Both competitors lead with **governance, not speed**. Factory.ai ($150M Series C,
Apr 2026) sells fleets of droids under "engineers governing how much autonomy
each workflow receives". 8090 ($135M Series A, EY partnership) sells a "governed
multiplayer platform under human-led oversight".

Loki's wedge is the same shape and sharper: **the only agent that hands you a
receipt you can check yourself.** The items below are ranked by how much each
one strengthens a claim a buyer can verify without trusting us.

---

## 1. Model provenance on the receipt -- SHIPPED v9.27.0

**Corrected.** An earlier draft of this item claimed the exogenous/advisory gate
split, files-changed and cost "do not reach the top of the receipt". That was
wrong, and reading the renderers disproved it: `proof-template.html:1165-1192`
already renders the split with the strongest honesty framing in the repo
("a model that is confidently wrong scores itself green here"), plus
disabled-gate disclosure, cost, tokens, wall clock and files changed.

Five of the six fields were already shipped. **One was genuinely missing:**
per-iteration model attribution. `autonomy/lib/decision_record.py` writes an
append-only trail to `.loki/decisions/decisions.jsonl` once per dispatch, and
already computes the audit fact worth showing -- `model_changed`, meaning more
than one model id served one project. The proof generator read that file
**zero times**.

That is the question a regulated buyer actually asks, and the one Factory users
complain about: did the deciding component change mid-run without anyone saying
so? The run-level "Model" row cannot answer it.

**Shipped in v9.27.0** in both renderers, with three states never collapsed --
`measured`, `no_records`, `unreadable`. An absent trail is reported as absent
rather than rendered as silence that reads like "no swap happened", corrupt
trail lines are counted rather than dropped, and `affects_verdict` is `false`:
a mid-flight change is a disclosed fact (tier clamp, operator override,
failover all cause it legitimately), never a fault and never a verdict input.

## 2. Make the machine contract discoverable

**Status: the contract exists and is documented; it is invisible where a user
would look.**

`docs/exit-codes.md` documents a genuinely good tiered contract: with
`LOKI_DURABLE_STATE=1`, `loki start` distinguishes "failed the quality gate"
from "crashed" -- written for a Kubernetes Job or an ECS task. `loki verify` has
its own documented contract (`docs/exit-codes.md:53`).

But `loki start --help` mentions `LOKI_DURABLE_STATE` **zero times** (measured).
A CI author reads `--help`, sees "0 on success, nonzero on failure", and builds
the coarse gate. Factory's `droid exec` advertises its exit codes in its own help
output; ours are a doc you have to already know exists.

**Shipped in v9.27.1** for `loki start --help`: the two-tier contract, code 20,
its retry semantics, and a pointer to `docs/exit-codes.md`. A drift assertion
fails if the code stated in the help stops matching the code in the doc, since
two documents disagreeing about a value a Kubernetes Job is configured on is
worse than one.

`loki verify --help` needed no change -- it already carried an `EXIT CODES`
section. Adding a second one (which I briefly did) would have created exactly
the duplicated-and-drifting help this item exists to prevent; a test now asserts
there is exactly one.

**Note:** the research framed this as "Loki has no headless one-shot contract".
That framing was wrong -- the contract exists. The defect is discoverability,
which is a much cheaper fix.

---

## 3. Publish a measured kill-switch latency

**Status: mechanism exists, number does not.**

`check_human_intervention()` (`autonomy/run.sh`) implements PAUSE/STOP/INPUT.
There is no stated termination window anywhere in `docs/` (measured: zero
matches for "termination window" or "kill switch").

An enterprise buyer asks "how fast can I stop it?" Factory answers with a number.
"There is a stop signal" is not an answer.

**Do:** measure worst-case latency from signal to process exit across the bash
and Bun routes, publish the number, and add a test that fails if it regresses
past the published bound.

**Care:** publish the measured worst case, not the median. A number we beat 50%
of the time is worse than no number.

---

## 4. Close the config-diagnostic gap for the remaining format

**Status: shipped for JSON, `.env`, and YAML. Narrow residual gap only.**

`loki config validate` reports unknown keys in JSON and `.env` (v9.26.1) and in
YAML via pyyaml with a `yq` fallback (v9.26.2). `yq` is preinstalled on the
GitHub ubuntu-24.04 runner, and the fallback was verified against a stand-in
honouring both invocation shapes the real `yq` is called with, so CI and any
Linux host with either parser get full detection.

The residual gap is narrow: a host with **neither** pyyaml nor `yq` (a stock
macOS dev machine) gets no YAML detection. It degrades quietly, which is correct
-- a missing parser must never invent a verdict -- but silently.

**Do:** state the dependency in `loki config validate --help` so the gap is
visible rather than silent. Vendoring a YAML scanner is not worth it for one
host shape that already has a documented fallback available via `brew install
yq`.

---

## 5. `loki init` writes a config nothing reads

**Status: confirmed defect, low blast radius.**

`loki init` writes `.loki/loki.config.json` with six behavioral-looking keys --
`provider`, `complexity`, `quality_gates`, `parallel_mode`, `dashboard` -- and
labels it "project configuration" (`autonomy/loki:16598`). **Nothing reads any
of them** (measured: 0 read sites for all five; the only `template` match is a
comment). A user who sets `"quality_gates": false` is silently ignored.

Note this is a *different file* from `.loki/config.json`, which is live and is
read for `memory.disabled` and `otel_endpoint`.

**Mitigated already:** as of v9.26.1, `loki config validate` on that file
reports each dead key by name. The gap is now diagnosable rather than silent.

**Do:** the honest minimum is to stop describing it as "project configuration".
Removing the keys outright flips `tests/test-init-command.sh:141`, which asserts
`'provider' in d` -- so that is a deliberate contract change, not a cleanup.

---

## 6. Verdict influence for the LLM review stage

**Status: stage ships in v9.26.0/9.26.1; verdict influence deliberately deferred.**

`llm_review` now runs by default and is recorded, but `affects_verdict` is
`false`. That was the right call for the release -- flipping it would silently
break anyone gating CI on exit 0.

**Do:** measure the reviewer on real diffs, then promote verdict influence behind
an explicit flag (`--llm-blocks`) before considering it as a default. The
sequencing matters more than the speed: a reviewer that returns CONCERNS where
deterministic-only returned VERIFIED is a breaking change to a published exit
contract.

---

## 7. Make the deferred-suite gap structural

**Status: process defect, cost two broken releases this cycle.**

v9.25.0 and v9.25.1 both failed to publish because a check that guards the
shipped artifact was **deferred by the fast tier** -- the only tier that runs
before every push. v9.26.0 failed the same way on repo-wide ShellCheck.

CLAUDE.md already states the rule ("a check that guards the shipped artifact must
run in the FAST tier"). The rule is not enforced.

**Shipped in v9.26.3** as `scripts/guard-changed.sh`: runs the suites that
reference the files in your diff, plus ShellCheck on the changed shell files.
Measured 8s for a one-file change, ~135s worst case, against 26m50s for the FULL
tier. Verified it would have blocked the v9.26.0 push locally.

**Remaining:** it is necessary, not sufficient. It cannot catch a failure that
depends on CI differing from your machine -- which is exactly how v9.26.2 failed,
on a suite this script selects and runs. The follow-on work is making
environment-conditional assertions name their condition (`command -v yq`) rather
than assume the author's host. That is a review habit, not a script.

---

## 8. Fix the flaky assurance-tail suite (OPEN, not yet fixed)

**Status: mechanism identified, not reproduced locally, deliberately not patched.**

`tests/test-review-assurance-tail.sh` has failed CI twice on unrelated commits
(v9.26.3 and v9.27.1), each costing a release cycle. Three different assertions
failed across the two incidents:

- `semantic shard FAIL: calls=3 (expected 4)`
- `valid structured requirements coverage did not pass`
- `requirements-forged-pass-error escaped parent-bound result publication`

They share a mechanism: the suite drives **real background subshells** (`sleep 30`,
`&`) and asserts **exact provider-call counts** (`= "1"`, `= "4"`) while also
testing that a FAIL *cancels* sibling lineages. On a 4-way-sharded runner the
cancellation can land before the last dispatch is logged, so the count races.

The suite already anticipates contention: `REVIEW_TIMEOUT_SCALE` is 4x when
`LOKI_TEST_SHARD` is set, and CI does set it (`.github/workflows/test.yml:149`).
So the timeout budget is **not** the binding constraint -- the exact-equality
call counts are.

**Why it is not patched here.** Both incidents were settled by a rerun on the
identical SHA (green both times), which proves flake and diff-innocence without
touching a fail-closed trust suite. It did not reproduce locally across six runs
including shard-scaled and CPU-loaded ones. Relaxing an exact count on a theory
would weaken a gate that deliberately distinguishes a LOST shard from a
CANCELLED one.

**Do:** make the timing deterministic rather than the assertion looser -- have
each dispatch log its intent *before* the call rather than after, so the count is
stable regardless of when cancellation lands. That changes the contract the suite
guards, so it needs its own cycle with the expected counts re-derived.

---

## Not items (research proposed these; they are already shipped)

- **Signed receipts default-off is a moat gated behind an env var.** The receipt
  already states signature status explicitly in both directions
  (`proof-generator.py:1808-1820`): SIGNED, or UNSIGNED with the honest line that
  the integrity hash "does NOT prove who produced them, so this receipt trusts
  its generator." That is the shippable version. Do **not** flip
  `LOKI_PROOF_GPG_KEY` to default-on: with no key present it would either fail
  the run or silently emit no signature, and the second is the false-green this
  project exists to prevent. Key distribution is a founder decision.
- **OTEL to a customer-owned collector.** Already implemented -- `otel_endpoint`
  is persisted and read (`autonomy/loki:26755`, `:26828-26837`).
- **A headless exec contract with documented exit codes.** Already exists via
  `LOKI_DURABLE_STATE=1`; see item 2, which is the real (smaller) gap.

## Architecturally unavailable, and worth saying so

- **Per-command risk tiers** and a **hard command blocklist** ("cannot be
  bypassed by approval", per Factory's docs). `autonomy/run.sh:515` documents
  that `LOKI_ALLOWED_PATHS` "does NOT restrict provider-driven agent writes
  (run.sh never sees them)". You cannot classify a command you never observe.
  The only honest form is a sandbox-boundary blocklist, which is a different and
  much larger piece of work. Attempting a partial version would ship a security
  claim we cannot keep.
