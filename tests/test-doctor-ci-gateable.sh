#!/usr/bin/env bash
# `loki doctor` must be usable as a CI / init-container gate: `loki doctor || exit 1`.
#
# WHY THIS TEST EXISTS. The canonical enterprise use of doctor is a preflight
# gate -- an init container or a pipeline step that refuses to start work on a
# host missing a required dependency. That only works if a FAILED REQUIRED
# check produces a nonzero exit. A doctor that always returns 0 looks identical
# to a healthy one and silently green-lights a broken host.
#
# It behaves correctly today; this test exists so it keeps doing so. The
# behavior was verified by measurement, not read from the source: a survey of
# this CLI flagged it as UNVERIFIED precisely because every check passed on the
# machine doing the surveying, and "it passed here" says nothing about the
# failure path.
#
# BOTH DIRECTIONS MATTER. A gate that always fails is as useless as one that
# always passes, and warnings must not be treated as blockers -- an optional
# provider CLI being absent is not a reason to refuse to start.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOKI="$REPO_ROOT/autonomy/loki"

PASS=0
FAIL=0
ok()  { printf 'PASS: %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf 'FAIL: %s\n' "$1"; FAIL=$((FAIL + 1)); }

# Direction 1: a healthy host exits 0, even with optional warnings present.
# Read the code directly. This suite runs under several shells and $? after a
# PIPELINE reports the last stage, not the command under test -- a mistake that
# has produced false readings in this repo more than once.
"$LOKI" doctor >/dev/null 2>&1
healthy_rc=$?
if [ "$healthy_rc" -eq 0 ]; then
    ok "healthy host exits 0"
else
    # Not necessarily a defect in doctor: this machine may genuinely be missing
    # a required tool. Say which, rather than reporting a bare mismatch.
    printf 'NOTE: doctor exited %s on this host; required checks reporting FAIL:\n' "$healthy_rc"
    "$LOKI" doctor 2>&1 | grep -aiE "FAIL" | head -5
    bad "healthy host did not exit 0 (see note above -- may be this machine, not the code)"
fi

# Optional-only warnings must NOT be escalated to a blocking exit. Asserted via
# --json so it reads the structured verdict rather than scraping colored text.
warn_check="$("$LOKI" doctor --json 2>/dev/null | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    d = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
except Exception:
    print("UNPARSEABLE"); raise SystemExit
s = d.get("summary", {})
print("WARN_NO_FAIL" if s.get("warnings", 0) > 0 and s.get("failed", 1) == 0 else "OTHER")
' 2>/dev/null)"

if [ "$warn_check" = "WARN_NO_FAIL" ] && [ "$healthy_rc" -eq 0 ]; then
    ok "optional warnings present and still exit 0 (warnings are not blockers)"
elif [ "$warn_check" = "OTHER" ]; then
    printf 'SKIP: this host has no optional-warning-only state to assert against\n'
elif [ "$warn_check" = "UNPARSEABLE" ]; then
    bad "doctor --json did not emit parseable JSON"
fi

# Direction 2: a MISSING REQUIRED dependency must exit nonzero.
#
# Built by giving doctor a PATH containing only a minimal core, so required
# tools (node, jq, git) are genuinely absent while the script can still run.
# Stripping PATH entirely is NOT a valid test: the shell then cannot find its
# own interpreter and exits 127 before doctor renders any verdict at all, which
# proves nothing about the gate.
SHIM="$(mktemp -d)"
for b in bash sh python3 python sed awk grep cat tr head tail sort uniq wc \
         date mkdir rm ls printf env dirname basename cut find xargs stat; do
    for d in /bin /usr/bin; do
        [ -e "$d/$b" ] && ln -sf "$d/$b" "$SHIM/$b" 2>/dev/null && break
    done
done

env PATH="$SHIM" bash "$LOKI" doctor >"$SHIM/out.txt" 2>&1
missing_rc=$?

if [ "$missing_rc" -eq 127 ]; then
    # The harness broke, not the code under test. Report honestly instead of
    # counting a harness failure as a passing gate.
    bad "harness: the shim PATH was too thin for the CLI to start (rc=127); assertion inconclusive"
elif [ "$missing_rc" -ne 0 ]; then
    ok "missing required dependency exits nonzero (rc=${missing_rc}) -- doctor can gate CI"
else
    bad "missing required dependency still exited 0 -- 'loki doctor || exit 1' would pass on a broken host"
fi

# The exit code alone is not enough for an operator: the output has to NAME the
# blocker. A nonzero exit with no indication of which dependency is missing
# costs exactly the investigation this command exists to prevent.
if [ "$missing_rc" -ne 0 ] && [ "$missing_rc" -ne 127 ]; then
    if grep -aqiE "not found|missing" "$SHIM/out.txt"; then
        ok "output names the missing dependency, not just a failing code"
    else
        bad "nonzero exit but the output does not say WHICH dependency is missing"
    fi
fi

rm -rf "$SHIM"

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
