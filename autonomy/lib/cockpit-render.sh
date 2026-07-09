#!/usr/bin/env bash
# autonomy/lib/cockpit-render.sh -- state gathering + render dispatch for
# `loki cockpit`. Thin wrapper: it builds a CockpitState JSON from the machine
# registry + each project's .loki state, then pipes it to the pure Bun render
# pipeline (loki-ts/src/cockpit/cli.ts). All the SVG/PNG/terminal-encode logic
# lives there so it stays bun-testable; this file only does I/O and fallback.
#
# Contract with the TS entry:
#   stdin  : CockpitState JSON
#   stdout : raw terminal image escape (image path), empty on fallback
#   exit 0 : image emitted ; exit 3 : fallback (reason on stderr as FALLBACK\t..)
#   other  : hard error (bun missing etc.) -> caller falls back too
#
# Nothing here changes cmd_watch or any existing command.

# cockpit_gather_state <skill_dir> <focus_repo_or_empty>
# Emits a CockpitState JSON on stdout. Never fails hard: missing files degrade
# to empty/default fields so the render always has something to show.
cockpit_gather_state() {
    local skill_dir="$1"
    local focus_repo="${2:-}"

    if ! command -v python3 >/dev/null 2>&1; then
        # No python: emit a minimal single-repo state from the cwd only.
        printf '{"run":"%s","iteration":0,"phase":"unknown","tier":"","provider":"","verdict":"unknown","budgetUsd":0,"gates":[],"council":[],"fleet":[]}\n' \
            "$(basename "$(pwd)")"
        return 0
    fi

    LOKI_CK_SKILL="$skill_dir" LOKI_CK_FOCUS="$focus_repo" LOKI_CK_CWD="$(pwd)" \
    python3 - <<'PYCOCKPIT' 2>/dev/null || printf '{"run":"cockpit","iteration":0,"phase":"unknown","tier":"","provider":"","verdict":"unknown","budgetUsd":0,"gates":[],"council":[],"fleet":[]}\n'
import json, os, sys

skill = os.environ.get("LOKI_CK_SKILL", ".")
focus = (os.environ.get("LOKI_CK_FOCUS") or "").strip()
cwd = os.environ.get("LOKI_CK_CWD") or os.getcwd()
sys.path.insert(0, skill)


def read_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}


def project_state(path):
    """Best-effort per-project state from its .loki/ files."""
    loki = os.path.join(path, ".loki")
    st = read_json(os.path.join(loki, "autonomy-state.json"))
    ev = read_json(os.path.join(loki, "verify", "evidence.json"))

    iteration = st.get("iterationCount", st.get("iteration", 0)) or 0
    phase = st.get("phase") or st.get("status") or ""

    verdict = "unknown"
    v = str(ev.get("verdict", "")).upper()
    if v in ("PASS", "VERIFIED"):
        verdict = "verified"
    elif v in ("BLOCKED", "FAIL", "FAILED"):
        verdict = "failed"
    elif v in ("WORKING", "PARTIAL", "INCONCLUSIVE"):
        verdict = "working"
    elif v:
        verdict = "pending"

    gates = []
    for g in ev.get("deterministic_gates", []) or []:
        gs = str(g.get("status", "")).lower()
        status = {"pass": "pass", "fail": "fail", "failed": "fail",
                  "skipped": "skip", "skip": "skip"}.get(gs, "pending")
        gates.append({"name": g.get("gate", "gate"), "status": status})

    # Council votes: .loki/council/*.json, each with a vote-ish field.
    council = []
    cdir = os.path.join(loki, "council")
    try:
        for fn in sorted(os.listdir(cdir)):
            if not fn.endswith(".json"):
                continue
            cj = read_json(os.path.join(cdir, fn))
            raw = str(cj.get("vote") or cj.get("verdict") or "").lower()
            vote = "pending"
            if "approve" in raw:
                vote = "approve"
            elif "reject" in raw:
                vote = "reject"
            elif "concern" in raw:
                vote = "concern"
            reviewer = cj.get("reviewer") or cj.get("name") or os.path.splitext(fn)[0]
            council.append({"reviewer": str(reviewer)[:16], "vote": vote})
    except Exception:
        pass

    return {
        "iteration": int(iteration) if isinstance(iteration, (int, float)) else 0,
        "phase": phase or "idle",
        "verdict": verdict,
        "gates": gates,
        "council": council,
        "budgetUsd": float(st.get("cost_usd", 0.0) or 0.0),
        "tier": st.get("tier", "") or "",
        "provider": st.get("provider", "") or "",
    }


