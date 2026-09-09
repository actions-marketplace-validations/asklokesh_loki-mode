#!/usr/bin/env bash
# plugin.json must track VERSION, or plugin updates pin users to a stale build.
#
# WHY THIS EXISTS. plugins/loki-mode/.claude-plugin/plugin.json carries the
# version Claude Code reads to decide whether an installed plugin is out of
# date. It was added to the release checklist in v7.39.0 precisely because it
# "pins plugin updates, must track VERSION" -- and then drifted anyway: it sat
# at 9.22.10 while the repo shipped 9.22.11, 9.22.12 and 9.22.13. Three
# consecutive releases bumped VERSION and left this file behind.
#
# The failure mode is the same quiet one that let server.json drift past thirty
# releases: nothing breaks locally, no gate goes red, and the cost lands on
# users whose plugin never offers the update. A checklist entry did not prevent
# it, which is the whole argument for testing the invariant instead of
# documenting it. See tests/test-server-json-current.sh for the sibling case.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PASS=0; FAIL=0
ok()  { echo "  [PASS] $1"; PASS=$((PASS+1)); }
bad() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }

PLUGIN_JSON="$REPO_ROOT/plugins/loki-mode/.claude-plugin/plugin.json"
VERSION_FILE="$REPO_ROOT/VERSION"

if [ ! -f "$PLUGIN_JSON" ]; then
    echo "  [SKIP] plugin.json not present"
    echo "Results: 0 passed, 0 failed, 0 total"
    exit 0
fi

want="$(tr -d ' \n' < "$VERSION_FILE")"

echo "T1 -- plugin.json tracks VERSION"

# Assert the value individually rather than counting matches: a threshold
# cannot say WHICH file drifted, and picks up slack it was never meant to have.
got=$(python3 -c "import json;print(json.load(open('$PLUGIN_JSON'))['version'])" 2>/dev/null)
if [ -z "$got" ]; then
    bad "plugin.json version could not be read -- an empty result is an absent measurement, not a pass"
elif [ "$got" = "$want" ]; then
    ok "plugin.json version ($got) matches VERSION"
else
    bad "plugin.json version is $got but VERSION is $want -- plugin updates would pin users to a stale build"
fi

echo
echo "T2 -- the manifest stays installable"

# A malformed manifest is unusable regardless of its version, and this file is
# edited by release automation on every bump.
if python3 -c "import json;json.load(open('$PLUGIN_JSON'))" >/dev/null 2>&1; then
    ok "plugin.json is valid JSON"
else
    bad "plugin.json is not valid JSON"
fi

name=$(python3 -c "import json;print(json.load(open('$PLUGIN_JSON')).get('name',''))" 2>/dev/null)
if [ "$name" = "loki-mode" ]; then
    ok "plugin name is loki-mode"
else
    bad "plugin name is '$name', expected loki-mode"
fi

echo
echo "==============================================================="
echo "Results: $PASS passed, $FAIL failed, $((PASS+FAIL)) total"
[ "$FAIL" -eq 0 ]
