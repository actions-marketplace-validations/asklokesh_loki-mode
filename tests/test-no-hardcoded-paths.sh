#!/usr/bin/env bash
# Test: no test may hardcode an absolute path into somebody's home directory.
#
# THE BUG (found 2026-07-28 while triaging CI)
#   Three suites grepped and syntax-probed a hardcoded
#   /Users/lokesh/git/loki-mode/... -- one developer's checkout, and not even
#   the directory this repo lives in. On CI every one of those reads produced
#   "grep: ...: No such file or directory" and the assertion failed for a reason
#   with nothing to do with the code under test:
#
#     FAIL: non-TTY auto-confirm branch missing
#     FAIL: stdin-tty check missing
#     FAIL: autonomy/loki bash -n syntax FAIL
#
#   The file was fine. The path was wrong. Worse, the failure text accused the
#   product of a missing safety branch, which is exactly the kind of false
#   accusation that burns a debugging cycle.
#
#   The suites passed locally only because a stale checkout happened to exist at
#   that path, so this was invisible on the machine that wrote them.
#
# THE RULE: resolve from the script's own location.
#   REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
#
# Proven directions:
#   POSITIVE : no test file contains an absolute /Users/<name> or /home/<name>
#              path in executable code. RED before the fix (3 files did).
#   COMMENTS : an explanatory comment naming the old bad path is allowed --
#              those document the fix and must not re-trip the guard.
#   NON-VACUOUS: the detector matches a planted offender, so a broken regex
#              cannot make this pass silently.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PASS=0
FAIL=0
ok()  { printf '  PASS: %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  FAIL: %s\n' "$1"; FAIL=$((FAIL+1)); }

echo "=== no hardcoded home-directory paths in tests ==="

# Executable lines only: a comment explaining the historical bad path is fine.
scan() {
    # Only a path used as a FILESYSTEM OPERAND is a portability bug. Synthetic
    # paths inside quoted fixture data (e.g. '/Users/jdoe/.ssh/id_rsa' fed to a
    # redaction test) are inputs, not reads, and are perfectly portable. Match
    # the real hazard: an UNQUOTED absolute path that a command acts on.
    grep -rnE '(^|[[:space:]])(/Users/[a-z0-9_.-]+|/home/[a-z0-9_.-]+)/[^[:space:]"'"'"']*([[:space:]]|$)' "$1"/*.sh 2>/dev/null \
        | while IFS= read -r line; do
            body="${line#*:}"; body="${body#*:}"
            trimmed="$(printf '%s' "$body" | sed 's/^[[:space:]]*//')"
            case "$trimmed" in
                '#'*) continue ;;
            esac
            # The guard file itself necessarily contains the pattern as a needle.
            case "$line" in
                *test-no-hardcoded-paths.sh:*) continue ;;
            esac
            printf '%s\n' "$line"
        done
}

offenders="$(scan "$SCRIPT_DIR")"

if [ -z "$offenders" ]; then
    ok "no test hardcodes an absolute home-directory path"
else
    bad "hardcoded absolute paths found (these break on CI and other machines):"
    printf '%s\n' "$offenders" | sed 's/^/        /' | head -20
fi

# ---- NON-VACUOUS: the detector must catch a planted offender --------------
TMP="$(mktemp -d "${TMPDIR:-/tmp}/loki-hardpath-XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
cat > "$TMP/planted.sh" <<'EOF'
#!/usr/bin/env bash
# a comment mentioning /Users/someone/repo/file must NOT trip the guard
grep -q needle /Users/someone/repo/autonomy/loki
EOF
planted="$(scan "$TMP")"
if printf '%s' "$planted" | grep -q 'planted.sh'; then
    ok "detector catches a planted hardcoded path (guard is non-vacuous)"
else
    bad "detector missed a planted offender -- the scan regex is broken"
fi
# And the comment on line 2 must not have been what matched.
if [ "$(printf '%s' "$planted" | wc -l | tr -d ' ')" -le 1 ]; then
    ok "an explanatory comment naming a path does not trip the guard"
else
    bad "comment lines are being flagged; the fix docs would re-break this"
fi

echo ""
echo "  Passed: $PASS   Failed: $FAIL"
[ "$FAIL" -eq 0 ]
