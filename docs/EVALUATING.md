# Evaluating Loki Mode

For someone deciding whether to trust an autonomous coding agent with a real
codebase. Every claim below has a command next to it. Run them; do not take our
word for it.

We have deliberately not written a feature grid scoring ourselves against ten
competitors. Those grids are written by the vendor being scored, the criteria
are chosen by the vendor, and no reader can check a single cell. This page only
makes claims you can falsify in a terminal.

---

## 1. The agent hands you a receipt, and it admits what it did not verify

```bash
npx loki-mode tour     # no install, no API key, no spend, no network
```

Output includes:

```
Headline: VERIFIED WITH GAPS

| Files changed | 8                                        |
| Diff sha256   | c2be6fff3e774c387f276277b25fc424f07b667… |
| Tests         | verified (node-test)                     |
| Build         | not_run                                  |
| Security      | findings                                 |
| Cost          | $10.3218                                 |
```

**What to notice:** the headline is not "SUCCESS". Build was not run. Security
has findings. The receipt says so on its own front page.

**Why that is the product.** Every coding agent reports its own completion, and
self-reporting is the thing they are structurally worst at. The receipt
separates deterministic FACTS (diff hash, test result, cost) from AI
ASSESSMENTS, because only four of our eight quality gates are agent-independent
and a receipt implying otherwise would be marketing.

**Check it yourself:** recompute the diff sha256 over the same range and confirm
it matches. If it does not, the receipt is worthless and you should not use us.

---

## 2. Verification runs air-gapped

Deterministic verification makes zero network calls, so it runs inside a
perimeter on code that may never leave the building.

```bash
bash tests/test-airgap-verify.sh
```

That test blackholes every proxy variable, strips the environment, and asserts a
real verdict still comes back. Measured: **8.43 ms**.

**Scope, stated honestly:** verification is air-gapped. **Generation is not.**
Every provider we ship calls a hosted API, and local-weight generation needs
models you would supply. We are not claiming the generation half, and any vendor
who claims a fully air-gapped LLM agent without shipping weights is worth a
second question.

---

## 3. On an existing codebase, the read-only path is genuinely read-only

Brownfield is the harder problem, and the reason to distrust an agent near it is
obvious. So the entry point writes nothing:

```bash
loki modernize heal ./your-repo --assess
git status        # clean. no scratch files, no .loki/, no commits.
```

**Enforced, not promised:**

```bash
bash tests/test-brownfield-assess-readonly.sh
```

That test hashes every file before and after, compares HEAD, and requires a
clean working tree. It is content-addressed, so it does not care *how* a write
might happen.

---

## 4. The harness is model-invariant (and we do not overclaim it)

```bash
cat benchmarks/results/cross-model-eval.json
```

- **Claimed:** the same gates run, the same acceptance is checked, and the same
  receipt semantics apply regardless of which model is behind it.
- **Explicitly NOT claimed:** identical quality or identical speed across
  models. That is not deliverable and we do not assert it.

Measured runs are in that file with wall-clock and iteration counts. Two runs is
two runs; it is not a benchmark suite, and the file says so.

---

## 5. Verification is fast enough to embed

```bash
python3 autonomy/lib/fast_verify.py --path . --diff-base HEAD~1
```

Measured on this repository, 1,932 tracked source files: **11,040 ms before,
19 ms diff-scoped** (298 ms cold, 87 ms warm). That is the difference between a
check you run at the end and a check something else can call as a dependency.

---

## What we do not have

Stating this plainly, because you will find it out anyway and it is cheaper for
both of us if you find it here.

- **No published enterprise case studies.** We have adoption signal (fork ratio
  well above the norm for a tool this size) but no named enterprise references.
- **No independent third-party benchmark placement.** The SWE-bench Verified
  leaderboard is months stale and every entry on it is self-reported, ours would
  be too.
- **No audit of the closed-source products.** We have verified that seven open
  harnesses (OpenHands, Cline, Aider, SWE-agent, Roo-Code, OpenCode, Continue)
  publish no machine-checkable completion artifact. Cursor, Devin, Replit Agent
  and Claude Code we have **not** audited feature by feature, so treat the
  receipt as "unclaimed as far as we can verify", not as a proven first.
- **Generation is not air-gapped.** See section 2.

---

## The one question worth asking any agent vendor

> When your agent says it finished, what artifact can I check that does not come
> from the agent's own narrative?

Ours is the Evidence Receipt, and section 1 is a two-minute test of whether the
answer holds up. Ask the same question everywhere else.
