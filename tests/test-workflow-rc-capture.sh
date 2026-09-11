#!/usr/bin/env bash
# A workflow step that captures RC must be able to reach the code that reads it.
#
# THE DEFECT, observed in CI: post-release smoke failed on both npm and docker
# with no diagnostic. The steps looked correct:
#
#     set -uo pipefail
#     loki doctor --json > /tmp/doctor.json
#     RC=$?
#     if [ "$RC" -ne 0 ]; then echo "FATAL: ..."; exit 1; fi
#
# GitHub runs steps with `bash -e {0}`, so -e is ON regardless of that set line.
# A non-zero exit aborts the step BEFORE `RC=$?` is read, so the handler never
# runs and the job fails with no message about what actually broke. Proven:
#
#     bash    probe.sh -> "handler reached, RC=1"   exit 0
#     bash -e probe.sh -> (no output)               exit 1
#
# The fix is `|| RC=$?` on the command itself. This suite makes the pattern
# unable to come back, because the failure mode is silent: the workflow does not
# report "your handler is unreachable", it just dies.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }

echo "test-workflow-rc-capture"

if ! command -v python3 >/dev/null 2>&1; then
    fail "python3 unavailable: workflow RC capture was not measured (unmeasured, not clean)"
    echo "  $PASS passed, $FAIL failed"
    exit 1
fi

# 1. The mechanism itself, demonstrated rather than asserted from memory. If
#    this ever stops holding, the rest of this suite is guarding nothing.
PROBE="$(mktemp)"
printf '%s\n' 'set -uo pipefail' 'false > /dev/null' 'RC=$?' 'echo "REACHED:$RC"' > "$PROBE"
without="$(bash "$PROBE" 2>&1 || true)"
with="$(bash -e "$PROBE" 2>&1 || true)"
rm -f "$PROBE"
if printf '%s' "$without" | grep -q 'REACHED:1' && ! printf '%s' "$with" | grep -q 'REACHED'; then
    pass "confirmed: under bash -e the RC handler is unreachable"
else
    fail "the bash -e mechanism did not reproduce (without='$without' with='$with')"
fi

# 2. No workflow step may follow a bare command with RC=$?.
OFFENDERS="$(python3 - <<'PY' 2>&1
import glob, io, re, sys
bad = []
for f in sorted(glob.glob('.github/workflows/*.yml')):
    try:
        s = io.open(f, encoding='utf-8').read()
    except OSError:
        print("UNREADABLE %s" % f)
        sys.exit(0)
    for m in re.finditer(r'\n(\s+)([^\n|]*\S)\n\s*RC=\$\?', s):
        cmd = m.group(2).strip()
        # A comment line, or a command that already captures with || RC=$?.
        if cmd.startswith('#') or '||' in cmd:
            continue
        bad.append("%s: %s" % (f.split('/')[-1], cmd[:70]))
for b in bad:
    print(b)
PY
)"
case "$OFFENDERS" in
    *UNREADABLE*)
        fail "could not read the workflows (unmeasured, not clean): $OFFENDERS"
        ;;
    "")
        pass "every workflow RC capture uses || RC=\$? and is reachable"
        ;;
    *)
        fail "unreachable RC handler(s): $(printf '%s' "$OFFENDERS" | head -3 | tr '\n' ' ')"
        ;;
esac

# 3. GUARD AGAINST VACUITY. If the scan found no workflows at all it would
#    report nothing wrong. An empty corpus is an absent measurement.
NWF="$(ls .github/workflows/*.yml 2>/dev/null | wc -l | tr -d ' ')"
if [ "${NWF:-0}" -ge 3 ]; then
    pass "the scan examined $NWF workflow files"
else
    fail "only ${NWF:-0} workflow files found; the scan is too thin to mean anything"
fi

# 4. Every workflow must still be valid YAML after any edit here.
if python3 -c "
import yaml, glob, sys
for f in glob.glob('.github/workflows/*.yml'):
    yaml.safe_load(open(f, encoding='utf-8'))
" 2>/dev/null; then
    pass "all workflow YAML parses"
else
    fail "a workflow file is no longer valid YAML"
fi

echo "  $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
