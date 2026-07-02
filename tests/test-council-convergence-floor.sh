#!/usr/bin/env bash
# Test: RANK 15 -- lower the no-claim council convergence floor.
#
# The convergence-detection path (NO explicit completion claim) historically only
# evaluated on the CHECK_INTERVAL boundary (every 5th iteration). A no-promise /
# analysis run that is verifiably done at iteration 2 still ground to iteration 5
# before the council was even allowed to look. The RANK-15 change lets that path
# evaluate as soon as there is AFFIRMATIVE evidence of done (a real test suite
# passed, and the checklist -- if present -- is not failing), gated behind
# MIN_ITERATIONS and the LOKI_COUNCIL_CONVERGENCE_EARLY knob.
#
# This sources the REAL helpers from completion-council.sh so it cannot drift.
# It drives the pure decision helper _council_should_check_now directly (no need
# to spin a 3-member vote): that helper is exactly the WHEN-to-evaluate gate.
#
# Proven directions:
#   POSITIVE : no-claim, iter 2 (off the 5-interval), MIN=1, affirmative test-green
#              -> _council_should_check_now returns 0 (evaluate NOW).
#              RED before the change (no early bypass existed -> returns 1).
#   NEGATIVE-A (unverified): same iter, NO test-results file (no evidence)
#              -> stays 1 (does NOT fast-path). Green before AND after.
#   NEGATIVE-B (inconclusive): test-results present but runner=="none"
#              -> stays 1 (absence of a real suite is not affirmative green).
#              Green before AND after (proves we did not weaken safety).
#   NEGATIVE-C (red tests): test-results present, pass==false
#              -> stays 1. Green before AND after.
#   CADENCE   : no-claim, iter 5 (ON interval), no evidence -> still 0 (unchanged).
#   MIN-GUARD : no-claim, iter 2, MIN=3, affirmative green -> stays 1 (below floor).
#   OPT-OUT   : LOKI_COUNCIL_CONVERGENCE_EARLY=0 + affirmative green + iter 2
#              -> stays 1 (historical interval-only restored).
#   CLAIM     : explicit-claim path timing UNCHANGED (iter 7, claimed) -> 0,
#              and iter 7 unclaimed no-evidence -> 1.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COUNCIL_SH="$REPO_ROOT/autonomy/completion-council.sh"

if [ ! -f "$COUNCIL_SH" ]; then
    echo "FAIL: cannot find $COUNCIL_SH"
    exit 1
fi

# Quiet, side-effect-free logging stubs so sourcing is silent.
log_info()  { :; }
log_warn()  { :; }
log_error() { :; }
log_debug() { :; }
log_header() { :; }

# shellcheck source=/dev/null
source "$COUNCIL_SH" >/dev/null 2>&1 || true

if ! type _council_should_check_now >/dev/null 2>&1; then
    echo "FAIL: _council_should_check_now not defined after sourcing $COUNCIL_SH"
    echo "      (RED state: the RANK-15 convergence-floor helper is missing)"
    exit 1
fi
if ! type _council_convergence_evidence_green >/dev/null 2>&1; then
    echo "FAIL: _council_convergence_evidence_green not defined after sourcing"
    exit 1
fi

PASS=0
FAIL=0
ok()  { echo "PASS: $1"; PASS=$((PASS+1)); }
bad() { echo "FAIL: $1"; FAIL=$((FAIL+1)); }

WORK="$(mktemp -d "${TMPDIR:-/tmp}/loki-conv-floor.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/.loki/quality" "$WORK/.loki/checklist"
TARGET_DIR="$WORK"

# Deterministic council config for the decision helper.
COUNCIL_ENABLED=true
COUNCIL_CHECK_INTERVAL=5

# --- evidence fixtures -------------------------------------------------------
write_green_tests() {
    cat > "$WORK/.loki/quality/test-results.json" <<'JSON'
{ "runner": "jest", "pass": true, "total": 12, "passed": 12, "failed": 0 }
JSON
}
write_notests() {
    cat > "$WORK/.loki/quality/test-results.json" <<'JSON'
{ "runner": "none", "pass": true }
JSON
}
write_red_tests() {
    cat > "$WORK/.loki/quality/test-results.json" <<'JSON'
{ "runner": "jest", "pass": false, "total": 12, "passed": 8, "failed": 4 }
JSON
}
clear_tests()  { rm -f "$WORK/.loki/quality/test-results.json"; }
clear_checklist() { rm -f "$WORK/.loki/checklist/verification-results.json"; }
write_passing_checklist() {
    cat > "$WORK/.loki/checklist/verification-results.json" <<'JSON'
{ "categories": [ { "items": [ { "id": "a1", "priority": "critical", "status": "passing" } ] } ] }
JSON
}
write_failing_checklist() {
    cat > "$WORK/.loki/checklist/verification-results.json" <<'JSON'
{ "categories": [ { "items": [ { "id": "a1", "priority": "critical", "status": "failing" } ] } ] }
JSON
}

# check_now <circuit> <claim>: run the pure helper, echo its rc (0=check,1=skip)
check_now() {
    if _council_should_check_now "$1" "$2"; then echo 0; else echo 1; fi
}

# === POSITIVE: no-claim, off-interval, affirmative green -> evaluate NOW =======
clear_checklist
write_green_tests
COUNCIL_MIN_ITERATIONS=1
ITERATION_COUNT=2
LOKI_COUNCIL_CONVERGENCE_EARLY=1
r=$(check_now false false)
[ "$r" = "0" ] && ok "POSITIVE: no-claim iter 2 off-interval + affirmative test-green -> evaluate NOW (the fix)" \
               || bad "POSITIVE: expected evaluate-now (0), got $r"

