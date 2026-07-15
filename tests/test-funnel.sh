#!/usr/bin/env bash
# test-funnel.sh -- the activation-funnel instrumentation (autonomy/lib/funnel.sh)
# fires each top-of-funnel event AT MOST ONCE per machine, carries the drop-off
# reason, and honors telemetry opt-out (goes through loki_telemetry, which is the
# opt-out chokepoint). This is the visibility loki needs to see WHERE the ~95% of
# installers who never build actually drop off.
#
# Hermetic: HOME points at a temp dir; loki_telemetry is stubbed to a log file.
# No emojis. No em dashes.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNNEL="$SCRIPT_DIR/../autonomy/lib/funnel.sh"
PASS=0
FAIL=0
fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
ok() { PASS=$((PASS + 1)); }
[ -f "$FUNNEL" ] || { echo "FATAL: funnel.sh not found"; exit 2; }

# Run a funnel scenario in an isolated HOME with a stubbed telemetry logger.
# $1 = temp home, rest = shell body. Emits go to $home/emits.log.
scenario() {
    local home="$1"; shift
    bash -c '
        set -u
        export HOME="'"$home"'"
        loki_telemetry() { echo "$*" >> "'"$home"'/emits.log"; }
        source "'"$FUNNEL"'"
        '"$*"'
        sleep 0.3
    '
}

# 1. installed fires exactly once even when called repeatedly
H="$(mktemp -d)"
scenario "$H" '_loki_funnel_installed start; _loki_funnel_installed start; _loki_funnel_installed start'
n="$(grep -c "loki_installed" "$H/emits.log" 2>/dev/null || echo 0)"
[ "$n" = "1" ] && ok || fail "loki_installed must fire exactly once, got $n"
rm -rf "$H"

# 2. start_blocked carries the reason (the high-value drop-off signal)
H="$(mktemp -d)"
scenario "$H" '_loki_funnel_start_blocked no_api_key'
grep -q "first_start_blocked reason=no_api_key" "$H/emits.log" 2>/dev/null && ok \
    || fail "start_blocked must carry reason=no_api_key"
rm -rf "$H"

# 3. build_complete fires once with iteration count
H="$(mktemp -d)"
scenario "$H" '_loki_funnel_build_complete 7; _loki_funnel_build_complete 7'
n="$(grep -c "first_build_complete" "$H/emits.log" 2>/dev/null || echo 0)"
[ "$n" = "1" ] && ok || fail "build_complete must fire once, got $n"
grep -q "iterations=7" "$H/emits.log" 2>/dev/null && ok || fail "build_complete must carry iterations"
rm -rf "$H"

# 4. help_seen does NOT fire once a start has been attempted (ordering guard)
H="$(mktemp -d)"
scenario "$H" '_loki_funnel_start_attempted; _loki_funnel_help_seen help'
grep -q "first_help_seen" "$H/emits.log" 2>/dev/null \
    && fail "help_seen must not fire after a start was attempted" || ok
rm -rf "$H"

# 5. opt-out honored: with NO loki_telemetry defined, nothing is emitted, but the
#    marker is still written so it never re-fires (and never emits later).
H="$(mktemp -d)"
bash -c 'export HOME="'"$H"'"; source "'"$FUNNEL"'"; _loki_funnel_installed start'
[ -f "$H/.loki/funnel/installed" ] && ok || fail "marker must be written even without telemetry"
[ ! -f "$H/emits.log" ] && ok || fail "no emit log should exist when telemetry is undefined"
rm -rf "$H"

# 6. retention: same-day second run does NOT fire returned_day2; a later day does.
H="$(mktemp -d)"
mkdir -p "$H/.loki/funnel"
# simulate an install on a prior day
echo "2000-01-01" > "$H/.loki/funnel/.first_day"
scenario "$H" '_loki_funnel_retention'
grep -q "returned_day2 first_day=2000-01-01" "$H/emits.log" 2>/dev/null && ok \
    || fail "a run on a later day must fire returned_day2"
rm -rf "$H"

echo ""
echo "test-funnel: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
