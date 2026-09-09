#!/usr/bin/env bash
# Doc generation must not re-bill its shared context, and must not run untiered.
#
# WHY THIS EXISTS. auto_generate_docs_if_needed makes EIGHT sequential provider
# calls per run. Two things about their shape cost real money and neither is
# visible in any log:
#
#   1. All eight share the same project context, measured at 4,269 tokens on this
#      repo. It used to be the prompt SUFFIX, so the eight prompts had no common
#      prefix and every call re-sent it at full input price -- about 29,883
#      redundant input tokens per run. Leading with the identical context makes
#      it one cache write plus seven cache reads at 0.1x.
#   2. The claude branch had no --model, so all eight ran on the account default.
#      For an Opus-default user that is 5x the input and output price for a
#      summarization task.
#
# Both are silent: the docs still generate either way, so no gate goes red and
# only a bill shows the difference. That is exactly the class of regression a
# test has to hold, because a later "tidy" that moves the instruction back to
# the top of the prompt looks like an improvement in a diff.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOKI="$REPO_ROOT/autonomy/loki"

PASS=0; FAIL=0
ok()  { echo "  [PASS] $1"; PASS=$((PASS+1)); }
bad() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }

echo "T1 -- the shared context leads every generation prompt"

# Count prompts that OPEN with the context (cacheable) vs ones that bury it.
lead=$(grep -c 'prompt="\$context' "$LOKI" || true)
trail=$(grep -c 'prompt="Based on the following project context, generate' "$LOKI" || true)

if [ "${lead:-0}" -ge 8 ]; then
    ok "$lead generation prompts lead with the shared context"
else
    bad "only ${lead:-0} prompts lead with \$context; expected at least 8"
fi

if [ "${trail:-0}" -eq 0 ]; then
    ok "no generation prompt puts its instruction before the shared context"
else
    bad "$trail generation prompt(s) bury \$context, re-billing it on every call"
fi

echo
echo "T2 -- provider calls are tiered, not left on the account default"

if grep -q 'LOKI_DOCS_MODEL' "$LOKI"; then
    ok "the doc-gen claude call pins a model (LOKI_DOCS_MODEL, overridable)"
else
    bad "no model pin: all eight calls inherit the account default (Opus for many users)"
fi

# The pin is worthless if it is not on the line that actually invokes claude.
if grep -A2 'CAVEMAN_DEFAULT_MODE=off claude -p' "$LOKI" | grep -q -- '--model'; then
    ok "the pin is on the claude invocation itself"
else
    bad "LOKI_DOCS_MODEL exists but is not applied to the claude -p call"
fi

echo
echo "==============================================================="
echo "Results: $PASS passed, $FAIL failed, $((PASS+FAIL)) total"
[ "$FAIL" -eq 0 ]
