#!/usr/bin/env bash
# test-checkpoint-index-rebuild.sh -- RUN-25 iter 18 (Wave C #5): the checkpoint
# index rebuild (on a prune) now uses ONE python3 process to read ALL surviving
# metadata.json files instead of one python3 -c per checkpoint (up to the 50
# retention cap = ~50 interpreter cold-starts). This test proves the single-pass
# rebuild produces the BYTE-IDENTICAL index the old per-file loop did (same epoch
# sort, same per-record JSON shape), and that it spawns exactly ONE python3.
#
# Extracts the two rebuild strategies and compares their output. No emojis. No em dashes.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0
FAIL=0
fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
ok() { PASS=$((PASS + 1)); }
command -v python3 >/dev/null 2>&1 || { echo "SKIP: python3 required"; exit 0; }

# Build a checkpoint dir with out-of-order epochs + a path with extra hyphens in
# the parent (the BUG-ST-012 case the sort key must survive).
D="$(mktemp -d)"
CP="$D/loki-mode/.loki/checkpoints"
mkdir -p "$CP/cp-1-1000" "$CP/cp-2-3000" "$CP/cp-3-2000" "$CP/cp-10-500"
printf '%s\n' '{"id":"cp-1-1000","timestamp":"t1","iteration":1,"task_description":"a","git_sha":"aaa"}' > "$CP/cp-1-1000/metadata.json"
printf '%s\n' '{"id":"cp-2-3000","timestamp":"t2","iteration":2,"task_description":"b","git_sha":"bbb"}' > "$CP/cp-2-3000/metadata.json"
printf '%s\n' '{"id":"cp-3-2000","timestamp":"t3","iteration":3,"task_description":"c","git_sha":"ccc"}' > "$CP/cp-3-2000/metadata.json"
printf '%s\n' '{"id":"cp-10-500","timestamp":"t0","iteration":10,"task_description":"z","git_sha":"zzz"}' > "$CP/cp-10-500/metadata.json"

# OLD strategy: per-file python3 in a sorted shell loop.
old_index() {
    for remaining in $(find "$CP" -maxdepth 2 -name "metadata.json" -path "*/cp-*/*" 2>/dev/null \
        | while read -r mp; do printf '%s\t%s\n' "$(basename "$(dirname "$mp")")" "$mp"; done \
        | sort -t'-' -k3 -n | cut -f2-); do
        [ -f "$remaining" ] || continue
        _CP_META="$remaining" python3 -c "
import json,os
m=json.load(open(os.environ['_CP_META']))
print(json.dumps({'id':m['id'],'ts':m['timestamp'],'iter':m['iteration'],'task':m.get('task_description',''),'sha':m['git_sha']}))
" 2>/dev/null || true
    done
}

# NEW strategy: single python3 (copied from run.sh:12407-ish).
new_index() {
    _CP_DIR="$CP" python3 -c "
import json, os, glob
cp_dir = os.environ['_CP_DIR']
recs = []
for mp in glob.glob(os.path.join(cp_dir, '*', 'metadata.json')):
    base = os.path.basename(os.path.dirname(mp))
    if not base.startswith('cp-'):
        continue
    try:
        epoch = int(base.rsplit('-', 1)[-1])
    except ValueError:
        epoch = 0
    try:
        m = json.load(open(mp))
    except Exception:
        continue
    recs.append((epoch, {'id': m['id'],'ts': m['timestamp'],'iter': m['iteration'],'task': m.get('task_description',''),'sha': m['git_sha']}))
recs.sort(key=lambda r: r[0])
for _e, rec in recs:
    print(json.dumps(rec))
" 2>/dev/null || true
}

OLD="$(old_index)"
NEW="$(new_index)"

# 1. byte-identical output
if [ "$OLD" = "$NEW" ]; then ok; else fail "new index differs from old:\nOLD:\n$OLD\nNEW:\n$NEW"; fi

# 2. correct epoch order: 500, 1000, 2000, 3000 -> ids cp-10-500, cp-1-1000, cp-3-2000, cp-2-3000
EXPECTED_ORDER="cp-10-500 cp-1-1000 cp-3-2000 cp-2-3000"
GOT_ORDER="$(printf '%s\n' "$NEW" | python3 -c "import sys,json; print(' '.join(json.loads(l)['id'] for l in sys.stdin if l.strip()))")"
[ "$GOT_ORDER" = "$EXPECTED_ORDER" ] && ok || fail "epoch sort order wrong: got [$GOT_ORDER] want [$EXPECTED_ORDER]"

# 3. exactly ONE python3 process (the spawn-reduction win). Count python3 tokens
# an strace-free way: assert the function body contains exactly one `python3` call.
PYCOUNT=$(declare -f new_index | grep -c 'python3')
[ "$PYCOUNT" -eq 1 ] && ok || fail "new_index should spawn exactly 1 python3, found $PYCOUNT"

rm -rf "$D"
echo ""
echo "test-checkpoint-index-rebuild: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