# affirmative green + a PASSING checklist also present -> still evaluate now
write_passing_checklist
r=$(check_now false false)
[ "$r" = "0" ] && ok "POSITIVE: green tests + passing checklist -> evaluate NOW" \
               || bad "POSITIVE(checklist): expected 0, got $r"
clear_checklist

# DEFAULT-CONFIG headline: stock MIN=3 / INTERVAL=5, a genuinely-done no-promise
# run at iter 3 (off the 5-boundary) now evaluates instead of grinding to iter 5.
# This maps 1:1 to AC #1 ("stop before iteration 5") at the shipped defaults.
# RED before the change: 3 % 5 != 0 and no early bypass -> returns 1 (grinds on).
COUNCIL_MIN_ITERATIONS=3
ITERATION_COUNT=3
r=$(check_now false false)
[ "$r" = "0" ] && ok "POSITIVE(default config): MIN=3/INTERVAL=5, green, iter 3 -> evaluate NOW (was: wait to iter 5)" \
               || bad "POSITIVE(default config): expected 0 at iter 3, got $r"
COUNCIL_MIN_ITERATIONS=1

# === NEGATIVE-A: no evidence at all -> does NOT fast-path (unverified) =========
clear_tests
clear_checklist
r=$(check_now false false)
[ "$r" = "1" ] && ok "NEGATIVE-A: no test-results file (no evidence) -> does NOT fast-path" \
               || bad "NEGATIVE-A: unverified run fast-pathed (got $r) -- SAFETY WEAKENED"

# === NEGATIVE-B: inconclusive (runner==none) -> does NOT fast-path ============
write_notests
r=$(check_now false false)
[ "$r" = "1" ] && ok "NEGATIVE-B: runner==none (no real suite) -> does NOT fast-path (inconclusive != green)" \
               || bad "NEGATIVE-B: no-suite run fast-pathed (got $r) -- SAFETY WEAKENED"

# === NEGATIVE-C: red tests -> does NOT fast-path =============================
write_red_tests
r=$(check_now false false)
[ "$r" = "1" ] && ok "NEGATIVE-C: pass==false (red tests) -> does NOT fast-path" \
               || bad "NEGATIVE-C: red run fast-pathed (got $r) -- SAFETY WEAKENED"

# green tests but FAILING checklist -> does NOT fast-path
write_green_tests
write_failing_checklist
r=$(check_now false false)
[ "$r" = "1" ] && ok "NEGATIVE-C2: green tests + failing checklist -> does NOT fast-path" \
               || bad "NEGATIVE-C2: failing checklist fast-pathed (got $r) -- SAFETY WEAKENED"
clear_checklist

# === CADENCE: on-interval with no evidence still evaluates (unchanged) ========
clear_tests
COUNCIL_MIN_ITERATIONS=3
ITERATION_COUNT=5
r=$(check_now false false)
[ "$r" = "0" ] && ok "CADENCE: no-claim on-interval (iter 5) -> evaluates (interval path unchanged)" \
               || bad "CADENCE: on-interval did not evaluate (got $r)"

# off-interval, no evidence, default cadence -> does NOT evaluate (unchanged)
ITERATION_COUNT=7
r=$(check_now false false)
[ "$r" = "1" ] && ok "CADENCE: no-claim off-interval no-evidence (iter 7) -> does NOT evaluate (unchanged)" \
               || bad "CADENCE: off-interval no-evidence wrongly evaluated (got $r)"

# === MIN-GUARD: affirmative green but below MIN_ITERATIONS -> does NOT fire ====
write_green_tests
COUNCIL_MIN_ITERATIONS=3
ITERATION_COUNT=2
r=$(check_now false false)
[ "$r" = "1" ] && ok "MIN-GUARD: green + iter 2 but MIN=3 -> does NOT fast-path (floor preserved)" \
               || bad "MIN-GUARD: fired below MIN_ITERATIONS (got $r) -- floor bypassed"

# === OPT-OUT: LOKI_COUNCIL_CONVERGENCE_EARLY=0 restores interval-only =========
COUNCIL_MIN_ITERATIONS=1
ITERATION_COUNT=2
LOKI_COUNCIL_CONVERGENCE_EARLY=0
r=$(check_now false false)
[ "$r" = "1" ] && ok "OPT-OUT: EARLY=0 + green + iter 2 -> does NOT fast-path (interval-only restored)" \
               || bad "OPT-OUT: knob did not disable early check (got $r)"
LOKI_COUNCIL_CONVERGENCE_EARLY=1

# === CLAIM: explicit-claim path timing UNCHANGED =============================
# claim off-interval -> evaluate now (this path already bypassed the interval).
clear_tests
COUNCIL_MIN_ITERATIONS=3
ITERATION_COUNT=7
r=$(check_now false true)
[ "$r" = "0" ] && ok "CLAIM: explicit claim off-interval (iter 7) -> evaluate NOW (unchanged)" \
               || bad "CLAIM: explicit-claim timing changed (got $r)"
# unclaimed off-interval no-evidence -> does NOT evaluate (unchanged).
r=$(check_now false false)
[ "$r" = "1" ] && ok "CLAIM: no-claim off-interval no-evidence (iter 7) -> does NOT evaluate" \
               || bad "CLAIM: no-claim off-interval wrongly evaluated (got $r)"

# circuit-breaker path unchanged: always evaluate.
r=$(check_now true false)
[ "$r" = "0" ] && ok "CIRCUIT: circuit_triggered -> evaluate NOW (unchanged)" \
               || bad "CIRCUIT: circuit path changed (got $r)"

echo
echo "-----------------------------------------------------"
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && echo "ALL CONVERGENCE-FLOOR TESTS PASSED" || echo "SOME TESTS FAILED"
exit "$FAIL"
