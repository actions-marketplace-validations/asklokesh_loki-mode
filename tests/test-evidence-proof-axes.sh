#!/usr/bin/env bash
# test-evidence-proof-axes.sh -- Proof-of-Function completion gate. Three new
# evidence axes (nomock/persistence/auth) on council_evidence_gate, each proven
# by an OBSERVED artifact, each fail-closed, all web-app-only.
#
# Drives the REAL council_evidence_gate (sourced) with synthetic functional-proof
# .json + nomock-scan.json fixtures, isolating each axis by making diff + tests +
# boot + secret PASS. Boot passes AFFIRMATIVELY (serveable+healthy) so the two
# dynamic axes see serveable=true and are actually evaluated. Hermetic, zero
# token cost, no real browser. No emojis. No em dashes.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CC="$SCRIPT_DIR/../autonomy/completion-council.sh"
PASS=0
FAIL=0
fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
ok() { PASS=$((PASS + 1)); }
[ -f "$CC" ] || { echo "FATAL: completion-council.sh not found"; exit 2; }
command -v python3 >/dev/null 2>&1 || { echo "SKIP: python3 required"; exit 0; }
command -v git >/dev/null 2>&1 || { echo "SKIP: git required"; exit 0; }

log_info() { :; }
log_warn() { :; }
log_error() { :; }
log_success() { :; }
log_header() { :; }
log_step() { :; }
record_trust_event_bash() { :; }
# shellcheck disable=SC1090
source "$CC" 2>/dev/null || true
type council_evidence_gate >/dev/null 2>&1 || { echo "FATAL: council_evidence_gate not defined"; exit 2; }

SERVEABLE_STATE='{"status":"running","primary_service":"web","url":"http://localhost:3000"}'
HEALTH_OK='{"ok": true, "checked_at": "t"}'

# gate_proof <proof-json|""> <nomock-json|""> [state-override|""] [extra-env...]:
# run the gate in a temp repo where diff+tests+boot+secret are made to PASS, so
# ONLY the proof axes can block. echo PASS if the gate returns 0 else BLOCK.
gate_proof() {
    local proof="$1" nomock="$2" state="${3:-$SERVEABLE_STATE}"
    (
        d="$(mktemp -d)"; cd "$d" || exit 3
        git init -q; git config user.email t@t; git config user.name t; git config commit.gpgsign false
        echo "base" > f.txt; git add -A; git commit -qm init
        _LOKI_RUN_START_SHA="$(git rev-parse HEAD)"
        echo "changed" >> f.txt; git add -A
        mkdir -p .loki/quality .loki/app-runner .loki/council .loki/verification
        printf '%s\n' '{"runner":"vitest","pass":true,"status":"passed","passed_count":1,"failed_count":0}' > .loki/quality/test-results.json
        # Boot axis affirmative: serveable + healthy (so dynamic axes evaluate).
        printf '%s\n' "$state" > .loki/app-runner/state.json
        printf '%s\n' "$HEALTH_OK" > .loki/app-runner/health.json
        [ -n "$proof" ] && printf '%s\n' "$proof" > .loki/verification/functional-proof.json
        [ -n "$nomock" ] && printf '%s\n' "$nomock" > .loki/verification/nomock-scan.json
        COUNCIL_STATE_DIR="$d/.loki/council"
        if council_evidence_gate; then echo "PASS"; else echo "BLOCK"; fi
        rm -rf "$d"
    )
}

# A fully-affirmative proof file (both dynamic axes proven) reused as the base
# so a test isolating ONE axis leaves the others passing.
PROOF_ALL_OK='{"persistence":{"attempted":true,"proven":true,"reason":"ok"},"auth":{"attempted":true,"proven":true,"reason":"ok"},"url":"http://localhost:3000"}'
# Both dynamic axes inconclusive-passthrough (no create path, no auth) -- used
# when isolating the no-mock axis so persist/auth do not interfere.
PROOF_PASSTHRU='{"persistence":{"attempted":false,"proven":false,"reason":"no_create_path"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"},"url":"http://localhost:3000"}'
NOMOCK_CLEAN='{"scanned":3,"hit":false,"file":"","line":0,"snippet":""}'
NOMOCK_HIT='{"scanned":2,"hit":true,"file":"src/List.tsx","line":10,"snippet":"const rows = [{"}'

