# v8 acceptance-test triage (partial, in progress)

Date: 2026-07-24. Read-only audit against the v8 competitive plan (P2).
Method: source-verified only. A filename containing a relevant word does NOT
count as EXISTS; the assertion or enforcing code must be read.

## Why this triage exists

Source 08 proposes 26 release-blocking acceptance tests. The plan's P2 says
triage them EXISTS / PARTIAL / NET-NEW before treating any as work, because
three earlier "gaps" from the same research corpus turned out already shipped
(evidence-in-PR, the offline verifier, stuck-detection signals). Writing this as
"add 26 tests" would repeat that error at 26x scale.

Repo has 456 files under `tests/`.

## Verified so far

| # | Test | Verdict | Evidence |
|---|---|---|---|
| 15 | empty diff != complete | **EXISTS** | `tests/test-evidence-gate.sh` enumerates 13 gate cases including case 2 "empty diff (baseline==HEAD, clean) -> BLOCK (rc 1), reason empty_diff" (`:21`), case 10 "empty diff + red tests -> BLOCK, reason empty_diff_and_tests_red" (`:29`), case 13 "truly-empty run (no untracked) -> BLOCK, reason empty_diff" (`:32`). Enforced in `autonomy/lib/proof-generator.py:1238` ("A non-empty diff is a PREREQUISITE for VERIFIED") and `autonomy/verify.sh:2067` ("empty diff yields CONCERNS (nothing to verify), never VERIFIED"). Note `test-evidence-gate.sh:126` explicitly guards against a false-pass where `.loki/` being untracked would mask the empty-diff BLOCK. |
| 19 | unhealthy app != complete | **EXISTS** | `tests/test-evidence-boot-axis.sh` drives the REAL `council_evidence_gate` (sourced from `autonomy/completion-council.sh`, not a mock) with synthetic app-runner fixtures, isolating the boot axis by making the diff and test axes pass. Contract (`:2-7`): a SERVEABLE app confirmed unhealthy -> BLOCK; a non-web project (no serveable runner) or an un-probed one -> inconclusive pass-through, so a CLI/library build cannot deadlock. Health source is `.loki/app-runner/health.json` written by `app_runner_health_check`. |

| 20 | stale/forged evidence != new run | **EXISTS (partial, honestly scoped)** | `tests/test-proof-forgery-defense.sh` locks THREE facts about `proof-verify.py` (v7.111.0) and is deliberately explicit that the non-forgeability gap is MITIGATED AND RELABELED, NOT closed: (a) genuine proof -> `ok:true, headline_consistent:true`; (b) INCONSISTENT forgery (headline flipped to VERIFIED, facts left `not_run`, hash recomputed) -> `ok:false, headline_consistent:false`; (c) CONSISTENT forgery on the UNSIGNED path -> STILL `ok:true`, reporting `generator_trusted:true`. |

### Note: item 20's test is itself moat evidence

Case (c) is a test written to STOP THE PROJECT OVERCLAIMING ITS OWN SECURITY. It
asserts that a forger who rewrites both the facts and the headline into a
mutually consistent lie and recomputes the hash STILL PASSES on the unsigned
path. Neutral non-forgeability requires the signed record. This is the same
honesty-engineering signal as the v7.111.0 removal of Loki's own false
"non-forgeable" claim, and it is rare: most projects test that their defense
works, not that it does not work as well as marketing might imply.

Direct consequence for the plan: it names exactly what receipt SIGNING buys
(neutral non-forgeability against a consistent forger), which is the remaining
half of the "sign the receipt" item. The verifier and GPG path already exist in
`autonomy/lib/proof-verify.py` (`_verify_gpg`); what is missing is key
distribution and a signed-by-default path, not the mechanism.

## Strong candidates located, NOT yet assertion-verified

Do not treat these as EXISTS until the assertion is read. Listed so the next
pass does not re-derive them:

- #16 failing tests != complete: `test-evidence-gate-rc.sh`,
  `test-evidence-gate-no-tests.sh`, `test-completion-route-evidence-gate.sh`
- #17 fake test output cannot satisfy gate: `test-enforce-mutation-integrity.sh`,
  `detect-test-mutations.sh`
- #18 mock-only cannot satisfy prod completion: `detect-mock-problems.sh`,
  `test-nomock-data-render.sh`
- #20 stale evidence != new run: `test-proof-forgery-defense.sh`,
  `tests/test_proof_verify.py`, `test-completion-signal-consume.sh`. R-DET-1
  anti-stale guard is the run_id pointer at `.loki/state/last-proof-id.txt`.
- #24 trust-core regressions: `test-completion-council-affirmative-evidence.sh`,
  `test-iteration-complete-accuracy.sh`

## Known NET-NEW (verified elsewhere this session)

- **#3 no SDK-full silent fallback to legacy** and the stuck/stagnation coverage:
  see the SDK-loop valve gap. `loki-ts/src/runner/council.ts:150-165` states the
  stagnation and done-signal force-stop valves are NOT active on the TS/SDK
  route (`trackIteration` writes placeholder zeros). Bash has both valves
  (`autonomy/completion-council.sh:4519`, `:4528`). This is a HARD PREREQUISITE
  of the SDK-default flip, tracked in the plan under P1, contract defined by
  `tests/test-council-structured-done-signal.sh`.

## Not yet triaged

1-14, 22, 23, 25, 26. Items 1-14 concern SDK runtime truth, crash/resume,
cancel, sandbox cleanup, secrets and network isolation; several are likely
PARTIAL and are downstream of the Phase-0 runtime-truth audit in P1 anyway.

## Honest status

This triage is INCOMPLETE. It is published partial rather than padded, because a
plausible-looking full table with unverified rows is worse than an admitted gap
(the exact failure mode this plan is built to avoid). Two delegated audit agents
returned no findings; item 15 and the SDK-loop gap were verified directly.
