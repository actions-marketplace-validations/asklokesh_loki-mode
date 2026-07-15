#!/usr/bin/env bash
# funnel.sh -- honest activation-funnel instrumentation.
#
# WHY: loki could not SEE its own adoption funnel. It emitted rich mid-build
# events (iteration_start, code_review_complete, ...) but NOTHING about the top
# of funnel -- who installed, who reached first-run, WHERE they dropped off. So
# "95% of installers never run a build" was an inferred number with no visibility
# into the failing step. You cannot fix a funnel you cannot see. This adds the
# missing top-of-funnel events, each fired AT MOST ONCE per machine (marker-file
# gated), through the SAME opt-out-respecting loki_telemetry() path -- so a user
# who opted out of telemetry emits nothing here either.
#
# Events (PostHog):
#   loki_installed        first-ever invocation of ANY loki command
#   first_help_seen       first time the user landed on help/welcome (looked but
#                         has not built) -- a "curious, did not commit" signal
#   first_start_attempted first `loki start`
#   first_start_blocked   a first start that could NOT proceed to iteration 1,
#                         with reason= (no_api_key | no_spec | spec_error | other)
#                         -- THIS is the drop-off the 95% almost certainly hit
#   first_build_complete  first build that reached a terminal COMPLETE outcome
#   returned_day2         first invocation on a later calendar day (retention)
#
# All best-effort, non-blocking, never fail the command. Markers under
# ~/.loki/funnel/ (respects HOME). Honors every telemetry opt-out because it goes
# through loki_telemetry(), which returns early when telemetry is disabled.
#
# No emojis. No em dashes.

_LOKI_FUNNEL_DIR="${HOME}/.loki/funnel"

# _loki_funnel_once <marker-name> <event> [key=value...]
# Emit <event> exactly once per machine, guarded by a marker file. The marker is
# written whether or not telemetry is enabled, so an opt-out user still never
# re-fires (and never emits). Returns 0 always.
_loki_funnel_once() {
    local marker="$1"; shift
    local event="$1"; shift
    local mfile="${_LOKI_FUNNEL_DIR}/${marker}"
    [ -f "$mfile" ] && return 0
    mkdir -p "$_LOKI_FUNNEL_DIR" 2>/dev/null || return 0
    : > "$mfile" 2>/dev/null || true
    if declare -f loki_telemetry >/dev/null 2>&1; then
        ( loki_telemetry "$event" "$@" >/dev/null 2>&1 & ) || true
    fi
    return 0
}

# _loki_funnel_installed: fire loki_installed on the very first invocation of any
# command. Call this once, early, from the CLI dispatch for every command.
_loki_funnel_installed() {
    _loki_funnel_once "installed" "loki_installed" "entry=${1:-unknown}"
    # Retention: record today's date; if a prior run's date differs, that is a
    # day-2+ return. Cheap, marker-based, no network beyond the one event.
    _loki_funnel_retention
}

# _loki_funnel_help_seen: the user reached help/welcome (curiosity) but has not
# yet started a build. Only meaningful before first_start.
_loki_funnel_help_seen() {
    [ -f "${_LOKI_FUNNEL_DIR}/start_attempted" ] && return 0
    _loki_funnel_once "help_seen" "first_help_seen" "surface=${1:-help}"
}

# _loki_funnel_start_attempted: first `loki start`.
_loki_funnel_start_attempted() {
    _loki_funnel_once "start_attempted" "first_start_attempted"
}

# _loki_funnel_start_blocked <reason>: a FIRST start that could not proceed to a
# build. reason in {no_api_key, no_spec, spec_error, permission, other}. This is
# the highest-value event: it names WHY the 95% bounce. Fires once.
_loki_funnel_start_blocked() {
    _loki_funnel_once "start_blocked" "first_start_blocked" "reason=${1:-other}"
}

# _loki_funnel_build_complete: first build to reach a terminal COMPLETE outcome.
_loki_funnel_build_complete() {
    _loki_funnel_once "build_complete" "first_build_complete" "iterations=${1:-0}"
}

# _loki_funnel_retention: emit returned_dayN the first time a run happens on a
# calendar day AFTER the install day. One event per machine (the first return).
_loki_funnel_retention() {
    local rfile="${_LOKI_FUNNEL_DIR}/.first_day"
    local today
    today="$(date -u +%Y-%m-%d 2>/dev/null)" || return 0
    if [ ! -f "$rfile" ]; then
        printf '%s' "$today" > "$rfile" 2>/dev/null || true
        return 0
    fi
    local first_day
    first_day="$(cat "$rfile" 2>/dev/null)"
    if [ -n "$first_day" ] && [ "$first_day" != "$today" ]; then
        _loki_funnel_once "returned" "returned_day2" "first_day=${first_day}"
    fi
}