echo "--- NO-MOCK axis ---"
# 1. mock-backed hit -> BLOCK
[ "$(gate_proof "$PROOF_PASSTHRU" "$NOMOCK_HIT")" = "BLOCK" ] && ok || fail "nomock hit should BLOCK"
# 2. clean scan -> PASS
[ "$(gate_proof "$PROOF_PASSTHRU" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "nomock clean should PASS"
# 3. no scan file + no UI files (nothing scanned inline) -> PASS (inconclusive)
[ "$(gate_proof "$PROOF_PASSTHRU" "")" = "PASS" ] && ok || fail "no nomock scan + no UI files should PASS (inconclusive)"
# 4. LOKI_PROOF_NOMOCK=0 -> PASS even with a hit
[ "$(LOKI_PROOF_NOMOCK=0 gate_proof "$PROOF_PASSTHRU" "$NOMOCK_HIT")" = "PASS" ] && ok || fail "LOKI_PROOF_NOMOCK=0 should disable nomock block"

echo "--- PERSISTENCE axis ---"
P_PROVEN='{"persistence":{"attempted":true,"proven":true,"reason":"ok"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"}}'
P_DISPROVEN='{"persistence":{"attempted":true,"proven":false,"reason":"sentinel_gone_after_reload"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"}}'
P_NOCREATE='{"persistence":{"attempted":false,"proven":false,"reason":"no_create_path"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"}}'
# 5. proven:true -> PASS
[ "$(gate_proof "$P_PROVEN" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "persistence proven should PASS"
# 6. attempted:true/proven:false -> BLOCK
[ "$(gate_proof "$P_DISPROVEN" "$NOMOCK_CLEAN")" = "BLOCK" ] && ok || fail "persistence disproven should BLOCK"
# 7. no create path -> PASS (inconclusive, logged)
[ "$(gate_proof "$P_NOCREATE" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "persistence no_create_path should PASS"
# 8. BUG 2: missing proof file on a SERVEABLE app -> PASS (inconclusive
# pass-through). The producer is interval-gated + needs playwright, so "not
# attempted this iteration" must NOT block a legitimate build. Absence is not
# disproof. ONLY a freshly-attempted proven:false blocks (test 6 above).
[ "$(gate_proof "" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "missing proof file on serveable app should PASS (inconclusive, not a false-block)"
# 9. not serveable (boot inconclusive: no app-runner) -> PASS (pass-through)
[ "$(gate_proof "$P_DISPROVEN" "$NOMOCK_CLEAN" '{"status":"none","primary_service":"","url":""}')" = "PASS" ] && ok || fail "not-serveable should PASS persistence (pass-through)"
# 10. LOKI_PROOF_PERSIST=0 -> PASS even on a disproof
[ "$(LOKI_PROOF_PERSIST=0 gate_proof "$P_DISPROVEN" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "LOKI_PROOF_PERSIST=0 should disable persistence block"

echo "--- FRESHNESS (BUG 1 + BUG 2 interaction) ---"
# These lock the two regressions the council caught so they cannot come back.
# A proof stamped for the CURRENT iteration is fresh; a proof stamped for a
# different iteration is a STALE artifact left by a timeout/hang and must be
# treated as NOT PRESENT (never a stale green, never a stale block).
# Gate default: ITERATION_COUNT unset -> 0. So stamp {iteration:0} is fresh,
# stamp {iteration:99} is stale relative to the gate.
P_PROVEN_FRESH='{"stamp":{"iteration":0,"head":"abc"},"persistence":{"attempted":true,"proven":true,"reason":"ok"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"}}'
P_PROVEN_STALE='{"stamp":{"iteration":99,"head":"old"},"persistence":{"attempted":true,"proven":true,"reason":"ok"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"}}'
P_DISPROVEN_STALE='{"stamp":{"iteration":99,"head":"old"},"persistence":{"attempted":true,"proven":false,"reason":"sentinel_gone_after_reload"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"}}'
# 11a. serveable+healthy app, functional-proof.json ABSENT (interval not fired)
#      -> gate does NOT block (inconclusive pass-through). Locks BUG 2.
[ "$(gate_proof "" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "interaction: serveable+healthy, proof absent (interval not fired) must NOT block"
# 11b. fresh proof stamped for the current iteration + proven:true -> PASS
#      (a fresh proof is honoured normally).
[ "$(gate_proof "$P_PROVEN_FRESH" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "interaction: fresh-stamped proven:true should PASS"
# 11c. STALE proof (wrong iteration stamp) with proven:true -> treated as
#      NOT-PRESENT (does not pass the axis on the strength of the stale proof);
#      resolves to inconclusive pass-through -> PASS, never a stale green block.
[ "$(gate_proof "$P_PROVEN_STALE" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "interaction: stale proven:true should be treated as not-present (inconclusive PASS, not stale green)"
# 11d. STALE proof carrying a proven:false -> also treated as NOT-PRESENT, so a
#      stale disproof does NOT false-block a since-regressed-or-fixed app. Locks
#      BUG 1 (a stale artifact never drives the verdict either way).
[ "$(gate_proof "$P_DISPROVEN_STALE" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "interaction: stale proven:false should be treated as not-present (inconclusive PASS, not a stale block)"

echo "--- AUTH axis ---"
A_PROVEN='{"persistence":{"attempted":false,"proven":false,"reason":"no_create_path"},"auth":{"attempted":true,"proven":true,"reason":"rejected_401"}}'
A_SERVED200='{"persistence":{"attempted":false,"proven":false,"reason":"no_create_path"},"auth":{"attempted":true,"proven":false,"reason":"served_200_logged_out"}}'
A_NOAUTH='{"persistence":{"attempted":false,"proven":false,"reason":"no_create_path"},"auth":{"attempted":false,"proven":false,"reason":"no_auth"}}'
A_UNTESTABLE='{"persistence":{"attempted":false,"proven":false,"reason":"no_create_path"},"auth":{"attempted":false,"proven":false,"reason":"auth_detected_untestable"}}'
# 11. proven:true (observed 401) -> PASS
[ "$(gate_proof "$A_PROVEN" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "auth proven should PASS"
# 12. served 200 logged-out -> BLOCK
[ "$(gate_proof "$A_SERVED200" "$NOMOCK_CLEAN")" = "BLOCK" ] && ok || fail "auth served-200 should BLOCK"
# 13. no auth signal -> PASS
[ "$(gate_proof "$A_NOAUTH" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "auth no_auth should PASS"
# 14. auth detected but untestable, STRICT default -> BLOCK
[ "$(gate_proof "$A_UNTESTABLE" "$NOMOCK_CLEAN")" = "BLOCK" ] && ok || fail "auth detected-untestable under STRICT should BLOCK"
# 15. same, STRICT relaxed -> PASS (inconclusive)
[ "$(LOKI_PROOF_AUTH_STRICT=0 gate_proof "$A_UNTESTABLE" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "LOKI_PROOF_AUTH_STRICT=0 should relax detected-untestable to PASS"
# 16. LOKI_PROOF_AUTH=0 -> PASS even on served-200
[ "$(LOKI_PROOF_AUTH=0 gate_proof "$A_SERVED200" "$NOMOCK_CLEAN")" = "PASS" ] && ok || fail "LOKI_PROOF_AUTH=0 should disable auth block"

echo "--- MASTER opt-out + block-report attribution ---"
# 17. LOKI_PROOF_GATE=0 -> every proof axis pass-through even with all disproofs
ALL_BAD='{"persistence":{"attempted":true,"proven":false,"reason":"x"},"auth":{"attempted":true,"proven":false,"reason":"served_200_logged_out"}}'
[ "$(LOKI_PROOF_GATE=0 gate_proof "$ALL_BAD" "$NOMOCK_HIT")" = "PASS" ] && ok || fail "LOKI_PROOF_GATE=0 should disable ALL proof axes"

# 18. block-report attributes the axis: checks.persistence.ok==false on a
# persistence block; checks.nomock.ok / checks.auth.ok likewise.
attr_check() {
    local proof="$1" nomock="$2" axis="$3"
    d="$(mktemp -d)"; cd "$d" || return 3
    git init -q; git config user.email t@t; git config user.name t; git config commit.gpgsign false
    echo base > f.txt; git add -A; git commit -qm init
    _LOKI_RUN_START_SHA="$(git rev-parse HEAD)"
    echo changed >> f.txt; git add -A
    mkdir -p .loki/quality .loki/app-runner .loki/council .loki/verification
    printf '%s\n' '{"runner":"vitest","pass":true,"status":"passed","passed_count":1,"failed_count":0}' > .loki/quality/test-results.json
    printf '%s\n' "$SERVEABLE_STATE" > .loki/app-runner/state.json
    printf '%s\n' "$HEALTH_OK" > .loki/app-runner/health.json
    [ -n "$proof" ] && printf '%s\n' "$proof" > .loki/verification/functional-proof.json
    [ -n "$nomock" ] && printf '%s\n' "$nomock" > .loki/verification/nomock-scan.json
    COUNCIL_STATE_DIR="$d/.loki/council"
    council_evidence_gate >/dev/null 2>&1 || true
    _AXIS="$axis" python3 -c "import sys,json,os; d=json.load(open('$d/.loki/council/evidence-block.json')); sys.exit(0 if d['checks'][os.environ['_AXIS']]['ok'] is False else 1)" 2>/dev/null
    local rc=$?
    rm -rf "$d"
    return $rc
}
( attr_check "$P_DISPROVEN" "$NOMOCK_CLEAN" "persistence" ) && ok || fail "block report should record checks.persistence.ok=false"
( attr_check "$PROOF_PASSTHRU" "$NOMOCK_HIT" "nomock" ) && ok || fail "block report should record checks.nomock.ok=false"
( attr_check "$A_SERVED200" "$NOMOCK_CLEAN" "auth" ) && ok || fail "block report should record checks.auth.ok=false"

echo ""
echo "test-evidence-proof-axes: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
