#!/usr/bin/env bash
# Unknown-key detection in `loki config validate` for JSON/YAML.
#
# The bug this guards: extraction walks LOKI_CONFIG_MAP and pulls each KNOWN
# path out of the file, so a key the map does not contain was never emitted and
# could not reach the validate loop. A misspelled key validated CLEAN (rc=0)
# while the identical typo in .env format was correctly rejected (rc=1).
#
# Every assertion below captures rc WITHOUT a pipe -- `cmd | head` reports
# head's status, not the command's, and CI gates on the exit code.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOKI_BIN="$REPO_ROOT/autonomy/loki"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }

# Run validate and echo its real exit code.
vrc() {
    local rc=0
    bash "$LOKI_BIN" config validate "$1" >/dev/null 2>&1 || rc=$?
    echo "$rc"
}

echo "test-config-unknown-keys"

# 1. A misspelled real key in JSON must be rejected.
printf '{"dashboard":{"enabeld":true}}\n' > "$WORK/typo.json"
if [ "$(vrc "$WORK/typo.json")" -eq 1 ]; then
    pass "JSON: misspelled key -> rc=1"
else
    fail "JSON: misspelled key validated clean (the original defect)"
fi

# 2. The error names the offending key, so the message is actionable.
# Capture first, then grep: piping straight out of loki loses the match.
TYPO_OUT="$(bash "$LOKI_BIN" config validate "$WORK/typo.json" 2>&1)"
if echo "$TYPO_OUT" | grep -q 'dashboard.enabeld'; then
    pass "JSON: error names the offending key"
else
    fail "JSON: error does not name the offending key"
fi

# 3. Same typo in YAML must be rejected (only when pyyaml is available; the
#    walk deliberately no-ops without it rather than guessing).
if python3 -c "import yaml" >/dev/null 2>&1; then
    printf 'dashboard:\n  enabeld: true\n' > "$WORK/typo.yaml"
    if [ "$(vrc "$WORK/typo.yaml")" -eq 1 ]; then
        pass "YAML: misspelled key -> rc=1"
    else
        fail "YAML: misspelled key validated clean"
    fi
else
    echo "  SKIP: YAML case (pyyaml not installed)"
fi

# 4. NO FALSE POSITIVES: a fully valid config must still pass. This is the
#    assertion that fails if the walk is too aggressive.
printf '{"completion":{"max_iterations":4242},"dashboard":{"port":57374}}\n' > "$WORK/valid.json"
if [ "$(vrc "$WORK/valid.json")" -eq 0 ]; then
    pass "JSON: valid config still passes"
else
    fail "JSON: valid config newly rejected (false positive)"
fi

# 5. Inert metadata written by `loki init` is allowlisted, not an error.
printf '{"version":"9.26.0","template":"saas","created":"2026-09-09T00:00:00Z","completion":{"max_iterations":10}}\n' > "$WORK/meta.json"
if [ "$(vrc "$WORK/meta.json")" -eq 0 ]; then
    pass "JSON: inert metadata (version/template/created) allowlisted"
else
    fail "JSON: inert metadata rejected"
fi

# 5b. An EMPTY container is a container, not a typo. `{"dashboard":{}}` falls to
#     the leaf branch (an empty dict is falsy), so only the container-parent
#     suppression keeps it from being reported as an unknown key.
printf '{"dashboard":{}}\n' > "$WORK/empty.json"
if [ "$(vrc "$WORK/empty.json")" -eq 0 ]; then
    pass "JSON: empty container is not reported as unknown"
else
    fail "JSON: empty container falsely reported as an unknown key"
fi

# 6. Parity with .env, the format that already worked. Both must reject.
printf 'LOKI_DASHBOARD_ENABELD=true\n' > "$WORK/typo.env"
if [ "$(vrc "$WORK/typo.env")" -eq 1 ] && [ "$(vrc "$WORK/typo.json")" -eq 1 ]; then
    pass "env and JSON agree on the same typo"
else
    fail "env/JSON disagree on the same typo (the parity gap)"
fi

echo "  $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
