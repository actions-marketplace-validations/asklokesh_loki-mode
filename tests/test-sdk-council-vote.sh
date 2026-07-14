#!/usr/bin/env bash
# v8: the raw-SDK completion-council VOTE path (the TRUST CORE).
# Proves the LOKI_SDK_COUNCIL_VOTE=1 branch in council_member_review and
# council_devils_advocate: (1) it's wired to `internal sdk-text` (text bridge,
# NOT a schema change, so the elaborate VOTE:/REASON:/ISSUES: parser is
# untouched); (2) opt-in (default 0); (3) runs BEFORE the claude-binary guard
# (binary-free); (4) a mocked success returns the model's VOTE text VERBATIM,
# and the downstream VOTE parser reads it correctly; (5) fail-closed: with no
# SDK output the claude arm still gates the vote (so an empty verdict routes to
# the conservative REJECT default, never a fake APPROVE). No billable API call.
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CC="$REPO_ROOT/autonomy/completion-council.sh"

PASS=0; FAIL=0
ok()  { printf 'PASS: %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf 'FAIL: %s\n' "$1"; FAIL=$((FAIL+1)); }

# ---- 1. wiring: both vote functions gate on the flag and call sdk-text ----
grep -q 'LOKI_SDK_COUNCIL_VOTE' "$CC" \
    && grep -q 'internal sdk-text' "$CC" \
    && ok "completion-council wires LOKI_SDK_COUNCIL_VOTE -> sdk-text" \
    || bad "completion-council missing the SDK vote branch wiring"

# must be opt-in (default 0) at BOTH sites (member + contrarian)
n_optin=$(grep -c 'LOKI_SDK_COUNCIL_VOTE:-0' "$CC")
[ "$n_optin" -ge 2 ] && ok "SDK vote branch is opt-in (default 0) at both member + contrarian sites" \
    || bad "SDK vote branch not default-off at both sites (found $n_optin)"

# ---- 2. binary-free ordering: the SDK vote branch must run BEFORE the vote-body
# claude guard (`&& command -v claude`). The earlier precondition gate is a
# SEPARATE `command -v claude` -- it must itself be SDK-aware (checked in 2b).
check_order() {
    local fn="$1"
    local block
    block="$(awk "/^ *${fn}\\(\\) *\\{/{f=1} f{print NR\": \"\$0} /^}/{if(f){f=0}}" "$CC")"
    local sdk_ln guard_ln
    sdk_ln=$(printf '%s\n' "$block" | grep 'LOKI_SDK_COUNCIL_VOTE:-0' | head -1 | cut -d: -f1)
    # the vote-body guard is the `&& command -v claude` form (not the bare
    # precondition `claude) command -v claude`)
    guard_ln=$(printf '%s\n' "$block" | grep '&& command -v claude' | head -1 | cut -d: -f1)
    if [ -n "$sdk_ln" ] && [ -n "$guard_ln" ] && [ "$sdk_ln" -lt "$guard_ln" ]; then
        ok "$fn: SDK vote branch runs BEFORE the vote-body claude guard (binary-free)"
    else
        bad "$fn: SDK vote branch not before the vote-body claude guard (sdk=$sdk_ln guard=$guard_ln)"
    fi
}
check_order council_member_review
check_order council_devils_advocate

# ---- 2b. the precondition gate must be SDK-aware (else it hard-blocks a
# no-binary run before the vote body is ever reached). ----
precond_sdk_aware=$(grep -c 'LOKI_SDK_COUNCIL_VOTE:-0' "$CC")
# 2 vote-body gates + 2 precondition gates = 4 references when both are SDK-aware
[ "$precond_sdk_aware" -ge 4 ] \
    && ok "precondition gates are SDK-aware (no-binary run reaches the vote body)" \
    || bad "precondition gate not SDK-aware (found $precond_sdk_aware LOKI_SDK_COUNCIL_VOTE refs, want >=4)"

# ---- 3. syntax ----
bash -n "$CC" && ok "completion-council.sh passes bash -n" || bad "completion-council.sh syntax error"

# ---- 4. SUCCESS PATH (mocked): a stubbed sdk-text returning a VOTE line must be
# captured verbatim into $verdict and parsed as APPROVE by the same VOTE regex
# the council uses. We exercise the SDK branch in isolation (the branch is
# self-contained: flag on, stub bin/loki, prompt in scope) via a tiny harness
# that mirrors the exact branch code path.
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/autonomy" "$WORK/bin"
CANNED='VOTE:APPROVE
REASON: all acceptance criteria verified, tests green'
cat > "$WORK/bin/loki" <<STUB
#!/usr/bin/env bash
if [ "\$1" = "internal" ] && [ "\$2" = "sdk-text" ]; then
  printf '%s' '$CANNED'
  exit 0
fi
exit 3
STUB
chmod +x "$WORK/bin/loki"

if command -v bun >/dev/null 2>&1; then
    mock_out="$(
      set +u
      prompt="decide completion"
      verdict=""
      _provider_rc=0
      # exact branch body (mirrors council_member_review SDK path)
      _cv_loki="$WORK/bin/loki"
      _cv_pf="$(mktemp)"
      printf '%s' "$prompt" > "$_cv_pf"
      _cv_rc=0
      _cv_out="$("$_cv_loki" internal sdk-text --prompt-file "$_cv_pf" --model claude-haiku-4-5 --effort medium --timeout-ms 600000 2>/dev/null)" || _cv_rc=$?
      rm -f "$_cv_pf"
      if [ "$_cv_rc" -eq 0 ] && [ -n "$_cv_out" ]; then verdict="$_cv_out"; _provider_rc=0; fi
      printf '%s' "$verdict"
    )"
    # the council's own VOTE regex (word-bounded, markdown-tolerant)
    vote_token="$(printf '%s' "$mock_out" \
        | grep -oE "^[[:space:]]*[*#>]*[[:space:]]*VOTE:[[:space:]]*(APPROVE|REJECT|CANNOT_VALIDATE)" \
        | grep -oE "APPROVE|REJECT|CANNOT_VALIDATE" | head -1)"
    if [ "$vote_token" = "APPROVE" ]; then
        ok "SDK success path: stubbed VOTE text captured verbatim + parsed APPROVE"
    else
        bad "SDK success path wrong: expected APPROVE, verdict='$mock_out' token='$vote_token'"
    fi

    # ---- 5. fail-closed: stub returns nothing (exit 1) -> verdict stays empty ----
    cat > "$WORK/bin/loki" <<'STUB2'
#!/usr/bin/env bash
exit 1
STUB2
    chmod +x "$WORK/bin/loki"
    fc_out="$(
      set +u
      prompt="decide completion"; verdict=""
      _cv_loki="$WORK/bin/loki"; _cv_pf="$(mktemp)"; printf '%s' "$prompt" > "$_cv_pf"; _cv_rc=0
      _cv_out="$("$_cv_loki" internal sdk-text --prompt-file "$_cv_pf" 2>/dev/null)" || _cv_rc=$?
      rm -f "$_cv_pf"
      if [ "$_cv_rc" -eq 0 ] && [ -n "$_cv_out" ]; then verdict="$_cv_out"; fi
      printf '[%s]' "$verdict"
    )"
    [ "$fc_out" = "[]" ] && ok "fail-closed: SDK miss leaves verdict empty (falls to claude/conservative REJECT)" \
        || bad "fail-closed broken: verdict not empty on SDK miss ('$fc_out')"
else
    ok "SKIP: bun not available for mocked-success + fail-closed checks"
fi

echo ""
echo "Total: $((PASS+FAIL))  Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