# Fleet from the registry; graceful empty on any failure.
fleet = []
runs = []
try:
    from dashboard import registry
    runs = registry.get_fleet_runs(include_inactive=True)
except Exception:
    runs = []

for r in runs:
    fleet.append({
        "name": r.get("name") or os.path.basename(r.get("path", "") or "project"),
        "phase": r.get("phase", "") or "",
        "iteration": r.get("iteration", 0) or 0,
        "status": r.get("status", "") or "",
        "running": bool(r.get("running")),
    })

# Focused run: --repo wins; else first running fleet run; else cwd.
focus_path = focus or cwd
focus_entry = None
for r in runs:
    rp = os.path.abspath(r.get("path", "") or "")
    if rp and rp == os.path.abspath(focus_path):
        focus_entry = r
        break
if focus_entry is None and not focus:
    for r in runs:
        if r.get("running"):
            focus_entry = r
            focus_path = r.get("path", "") or cwd
            break

ps = project_state(focus_path)
run_name = (focus_entry or {}).get("name") if focus_entry else os.path.basename(os.path.abspath(focus_path))

# Registry values override file reads where present (registry is fresher).
if focus_entry:
    if focus_entry.get("iteration"):
        ps["iteration"] = focus_entry["iteration"]
    if focus_entry.get("phase"):
        ps["phase"] = focus_entry["phase"]
    if focus_entry.get("cost_usd"):
        ps["budgetUsd"] = float(focus_entry["cost_usd"])

state = {
    "run": run_name or "cockpit",
    "iteration": ps["iteration"],
    "phase": ps["phase"],
    "tier": ps["tier"] or (os.environ.get("LOKI_SESSION_MODEL", "")),
    "provider": ps["provider"] or (os.environ.get("LOKI_PROVIDER", "claude")),
    "verdict": ps["verdict"],
    "budgetUsd": ps["budgetUsd"],
    "budgetLimitUsd": float(os.environ.get("LOKI_MAX_BUDGET_USD", "0") or 0) or None,
    "freshness": "now",
    "gates": ps["gates"],
    "council": ps["council"],
    "fleet": fleet,
}
print(json.dumps(state))
PYCOCKPIT
}

# cockpit_render <skill_dir> <ts_dir> <protocol> <no_image> <focus_repo>
# Returns: 0 (image emitted to stdout), 3 (fallback), or 2 (bun unavailable).
# On fallback / bun-missing the caller is responsible for the text summary.
cockpit_render() {
    local skill_dir="$1" ts_dir="$2" protocol="${3:-auto}" no_image="${4:-0}" focus_repo="${5:-}"

    # Prefer the shipped bundle (dist/cockpit.js -- present in npm/Docker/brew
    # installs, which ship loki-ts/dist/ but not src/); fall back to the source
    # entry for in-repo development.
    local entry="$ts_dir/dist/cockpit.js"
    [ -f "$entry" ] || entry="$ts_dir/src/cockpit/cli.ts"
    if ! command -v bun >/dev/null 2>&1 || [ ! -f "$entry" ]; then
        return 2
    fi

    local args=(--protocol "$protocol")
    [ "$no_image" = "1" ] && args+=(--no-image)

    # Gather -> render. Preserve the TS exit code (0 image / 3 fallback).
    cockpit_gather_state "$skill_dir" "$focus_repo" | bun "$entry" "${args[@]}"
}
