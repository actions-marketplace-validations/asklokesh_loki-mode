// @bun
var q8=Object.defineProperty;var J8=($)=>$;function V8($,Q){this[$]=J8.bind(null,Q)}var b=($,Q)=>{for(var Z in Q)q8($,Z,{get:Q[Z],enumerable:!0,configurable:!0,set:V8.bind(Q,Z)})};var P=($,Q)=>()=>($&&(Q=$($=0)),Q);var J$=import.meta.require;var m1={};b(m1,{lokiDir:()=>j,homeLokiDir:()=>T$,findRepoRootForVersion:()=>$1,REPO_ROOT:()=>h});import{resolve as t,dirname as e$}from"path";import{fileURLToPath as W8}from"url";import{existsSync as N$}from"fs";import{homedir as H8}from"os";function G8(){let $=v1;for(let Q=0;Q<6;Q++){if(N$(t($,"VERSION"))&&N$(t($,"autonomy/run.sh")))return $;let Z=e$($);if(Z===$)break;$=Z}return t(v1,"..","..","..")}function $1($){let Q=$;for(let Z=0;Z<6;Z++){if(N$(t(Q,"VERSION"))&&N$(t(Q,"autonomy/run.sh")))return Q;let z=e$(Q);if(z===Q)break;Q=z}return t($,"..","..","..")}function j(){return process.env.LOKI_DIR??t(process.cwd(),".loki")}function T$(){return t(H8(),".loki")}var v1,h;var C=P(()=>{v1=e$(W8(import.meta.url));h=G8()});import{readFileSync as U8}from"fs";import{resolve as Y8,dirname as B8}from"path";import{fileURLToPath as M8}from"url";function S$(){if(Q$!==null)return Q$;let $="7.128.0";if(typeof $==="string"&&$.length>0)return Q$=$,Q$;try{let Q=B8(M8(import.meta.url)),Z=$1(Q);Q$=U8(Y8(Z,"VERSION"),"utf-8").trim()}catch{Q$="unknown"}return Q$}var Q$=null;var Q1=P(()=>{C()});var p1={};b(p1,{runOrThrow:()=>S8,run:()=>R,readStreamCapped:()=>c1,commandVersion:()=>C8,commandExists:()=>u,ShellError:()=>Z1,MAX_STDOUT_BYTES:()=>u1});async function c1($,Q=u1){let Z=$.getReader(),z=new TextDecoder,X="",q=0;try{while(q<Q){let{done:K,value:W}=await Z.read();if(K)break;if(!W)continue;if(q+=W.byteLength,q>Q){let V=W.byteLength-(q-Q);X+=z.decode(W.subarray(0,V),{stream:!0});break}X+=z.decode(W,{stream:!0})}X+=z.decode()}finally{try{await Z.cancel()}catch{}Z.releaseLock()}return X}async function R($,Q={}){let Z=Bun.spawn({cmd:[...$],stdout:"pipe",stderr:"pipe",env:Q.env?{...process.env,...Q.env}:process.env,cwd:Q.cwd}),z,X;if(Q.timeoutMs&&Q.timeoutMs>0)z=setTimeout(()=>{try{Z.kill("SIGTERM")}catch{}X=setTimeout(()=>{try{Z.kill("SIGKILL")}catch{}},2000)},Q.timeoutMs);try{let[q,K,W]=await Promise.all([c1(Z.stdout),new Response(Z.stderr).text(),Z.exited]);return{stdout:q,stderr:K,exitCode:W}}finally{if(z)clearTimeout(z);if(X)clearTimeout(X)}}async function S8($,Q={}){let Z=await R($,Q);if(Z.exitCode!==0)throw new Z1(`command failed (${Z.exitCode}): ${$.join(" ")}`,Z.exitCode,Z.stdout,Z.stderr);return Z}async function u($){let Q=D8($),Z=await R(["sh","-c",`command -v ${Q}`],{timeoutMs:5000});if(Z.exitCode===0)return Z.stdout.trim()||null;return null}function D8($){if(!/^[A-Za-z0-9._/-]+$/.test($))throw Error(`refused to shell-escape suspect token: ${$}`);return $}async function C8($,Q="--version"){if(!await u($))return null;let z=await R([$,Q],{timeoutMs:5000});if(z.exitCode!==0)return null;return((z.stdout||z.stderr).split(/\r?\n/)[0]?.trim()??"")||null}var u1=16777216,Z1;var o=P(()=>{Z1=class Z1 extends Error{message;exitCode;stdout;stderr;constructor($,Q,Z,z){super($);this.message=$;this.exitCode=Q;this.stdout=Z;this.stderr=z;this.name="ShellError"}}});function r($){return b8?"":$}var b8,M,S,_,tZ,L,k,y,J;var p=P(()=>{b8=(process.env.NO_COLOR??"").length>0;M=r("\x1B[0;31m"),S=r("\x1B[0;32m"),_=r("\x1B[1;33m"),tZ=r("\x1B[0;34m"),L=r("\x1B[0;36m"),k=r("\x1B[1m"),y=r("\x1B[2m"),J=r("\x1B[0m")});import{existsSync as l8}from"fs";async function Z$(){if(A$!==void 0)return A$;let $="/opt/homebrew/bin/python3.12";if(l8($))return A$=$,$;let Q=await u("python3.12");if(Q)return A$=Q,Q;let Z=await u("python3");return A$=Z,Z}async function z$($,Q={}){let Z=await Z$();if(!Z)return{stdout:"",stderr:"python3 not found",exitCode:127};return R([Z,"-c",$],Q)}var A$;var V$=P(()=>{o()});var V0={};b(V0,{runStatus:()=>U3});import{existsSync as v,readFileSync as H$,readdirSync as $0,statSync as Q0}from"fs";import{resolve as D,basename as z3}from"path";import{homedir as X3}from"os";function Z0($){let Q=Math.trunc($);if(Q>=1e6)return`${(Math.trunc(Q/1e6*10)/10).toFixed(1)}M`;if(Q>=1000)return`${(Math.trunc(Q/1000*10)/10).toFixed(1)}K`;return String(Q)}function z0($,Q,Z){if(Q===0)return null;let z=Math.trunc($*100/Q),X=Math.trunc($*C$/Q);if(X>C$)X=C$;let q=C$-X,K=S;if(z>=80)K=M;else if(z>=50)K=_;let W="=".repeat(Math.max(0,X))+" ".repeat(Math.max(0,q)),V=Z0($),H=Z0(Q);return`  ${k}${Z}${J} ${K}[${W}]${J} ${z}% (${V} / ${H})`}async function q3(){if(await u("jq"))return!0;return process.stdout.write(`${M}Error: jq is required but not installed.${J}
`),process.stdout.write(`Install with:
`),process.stdout.write(`  brew install jq    (macOS)
`),process.stdout.write(`  apt install jq     (Debian/Ubuntu)
`),process.stdout.write(`  yum install jq     (RHEL/CentOS)
`),!1}function b$($){if(!Number.isFinite($)||$<=0)return!1;try{return process.kill($,0),!0}catch{return!1}}function h$($){if(!v($))return null;try{let Q=H$($,"utf-8").trim();if(!Q)return null;let Z=Number.parseInt(Q,10);return Number.isFinite(Z)?Z:null}catch{return null}}function J3($){let Q=[],Z=h$(D($,"loki.pid"));if(Z!==null&&b$(Z))Q.push(`global:${Z}`);let z=D($,"sessions");if(v(z)){let X=[];try{X=$0(z)}catch{X=[]}for(let q of X){let K=D(z,q);try{if(!Q0(K).isDirectory())continue}catch{continue}let W=D(K,"loki.pid"),V=h$(W);if(V!==null&&b$(V))Q.push(`${q}:${V}`)}}if(v($)){let X=[];try{X=$0($)}catch{X=[]}for(let q of X){if(!q.startsWith("run-")||!q.endsWith(".pid"))continue;let K=D($,q);try{if(!Q0(K).isFile())continue}catch{continue}let W=z3(q,".pid").slice(4),V=h$(K);if(V!==null&&b$(V)){if(!Q.some((G)=>G.startsWith(`${W}:`)))Q.push(`${W}:${V}`)}}}return Q}async function X0($,Q){let Z=await R(["jq","-r",$,Q]);if(Z.exitCode!==0)return null;return Z.stdout.trim()}function K0($,Q){try{let Z=H$($,"utf-8"),X=JSON.parse(Z)[Q];if(typeof X==="number"){if(Q==="budget_used"){let q=Math.round(X*100)/100;if(Number.isInteger(q))return String(q);return String(q)}return String(X)}if(X===void 0||X===null)return"0";return String(X)}catch{return"0"}}function q0($,Q,Z){try{let z=H$($,"utf-8"),q=JSON.parse(z)[Q];if(typeof q==="number"&&Number.isFinite(q))return q;return Z}catch{return Z}}async function V3(){let $=j();if(!await q3())return 1;if(!v($))return process.stdout.write(`${k}Loki Mode Status${J}
`),process.stdout.write(`
`),process.stdout.write(`${_}No active session found.${J}
`),process.stdout.write(`Loki Mode has not been initialized in this directory.
`),process.stdout.write(`
`),process.stdout.write(`To start a session:
`),process.stdout.write(`  loki start <prd>              - Start with a PRD file
`),process.stdout.write(`  loki start                    - Start without a PRD
`),process.stdout.write(`
`),process.stdout.write(`${y}Current directory: ${process.cwd()}${J}
`),0;process.stdout.write(`${k}Loki Mode Status${J}
`),process.stdout.write(`
`);let Q="",Z=D($,"state","provider");if(v(Z))try{Q=H$(Z,"utf-8").trim()}catch{Q=""}let z=Q||process.env.LOKI_PROVIDER||"claude",X="full features";switch(z){case"codex":case"aider":X="degraded mode";break;case"cline":X="near-full mode";break;default:X="full features";break}process.stdout.write(`${L}Provider:${J} ${z} (${X})
`),process.stdout.write(`${y}  Switch with: loki provider set <claude|codex|cline|aider>${J}
`),process.stdout.write(`
`);let q=J3($);if(q.length>0){process.stdout.write(`${S}Active Sessions: ${q.length}${J}
`);for(let B of q){let T=B.indexOf(":"),A=T>=0?B.slice(0,T):B,I=T>=0?B.slice(T+1):"";if(A==="global")process.stdout.write(`  ${L}[global]${J} PID ${I}
`);else process.stdout.write(`  ${L}[#${A}]${J} PID ${I}
`)}process.stdout.write(`
`),process.stdout.write(`${y}  Stop specific: loki stop <session-id>${J}
`),process.stdout.write(`${y}  Stop all:      loki stop${J}
`),process.stdout.write(`
`)}if(v(D($,"PAUSE")))process.stdout.write(`${_}Status: PAUSED${J}
`),process.stdout.write(`${y}  Resume with: loki resume${J}
`),process.stdout.write(`
`);else if(v(D($,"STOP")))process.stdout.write(`${M}Status: STOPPED${J}
`),process.stdout.write(`${y}  Clear with: loki resume${J}
`),process.stdout.write(`
`);let K=D($,"STATUS.txt");if(v(K)){process.stdout.write(`${L}Session Info:${J}
`);try{process.stdout.write(H$(K,"utf-8"))}catch{}process.stdout.write(`
`)}let W=D($,"state","orchestrator.json");if(v(W)){process.stdout.write(`${L}Orchestrator State:${J}
`);let B=await X0('.currentPhase // "unknown"',W);process.stdout.write(`${B??"unknown"}
`)}let V=D($,"queue","pending.json");if(v(V)){let B=await X0('if type == "array" then length elif .tasks then .tasks | length else 0 end',V);process.stdout.write(`${L}Pending Tasks:${J} ${B??"0"}
`)}let H=D($,"metrics","budget.json");if(v(H)){let B=K0(H,"budget_limit"),T=K0(H,"budget_used");if(B!=="0"){process.stdout.write(`${L}Budget:${J} $${T} / $${B}
`);let A=Math.trunc((Number.parseFloat(T)||0)*100),I=Number.parseFloat(B),N=Number.isFinite(I)&&I!==0?Math.trunc(I*100):100,f=z0(A,N,"Budget");if(f!==null)process.stdout.write(`${f}
`)}else process.stdout.write(`${L}Cost:${J} $${T} (no limit)
`)}let G=D($,"state","context-usage.json");if(v(G)){let B=q0(G,"window_size",200000),T=q0(G,"used_tokens",0),A=z0(T,B,"Context");if(A!==null)process.stdout.write(`${A}
`)}let U=[D($,"dashboard","dashboard.pid"),D(X3(),".loki","dashboard","dashboard.pid")].find((B)=>v(B))??"";if(U&&v(U)){let B=h$(U);if(B!==null&&b$(B)){let T=D(U,".."),A=(g,w)=>{let x=D(T,g);try{return v(x)?H$(x,"utf-8").trim()||w:w}catch{return w}},I=A("scheme","http"),N=A("host","127.0.0.1"),f=A("port",process.env.LOKI_DASHBOARD_PORT||"57374");if(N==="0.0.0.0")N="127.0.0.1";process.stdout.write(`${L}Dashboard:${J} ${I}://${N}:${f}/
`)}}return await W3($),process.stdout.write(`
`),process.stdout.write(`${y}  Tip: loki analyze context show   - detailed token breakdown${J}
`),process.stdout.write(`${y}  Tip: loki analyze code overview  - codebase intelligence${J}
`),0}async function W3($){let Q=D($,"state"),Z=H3(Q),z=D(Q,"relevant-learnings.json"),X=D($,"escalations"),q=Z.length>0,K=v(z),W=v(X);if(!q&&!K&&!W)return;if(process.stdout.write(`
${L}Phase 1 artifacts:${J}
`),q){let V=Z[Z.length-1],H=J0(V);if(H&&Array.isArray(H.findings)){let G={Critical:0,High:0,Medium:0,Low:0};for(let U of H.findings){let B=String(U.severity??"");if(B in G)G[B]=(G[B]??0)+1}let Y=Object.entries(G).filter(([,U])=>U>0).map(([U,B])=>`${B} ${U.toLowerCase()}`).join(", ");process.stdout.write(`  Findings (iter ${H.iteration??"?"}): ${Y||"none"} -- ${H.findings.length} total
`)}}if(K){let V=J0(z);if(V&&Array.isArray(V.learnings)&&V.learnings.length>0){let H=new Map;for(let Y of V.learnings){let U=String(Y.trigger??"unknown");H.set(U,(H.get(U)??0)+1)}let G=[...H.entries()].sort((Y,U)=>U[1]-Y[1]).slice(0,3).map(([Y,U])=>`${U} ${Y}`).join(", ");process.stdout.write(`  Learnings: ${V.learnings.length} total (${G})
`)}}if(W){let V=0,H="";try{let Y=(await import("fs")).readdirSync(X).filter((U)=>U.endsWith(".md"));if(V=Y.length,Y.length>0)Y.sort(),H=Y[Y.length-1]??""}catch{}if(V>0)process.stdout.write(`  Escalations: ${V} handoff doc${V===1?"":"s"} (latest: ${H})
`)}}function H3($){if(!v($))return[];try{return J$("fs").readdirSync($).filter((z)=>/^findings-\d+\.json$/.test(z)).sort((z,X)=>{let q=Number.parseInt(z.replace(/[^0-9]/g,""),10)||0,K=Number.parseInt(X.replace(/[^0-9]/g,""),10)||0;return q-K}).map((z)=>D($,z))}catch{return[]}}function J0($){try{let Q=J$("fs");return JSON.parse(Q.readFileSync($,"utf-8"))}catch{return null}}async function G3(){let $=await Z$();if(!$)return process.stderr.write(`{"error": "Failed to generate JSON status. Ensure python3 is available."}
`),1;let Q=h,Z=j(),z=process.env.LOKI_DASHBOARD_PORT||"57374",X=process.env.LOKI_PROVIDER||"claude",q=await R([$,"-c",K3,Q,Z,z,X],{timeoutMs:30000});if(q.exitCode!==0)return process.stderr.write(`{"error": "Failed to generate JSON status. Ensure python3 is available."}
`),1;return process.stdout.write(q.stdout),0}async function U3($){let Q=[...$];while(Q.length>0){let Z=Q[0];if(Z==="--json")return G3();if(Z==="--help"||Z==="-h")return process.stdout.write(`Usage: loki status [--json]
`),0;return process.stdout.write(`${M}Unknown flag: ${Z}${J}
`),process.stdout.write(`Usage: loki status [--json]
`),1}return V3()}var C$=30,K3=`
import json, os, sys, time

skill_dir = sys.argv[1]
loki_dir = sys.argv[2]
dashboard_port = sys.argv[3]
env_provider = sys.argv[4]
result = {}

# Version
version_file = os.path.join(skill_dir, 'VERSION')
if os.path.isfile(version_file):
    with open(version_file) as f:
        result['version'] = f.read().strip()
else:
    result['version'] = 'unknown'

# Check if session exists
if not os.path.isdir(loki_dir):
    result['status'] = 'inactive'
    result['phase'] = None
    result['iteration'] = 0
    result['provider'] = env_provider if os.environ.get('LOKI_PROVIDER', '') else 'claude'
    result['provider_source'] = 'env' if os.environ.get('LOKI_PROVIDER', '') else 'default'
    result['dashboard_url'] = None
    result['pid'] = None
    result['elapsed_time'] = 0
    result['task_counts'] = {'total': 0, 'completed': 0, 'failed': 0, 'pending': 0}
    result['phase1'] = {
        'findings_iters': 0,
        'learnings_count': 0,
        'escalations_count': 0,
        'pause_signal': False,
        'gate_failure_counts': {},
    }
    print(json.dumps(result, indent=2))
    sys.exit(0)

# Status from signals and session.json
if os.path.isfile(os.path.join(loki_dir, 'PAUSE')):
    result['status'] = 'paused'
elif os.path.isfile(os.path.join(loki_dir, 'STOP')):
    result['status'] = 'stopped'
else:
    session_file = os.path.join(loki_dir, 'session.json')
    if os.path.isfile(session_file):
        try:
            with open(session_file) as f:
                session = json.load(f)
            result['status'] = session.get('status', 'unknown')
        except Exception:
            result['status'] = 'unknown'
    else:
        result['status'] = 'unknown'

# Phase and iteration from dashboard-state.json
ds_file = os.path.join(loki_dir, 'dashboard-state.json')
if os.path.isfile(ds_file):
    try:
        with open(ds_file) as f:
            ds = json.load(f)
        result['phase'] = ds.get('phase', ds.get('currentPhase'))
        result['iteration'] = ds.get('iteration', ds.get('currentIteration', 0))
    except Exception:
        result['phase'] = None
        result['iteration'] = 0
else:
    orch_file = os.path.join(loki_dir, 'state', 'orchestrator.json')
    if os.path.isfile(orch_file):
        try:
            with open(orch_file) as f:
                orch = json.load(f)
            result['phase'] = orch.get('currentPhase')
            result['iteration'] = orch.get('currentIteration', 0)
        except Exception:
            result['phase'] = None
            result['iteration'] = 0
    else:
        result['phase'] = None
        result['iteration'] = 0

# Provider + provider_source (v7.7.2 B-5 clarity, parity with bash)
# v7.7.12 (UT2-13 parity fix): read cli-provider marker FIRST so the bun
# route reports provider_source='cli' identically to bash route. Without
# this, --provider flag works for state but status --json silently
# downgrades the source field, breaking parity.
def _read_cli_provider_bun(loki_dir):
    cli_file = os.path.join(loki_dir, 'state', 'cli-provider')
    if not os.path.isfile(cli_file):
        return None
    try:
        content = open(cli_file).read().strip()
        parts = content.split(':')
        if len(parts) < 2:
            return None
        prov = parts[0]
        ts = int(parts[1])
        if prov not in ('claude', 'codex', 'cline', 'aider'):
            return None
        if time.time() - ts > 86400:
            return None
        if len(parts) >= 3:
            try:
                pid = int(parts[2])
                if pid > 0:
                    os.kill(pid, 0)
            except (ValueError, ProcessLookupError, PermissionError):
                return None
        return prov
    except Exception:
        return None

cli_prov = _read_cli_provider_bun(loki_dir)
provider_file = os.path.join(loki_dir, 'state', 'provider')
if os.path.isfile(provider_file):
    try:
        with open(provider_file) as f:
            saved = f.read().strip()
    except OSError:
        saved = ''
else:
    saved = ''
env_set = os.environ.get('LOKI_PROVIDER', '') != ''
if cli_prov:
    result['provider'] = cli_prov
    result['provider_source'] = 'cli'
elif saved:
    result['provider'] = saved
    result['provider_source'] = 'saved'
elif env_set:
    result['provider'] = env_provider
    result['provider_source'] = 'env'
else:
    result['provider'] = 'claude'
    result['provider_source'] = 'default'

# PID
pid_file = os.path.join(loki_dir, 'loki.pid')
if os.path.isfile(pid_file):
    try:
        with open(pid_file) as f:
            result['pid'] = int(f.read().strip())
    except (ValueError, Exception):
        result['pid'] = None
else:
    result['pid'] = None

# Elapsed time from session.json
session_file = os.path.join(loki_dir, 'session.json')
if os.path.isfile(session_file):
    try:
        with open(session_file) as f:
            session = json.load(f)
        start_time = session.get('start_time', session.get('startTime'))
        if start_time:
            if isinstance(start_time, (int, float)):
                result['elapsed_time'] = int(time.time() - start_time)
            else:
                from datetime import datetime
                dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                result['elapsed_time'] = int(time.time() - dt.timestamp())
        else:
            result['elapsed_time'] = 0
    except Exception:
        result['elapsed_time'] = 0
else:
    result['elapsed_time'] = 0

# Dashboard URL. Check BOTH the project-local in-build dashboard and the
# standalone dashboard (~/.loki/dashboard, where loki dashboard/serve now
# write) and honor saved scheme/host/port side-files, mirroring the bash
# route (autonomy/loki) so the two runtimes report identically.
_dash_candidates = [
    os.path.join(loki_dir, 'dashboard', 'dashboard.pid'),
    os.path.expanduser(os.path.join('~', '.loki', 'dashboard', 'dashboard.pid')),
]
dashboard_pid_file = next((p for p in _dash_candidates if os.path.isfile(p)), _dash_candidates[0])
dashboard_url = None
if os.path.isfile(dashboard_pid_file):
    try:
        with open(dashboard_pid_file) as f:
            dpid = int(f.read().strip())
        os.kill(dpid, 0)
        _dd = os.path.dirname(dashboard_pid_file)
        def _side(name, default):
            p = os.path.join(_dd, name)
            try:
                return open(p).read().strip() if os.path.isfile(p) else default
            except OSError:
                return default
        _scheme = _side('scheme', 'http')
        _host = _side('host', '127.0.0.1')
        _port = _side('port', str(dashboard_port))
        if _host == '0.0.0.0':
            _host = '127.0.0.1'
        dashboard_url = _scheme + '://' + _host + ':' + _port + '/'
    except (ProcessLookupError, PermissionError, ValueError, Exception):
        pass
result['dashboard_url'] = dashboard_url

# Task counts from queue files
task_counts = {'total': 0, 'completed': 0, 'failed': 0, 'pending': 0}
queue_dir = os.path.join(loki_dir, 'queue')
if os.path.isdir(queue_dir):
    for name, key in [('pending.json', 'pending'), ('completed.json', 'completed'), ('failed.json', 'failed')]:
        fpath = os.path.join(queue_dir, name)
        if os.path.isfile(fpath):
            try:
                with open(fpath) as f:
                    data = json.load(f)
                if isinstance(data, list):
                    task_counts[key] = len(data)
                elif isinstance(data, dict) and 'tasks' in data:
                    task_counts[key] = len(data['tasks'])
            except Exception:
                pass
    task_counts['total'] = task_counts['pending'] + task_counts['completed'] + task_counts['failed']
result['task_counts'] = task_counts

# v7.5.5 (#204): Phase 1 (RARV-C closure) artifact summary so dashboard /
# CI / operators can confirm the embedded-by-default flow is wired without
# tailing files. All counts are read-only and degrade silently to zero.
phase1 = {
    'findings_iters': 0,
    'learnings_count': 0,
    'escalations_count': 0,
    'pause_signal': False,
    'gate_failure_counts': {},
}
state_dir = os.path.join(loki_dir, 'state')
if os.path.isdir(state_dir):
    try:
        phase1['findings_iters'] = sum(
            1 for n in os.listdir(state_dir)
            if n.startswith('findings-') and n.endswith('.json')
        )
    except Exception:
        pass
    learnings_file = os.path.join(state_dir, 'relevant-learnings.json')
    if os.path.isfile(learnings_file):
        try:
            with open(learnings_file) as f:
                learnings = json.load(f)
            if isinstance(learnings, list):
                phase1['learnings_count'] = len(learnings)
            elif isinstance(learnings, dict):
                entries = learnings.get('entries')
                if isinstance(entries, list):
                    phase1['learnings_count'] = len(entries)
        except Exception:
            pass
escalations_dir = os.path.join(loki_dir, 'escalations')
if os.path.isdir(escalations_dir):
    try:
        phase1['escalations_count'] = sum(
            1 for n in os.listdir(escalations_dir) if n.endswith('.md')
        )
    except Exception:
        pass
phase1['pause_signal'] = os.path.isfile(os.path.join(loki_dir, 'PAUSE'))
gate_count_file = os.path.join(loki_dir, 'quality', 'gate-failure-count.json')
if os.path.isfile(gate_count_file):
    try:
        with open(gate_count_file) as f:
            gc = json.load(f)
        if isinstance(gc, dict):
            phase1['gate_failure_counts'] = {
                k: v for k, v in gc.items() if isinstance(v, (int, float))
            }
    except Exception:
        pass
result['phase1'] = phase1

print(json.dumps(result, indent=2))
`;var W0=P(()=>{o();V$();p();C()});var G0={};b(G0,{emitDeprecatedAlias:()=>K1,deprecatedAliasShouldSuppress:()=>H0});function H0($){let Q=$[0];if(Q!==void 0&&B3.has(Q))return!0;for(let Z of $)if(Y3.has(Z))return!0;return!1}function K1($,Q,Z){if(H0(Z))return;process.stderr.write(`note: 'loki ${$}' is now 'loki ${Q}'. The old form still works.
`)}var Y3,B3;var q1=P(()=>{Y3=new Set(["--json","-q","--quiet"]),B3=new Set(["json","csv","timeline"])});var M0={};b(M0,{runStats:()=>_3,computeStats:()=>B0});import{readdirSync as U0,readFileSync as M3,statSync as Y0}from"fs";import{join as i}from"path";function G$($){try{if(!Y0($).isFile())return null;return JSON.parse(M3($,"utf-8"))}catch{return null}}function W1($){try{return Y0($).isDirectory()}catch{return!1}}function T3($){if(!W1($))return[];try{let Q=U0($).filter((Z)=>Z.startsWith("iteration-")&&Z.endsWith(".json"));return Q.sort(),Q.map((Z)=>i($,Z))}catch{return[]}}function U$($){return Math.trunc($).toLocaleString("en-US")}function J1($){let Q=Math.trunc($);if(Q<60)return`${Q}s`;let Z=Math.trunc(Q/3600),z=Math.trunc(Q%3600/60),X=Q%60;if(Z>0)return`${Z}h ${String(z).padStart(2,"0")}m`;return`${z}m ${String(X).padStart(2,"0")}s`}function e($,Q=0){let Z=Math.pow(10,Q);return Math.round($*Z)/Z}function Y$($,Q){return $.toFixed(Q)}function V1($,Q){return $.length>=Q?$:$+" ".repeat(Q-$.length)}function O3($){let Q="N/A",Z=0,z=G$(i($,"state","orchestrator.json"));if(z&&typeof z==="object"){if(typeof z.currentPhase==="string")Q=z.currentPhase;if(typeof z.currentIteration==="number")Z=z.currentIteration}let X=i($,"metrics","efficiency"),q=T3(X),K=[];for(let F of q){let E=G$(F);if(E&&typeof E==="object")K.push(E)}if(K.length>0)Z=Math.max(Z,K.length);let W=K.reduce((F,E)=>F+(E.input_tokens??0),0),V=K.reduce((F,E)=>F+(E.output_tokens??0),0),H=W+V,G=K.reduce((F,E)=>F+(E.cost_usd??0),0),Y=K.reduce((F,E)=>F+(E.duration_seconds??0),0),U=0,B=0,T=G$(i($,"metrics","budget.json"));if(T&&typeof T==="object"){if(typeof T.budget_limit==="number")U=T.budget_limit;if(typeof T.budget_used==="number")B=T.budget_used}let A=0,I=0,N=G$(i($,"state","quality-gates.json"));if(N&&typeof N==="object"){if(Array.isArray(N)){for(let F of N)if(I+=1,F===!0)A+=1;else if(F&&typeof F==="object"){let E=F;if(E.passed===!0||E.status==="passed")A+=1}}else for(let F of Object.values(N))if(typeof F==="boolean"){if(I+=1,F)A+=1}else if(F&&typeof F==="object"){I+=1;let E=F;if(E.passed===!0||E.status==="passed")A+=1}}let f={},g=G$(i($,"quality","gate-failure-count.json"));if(g&&typeof g==="object"&&!Array.isArray(g)){let F={};for(let[E,l]of Object.entries(g))if(typeof l==="number")F[E]=l;f=F}let w=0,x=0,s=0,i$=i($,"quality");if(W1(i$)){let F=[];try{F=U0(i$)}catch{F=[]}for(let E of F){if(!E.endsWith(".json")||E==="gate-failure-count.json")continue;let l=G$(i(i$,E));if(!l||typeof l!=="object")continue;if(!(("verdict"in l)||("approved"in l)||("reviewers"in l)))continue;w+=1;let y1=(l.verdict??"").toString().toLowerCase();if(l.approved===!0||["approved","approve","pass"].includes(y1))x+=1;else if(["revision","revise","changes_requested","reject"].includes(y1))s+=1}}return{phase:Q,iterationCount:Z,iterations:K,totalInput:W,totalOutput:V,totalTokens:H,totalCost:G,totalDuration:Y,budgetLimit:U,budgetUsed:B,gatesPassed:A,gatesTotal:I,gateFailures:f,reviewsTotal:w,reviewsApproved:x,reviewsRevision:s}}function A3($,Q){let Z=$.iterationCount,z={session:{iterations:Z,duration_seconds:$.totalDuration,phase:$.phase},tokens:{input:$.totalInput,output:$.totalOutput,total:$.totalTokens,cost_usd:e($.totalCost,2)},quality:{gates_passed:$.gatesPassed,gates_total:$.gatesTotal,reviews_total:$.reviewsTotal,reviews_approved:$.reviewsApproved,reviews_revision:$.reviewsRevision,gate_failures:$.gateFailures},efficiency:{avg_tokens_per_iteration:Z>0?e($.totalTokens/Z,0):0,avg_cost_per_iteration:Z>0?e($.totalCost/Z,2):0,avg_duration_per_iteration:Z>0?e($.totalDuration/Z,1):0},budget:{used:e($.budgetUsed,2),limit:$.budgetLimit,percent:$.budgetLimit>0?e($.budgetUsed/$.budgetLimit*100,1):0}};if(Q)z.iterations=$.iterations.map((K,W)=>({number:W+1,input_tokens:K.input_tokens??0,output_tokens:K.output_tokens??0,cost_usd:e(K.cost_usd??0,2),duration_seconds:K.duration_seconds??0}));let X=JSON.stringify(z,null,2);function q(K,W){if(!W)return;let V=new RegExp(`("${K}": )(-?\\d+)(,?)$`,"m");X=X.replace(V,(H,G,Y,U)=>`${G}${Y}.0${U}`)}if(q("avg_duration_per_iteration",Z>0&&Number.isInteger(z.efficiency.avg_duration_per_iteration)),q("percent",$.budgetLimit>0&&Number.isInteger(z.budget.percent)),q("cost_usd",Z>0&&Number.isInteger(z.tokens.cost_usd)),Q)X=X.replace(/("cost_usd": )(-?\d+)(,?)$/gm,(K,W,V,H)=>`${W}${V}.0${H}`);return X}function w3($,Q){let Z=[];if(Z.push("Loki Mode Session Statistics"),Z.push("============================"),Z.push(""),Z.push("Session"),Z.push(`  Iterations completed: ${$.iterationCount}`),Z.push(`  Duration: ${J1($.totalDuration)}`),Z.push(`  Current phase: ${$.phase}`),Z.push(""),Z.push("Token Usage"),$.iterations.length>0)Z.push(`  Input tokens:  ${U$($.totalInput)}`),Z.push(`  Output tokens: ${U$($.totalOutput)}`),Z.push(`  Total tokens:  ${U$($.totalTokens)}`),Z.push(`  Estimated cost: $${Y$($.totalCost,2)}`);else Z.push("  N/A (no iteration metrics found)");if(Z.push(""),Z.push("Quality Gates"),$.gatesTotal>0){let z=Math.round($.gatesPassed/$.gatesTotal*100);Z.push(`  Gates passed: ${$.gatesPassed}/${$.gatesTotal} (${z}%)`)}else Z.push("  Gates passed: N/A");if($.reviewsTotal>0){let z=[];if($.reviewsApproved>0)z.push(`${$.reviewsApproved} approved`);if($.reviewsRevision>0)z.push(`${$.reviewsRevision} revision requested`);let X=z.length>0?z.join(", "):"N/A";Z.push(`  Code reviews: ${$.reviewsTotal} (${X})`)}if(Object.keys($.gateFailures).length>0){let z=Object.entries($.gateFailures).filter(([,X])=>X>0).map(([X,q])=>`${X} (${q})`);if(z.length>0)Z.push(`  Gate failures: ${z.join(", ")}`)}if(Z.push(""),Z.push("Efficiency"),$.iterationCount>0&&$.iterations.length>0){let z=Math.round($.totalTokens/$.iterationCount),X=$.totalCost/$.iterationCount,q=$.totalDuration/$.iterationCount;Z.push(`  Avg tokens/iteration: ${U$(z)}`),Z.push(`  Avg cost/iteration: $${Y$(X,2)}`),Z.push(`  Avg duration/iteration: ${J1(q)}`)}else Z.push("  N/A (no iteration metrics found)");if(Z.push(""),Z.push("Budget"),$.budgetLimit>0){let z=e($.budgetUsed/$.budgetLimit*100,1),X=Number.isInteger(z)?`${z}.0`:`${z}`;Z.push(`  Used: $${Y$($.budgetUsed,2)} / $${Y$($.budgetLimit,2)} (${X}%)`)}else if($.budgetUsed>0)Z.push(`  Used: $${Y$($.budgetUsed,2)} (no limit set)`);else Z.push("  N/A");if(Q&&$.iterations.length>0)Z.push(""),Z.push("Per-Iteration Breakdown"),$.iterations.forEach((z,X)=>{let q=X+1,K=V1(U$(z.input_tokens??0),10),W=V1(U$(z.output_tokens??0),10),V=z.cost_usd??0,H=J1(z.duration_seconds??0),G=V1(`${q}`,3);Z.push(`  #${G} input: ${K} output: ${W} cost: $${Y$(V,2)}  time: ${H}`)});return Z.join(`
`)}function B0($){let Q=!1,Z=!1;for(let K of $)if(K==="--json")Q=!0;else if(K==="--efficiency")Z=!0;let z=j();if(!W1(z)){if(Q)return{exitCode:0,stdout:'{"error": "No active session"}'};return{exitCode:0,stdout:`${_}No active session found.${J}
Start a session with: loki start <prd>`}}let X=O3(z);return{exitCode:0,stdout:Q?A3(X,Z):w3(X,Z)}}async function _3($){let{emitDeprecatedAlias:Q}=await Promise.resolve().then(() => (q1(),G0));Q("stats","report session",$);let Z=B0($);return console.log(Z.stdout),Z.exitCode}var T0=P(()=>{C();p()});var F0={};b(F0,{runDoctor:()=>y3,pythonImportOk:()=>B1,httpReachable:()=>G1,checkTool:()=>I0,checkSkills:()=>L0,checkDisk:()=>Y1,buildDoctorJson:()=>j0,_setPythonImportOkForTest:()=>k3});import{existsSync as O0,lstatSync as I3,readFileSync as L3,readlinkSync as P3,statfsSync as j3}from"fs";import{spawnSync as A0}from"child_process";import{homedir as U1}from"os";import{resolve as H1}from"path";function R3($){let Q=$.match(F3);return Q?Q[1]:null}async function w0($){try{let Q=await R([$,"--version"],{timeoutMs:5000}),Z=(Q.stdout||Q.stderr||"").trim();return R3(Z)}catch{return null}}function _0($,Q){let Z=$.split(".").map((X)=>parseInt(X,10)),z=Q.split(".").map((X)=>parseInt(X,10));while(Z.length<2)Z.push(0);while(z.length<2)z.push(0);for(let X=0;X<2;X++){let q=Z[X]??0,K=z[X]??0;if(Number.isNaN(q)||Number.isNaN(K))return 0;if(q!==K)return q-K}return 0}async function I0($,Q,Z,z=null){let X=await u(Q),q=X!==null,K=q?await w0(Q):null,W="pass";if(!q)W=Z==="required"?"fail":"warn";else if(z&&K){if(_0(K,z)<0)W=Z==="required"?"fail":"warn"}return{name:$,command:Q,found:q,version:K,required:Z,min_version:z,status:W,path:X}}function Y1(){let $=null;try{let Z=j3(U1()),z=Number(Z.bavail)*Number(Z.bsize);$=Math.round(z/1073741824*10)/10}catch{$=null}let Q="pass";if($!==null){if($<1)Q="fail";else if($<5)Q="warn"}return{available_gb:$,status:Q}}async function G1($,Q=2000){try{return(await fetch($,{signal:AbortSignal.timeout(Q)})).ok}catch{return!1}}async function B1($,Q=!1){let Z=`import ${$}`,z=Q?30000:5000;if(!Q)return(await z$(Z,{timeoutMs:z})).exitCode===0;let X=await Z$();if(!X)return!1;return(await R([X,"-c",Z],{timeoutMs:z})).exitCode===0}function k3($){m$.fn=$??B1}function L0(){let $=U1();return x3.map(({name:Q,dir:Z})=>{let z=H1($,Z),X=z,q=H1(z,"SKILL.md");if(O0(q))return{name:Q,path:X,status:"pass",detail:""};try{if(I3(z).isSymbolicLink()){let W="unknown";try{W=P3(z)}catch{}return{name:Q,path:X,status:"fail",detail:`(broken symlink -> ${W})`}}}catch{}return{name:Q,path:X,status:"warn",detail:"(not found - run 'loki setup-skill')"}})}async function P0(){return Promise.all(E3.map(async($)=>{return{...await I0($.jsonName,$.cmd,$.required,$.min??null),displayName:$.displayName}}))}async function N3(){let Q=await u("sentrux")!==null,Z=Q?await w0("sentrux"):null;return{found:Q,version:Z,status:Q?"pass":"warn",required:"optional"}}async function S3(){let{openSync:$,statSync:Q,readSync:Z,closeSync:z,existsSync:X}=await import("fs"),{join:q}=await import("path"),K=65536,W=process.env.LOKI_DIR??".loki",V=q(W,"memory",".errors.log"),H=[],G=!1;try{if(X(V)){G=!0;let Y=Q(V).size,U=Math.max(0,Y-65536),B=Y-U,T=Buffer.alloc(B),A=$(V,"r");try{Z(A,T,0,B,U)}finally{z(A)}let N=T.toString("utf-8").split(`
`);if(U>0&&N.length>0)N=N.slice(1);N=N.map((f)=>f.trim()).filter((f)=>f.length>0),H=N.slice(-5)}}catch{H=[]}return{errors_log_path:G?V:null,recent_errors:H,recent_error_count:H.length,status:H.length===0?"pass":"warn"}}async function j0(){let Q=(await P0()).map(({displayName:V,...H})=>H),Z=Y1(),z=await N3(),X=await S3(),q=0,K=0,W=0;for(let V of Q)if(V.status==="pass")q++;else if(V.status==="fail")K++;else W++;if(Z.status==="pass")q++;else if(Z.status==="fail")K++;else W++;return{loki_mode_version:S$(),checks:Q,disk:Z,sentrux:z,memory:X,summary:{passed:q,failed:K,warnings:W,ok:K===0}}}function D3(){try{let $=process.env.CLAUDE_CONFIG_DIR||`${U1()}/.claude`,Q=L3(`${$}/.credentials.json`,"utf8");if(!Q)return!1;let Z=JSON.parse(Q)?.claudeAiOauth?.expiresAt;return typeof Z==="number"&&Z>0&&Z/1000<=Date.now()/1000+60}catch{return!1}}function C3(){try{let Q=(A0("claude",["auth","status"],{encoding:"utf8",timeout:5000}).stdout||"").trim();if(!Q)return"";let Z=JSON.parse(Q);if(Z?.loggedIn===!0)return"yes";if(Z?.loggedIn===!1)return"no";return""}catch{return""}}function O($){switch($){case"pass":return`${S}PASS${J}`;case"fail":return`${M}FAIL${J}`;case"warn":return`${_}WARN${J}`}}function y$($){let Q=$.version?` (v${$.version})`:"",Z=$.displayName;if(!$.found){let z=$.required==="required"?"not found":$.required==="recommended"?"not found (recommended)":"not found (optional)";return`  ${O($.status)}  ${Z} - ${z}`}if($.min_version&&$.version&&_0($.version,$.min_version)<0){let z=$.required==="required"?"requires":"recommended";return`  ${O($.status)}  ${Z}${Q} - ${z} >= ${$.min_version}`}return`  ${O($.status)}  ${Z}${Q}`}function v$($,Q){if(Q==="pass")$.pass++;else if(Q==="fail")$.fail++;else $.warn++}function b3(){process.stdout.write(`${k}loki doctor${J} - Check system prerequisites

`),process.stdout.write(`Usage: loki doctor [--json]

`),process.stdout.write(`Options:
`),process.stdout.write(`  --json    Output machine-readable JSON

`),process.stdout.write(`Checks: node, python3, jq, git, curl, bash version,
`),process.stdout.write(`        claude/codex CLIs, and disk space.
`)}async function h3(){process.stdout.write(`${k}Loki Mode Doctor${J}

`),process.stdout.write(`Checking system prerequisites...

`);let $={pass:0,fail:0,warn:0},Q=await P0(),Z=new Map(Q.map((w)=>[w.command,w]));process.stdout.write(`${L}Required:${J}
`);for(let w of["node","python3","jq","git","curl"]){let x=Z.get(w);process.stdout.write(y$(x)+`
`),v$($,x.status)}process.stdout.write(`
`),process.stdout.write(`${L}AI Providers:${J}
`);let z=["claude","codex","cline","aider"],X={claude:"npm install -g @anthropic-ai/claude-code",codex:"npm install -g @openai/codex",cline:"npm install -g cline",aider:"pip install aider-chat"},q=!1;for(let w of z){let x=Z.get(w);if(process.stdout.write(y$(x)+`
`),!x.found&&X[w])process.stderr.write(`         ${_}Install: ${X[w]}${J}
`);if(v$($,x.status),x.found)q=!0}if(!q){if(process.stdout.write(`  ${O("fail")}  No AI provider CLI installed -- at least one is required
`),process.stdout.write(`         ${_}Install: npm install -g @anthropic-ai/claude-code${J}
`),$.fail++,process.stdout.isTTY){let w=H1(h,"autonomy/provider-offer.sh");if(O0(w))A0("bash",[w,"report"],{stdio:"inherit"})}}process.stdout.write(`
`),process.stdout.write(`${L}API Keys:${J}
`);let K=Z.get("claude")?.found??!1,W=Z.get("codex")?.found??!1,V=process.env;if(V.ANTHROPIC_API_KEY)process.stdout.write(`  ${O("pass")}  ANTHROPIC_API_KEY is set
`),$.pass++;else if(K){let w=C3();if(w==="yes")process.stdout.write(`  ${O("pass")}  Claude CLI is logged in (subscription/OAuth login)
`),$.pass++;else if(w==="no")process.stdout.write(`  ${O("warn")}  Claude CLI is NOT logged in -- run 'claude login' before a build (it would otherwise stall)
`),$.warn++;else if(D3())process.stdout.write(`  ${O("warn")}  Claude login has EXPIRED -- run 'claude login' before a build (it would otherwise stall)
`),$.warn++;else process.stdout.write(`  ${y}  --  ${J}  ANTHROPIC_API_KEY not set (Claude CLI uses its own login)
`)}if(V.OPENAI_API_KEY)process.stdout.write(`  ${O("pass")}  OPENAI_API_KEY is set
`),$.pass++;else if(W)process.stdout.write(`  ${y}  --  ${J}  OPENAI_API_KEY not set (Codex CLI uses its own login)
`);if(V.ANTHROPIC_BASE_URL){let w=V.ANTHROPIC_BASE_URL;if(process.stdout.write(`  ${O("pass")}  ANTHROPIC_BASE_URL: ${w}
`),$.pass++,!V.LOKI_MODEL_OVERRIDE)process.stdout.write(`  ${O("warn")}  LOKI_MODEL_OVERRIDE not set -- opus/sonnet/haiku aliases may not resolve on alt-provider
`),$.warn++;else process.stdout.write(`  ${O("pass")}  LOKI_MODEL_OVERRIDE: ${V.LOKI_MODEL_OVERRIDE}
`),$.pass++}process.stdout.write(`
`),process.stdout.write(`${L}Skills:${J}
`);for(let w of L0())if(w.status==="pass")process.stdout.write(`  ${O("pass")}  ${w.name}  ${y}${w.path}${J}
`),$.pass++;else if(w.status==="fail")process.stdout.write(`  ${O("fail")}  ${w.name}  ${y}${w.detail}${J}
`),process.stdout.write(`         ${_}Fix: loki setup-skill${J}
`),$.fail++;else process.stdout.write(`  ${O("warn")}  ${w.name}  ${y}${w.detail}${J}
`),$.warn++;process.stdout.write(`
`),process.stdout.write(`${L}Integrations:${J}
`);let[H,G,Y]=await Promise.all([m$.fn("mcp"),m$.fn("numpy",!0),m$.fn("sentence_transformers",!0)]);if(H)process.stdout.write(`  ${O("pass")}  MCP SDK (Python)
`),$.pass++;else process.stdout.write(`  ${O("warn")}  MCP SDK - not installed (pip3 install mcp)
`),$.warn++;if(G)process.stdout.write(`  ${O("pass")}  numpy (vector search)
`),$.pass++;else process.stdout.write(`  ${O("warn")}  numpy - not installed (pip3 install numpy)
`),$.warn++;if(Y)process.stdout.write(`  ${O("pass")}  sentence-transformers (embeddings)
`),$.pass++;else process.stdout.write(`  ${O("warn")}  sentence-transformers - not installed (loki memory vectors setup)
`),$.warn++;if(await G1("http://localhost:8100/api/v2/heartbeat"))process.stdout.write(`  ${O("pass")}  ChromaDB server (port 8100)
`),$.pass++;else process.stdout.write(`  ${O("warn")}  ChromaDB - not running (docker start loki-chroma)
`),$.warn++;{let w=["pyright-langserver","pylsp","typescript-language-server","gopls","rust-analyzer","jdtls"],x=[];for(let s of w)if(await u(s))x.push(s);if(x.length>0)process.stdout.write(`  ${O("pass")}  LSP servers detected (${x.length}): ${x.join(", ")}
`),$.pass++;else process.stdout.write(`  ${O("warn")}  LSP servers - none on PATH (install for symbol grounding: npm i -g pyright typescript-language-server; brew install gopls)
`),$.warn++}let U=process.env.LOKI_MIROFISH_URL;if(U)if(await G1(`${U}/health`))process.stdout.write(`  ${O("pass")}  MiroFish server (${U})
`),$.pass++;else process.stdout.write(`  ${O("warn")}  MiroFish - not running (loki start --mirofish-docker <image>)
`),$.warn++;if(process.env.LOKI_OTEL_ENDPOINT)process.stdout.write(`  ${O("pass")}  OTEL endpoint: ${process.env.LOKI_OTEL_ENDPOINT}
`),$.pass++;else process.stdout.write(`  ${O("warn")}  OTEL - not configured (set LOKI_OTEL_ENDPOINT)
`),$.warn++;if(await u("sentrux")){let w="unknown";try{let s=(await R(["sentrux","--version"],{timeoutMs:2000})).stdout.split(/\s+/).filter(Boolean).pop();if(s)w=s.replace(/^v/,"")}catch{}process.stdout.write(`  ${O("pass")}  sentrux ${w} (architectural drift gate: loki sentrux help)
`),$.pass++}else process.stdout.write(`  ${O("warn")}  sentrux - not installed (optional, brew install sentrux/tap/sentrux)
`),$.warn++;process.stdout.write(`
`),process.stdout.write(`${L}System:${J}
`);let B=Z.get("bash");process.stdout.write(y$(B)+`
`),v$($,B.status);let T=Z.get("bun");if(T)process.stdout.write(y$(T)+`
`),v$($,T.status);let A=Y1(),I=A.available_gb===null?null:Math.floor(A.available_gb);if(I===null)process.stdout.write(`  ${O("warn")}  Disk space: unable to determine
`),$.warn++;else if(A.status==="fail")process.stdout.write(`  ${O("fail")}  Disk space: ${I}GB available (need >= 1GB)
`),$.fail++;else if(A.status==="warn")process.stdout.write(`  ${O("warn")}  Disk space: ${I}GB available (low)
`),$.warn++;else process.stdout.write(`  ${O("pass")}  Disk space: ${I}GB available
`),$.pass++;process.stdout.write(`
`),process.stdout.write(`${L}Runtime route:${J}
`);let N=process.versions.bun!==void 0,f=process.argv[0]??"(unknown)";if(process.stdout.write(`  ${O("pass")}  Active runtime: ${N?"Bun":"Node"} (${f})
`),process.env.LOKI_LEGACY_BASH==="1"||process.env.LOKI_LEGACY_BASH==="true")process.stdout.write(`  ${O("warn")}  LOKI_LEGACY_BASH set: shim routes every command to autonomy/loki (bash)
`);if(process.env.LOKI_TS_ENTRY)process.stdout.write(`  ${O("pass")}  LOKI_TS_ENTRY override: ${process.env.LOKI_TS_ENTRY}
`);if(process.env.BUN_FROM_SOURCE==="1"||process.env.BUN_FROM_SOURCE==="true")process.stdout.write(`  ${O("pass")}  BUN_FROM_SOURCE set: shim prefers loki-ts/src/ over dist/
`);let g=await Z$();if(g!==null){let x=(await R([g,"-c","import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"],{timeoutMs:5000})).stdout.trim();if(x.startsWith("3.12"))process.stdout.write(`  ${O("pass")}  Python 3.12 (chromadb / sentence-transformers): ${x} at ${g}
`);else if(x)process.stdout.write(`  ${O("warn")}  Python 3.12 recommended for memory vector search (chromadb / sentence-transformers); found ${x} at ${g}. Core memory and the rest of Loki work without it. Install: brew install python@3.12 (macOS) or apt install python3.12 (Debian/Ubuntu).
`);else process.stdout.write(`  ${O("warn")}  Python 3 found at ${g} but version probe failed; memory vector search (chromadb / sentence-transformers) may not work. The rest of Loki is unaffected.
`)}else process.stdout.write(`  ${O("warn")}  Python 3 not on PATH -- memory + MCP integrations disabled. The rest of Loki works without them.
`);if(process.stdout.write(`
`),process.stdout.write(`${k}Summary:${J} ${S}${$.pass} passed${J}, ${M}${$.fail} failed${J}, ${_}${$.warn} warnings${J}

`),$.fail>0)return process.stdout.write(`${M}Some required prerequisites are missing.${J}
`),process.stdout.write(`Install missing dependencies and run 'loki doctor' again.
`),1;if($.warn>0)process.stdout.write(`${_}All required checks passed with some warnings.${J}
`);else process.stdout.write(`${S}All checks passed. System is ready for Loki Mode.${J}
`);return process.stdout.write(`
`),process.stdout.write(`Next: loki quickstart (guided first build from your idea, no PRD needed)
`),process.stdout.write(`      or loki demo (builds a sample todo app end to end) or loki start ./prd.md
`),0}async function y3($){let Q=!1;for(let Z of $)if(Z==="--json")Q=!0;else if(Z==="--help"||Z==="-h")return b3(),0;else return process.stderr.write(`${M}Unknown option: ${Z}${J}
`),process.stderr.write(`Usage: loki doctor [--json]
`),1;if(Q){let Z=await j0();return process.stdout.write(JSON.stringify(Z,null,2)+`
`),0}return h3()}var F3,m$,x3,E3;var R0=P(()=>{C();o();V$();p();Q1();F3=/(\d+\.\d+(?:\.\d+)*)/;m$={fn:B1};x3=[{name:"Claude Code",dir:".claude/skills/loki-mode"},{name:"Codex CLI",dir:".codex/skills/loki-mode"},{name:"Cline CLI",dir:".cline/skills/loki-mode"},{name:"Aider CLI",dir:".aider/skills/loki-mode"}];E3=[{displayName:"Node.js (>= 18)",jsonName:"Node.js",cmd:"node",required:"required",min:"18.0"},{displayName:"Python 3 (>= 3.8)",jsonName:"Python 3",cmd:"python3",required:"required",min:"3.8"},{displayName:"jq",jsonName:"jq",cmd:"jq",required:"required"},{displayName:"git",jsonName:"git",cmd:"git",required:"required"},{displayName:"curl",jsonName:"curl",cmd:"curl",required:"required"},{displayName:"bash (>= 4.0)",jsonName:"bash",cmd:"bash",required:"recommended",min:"4.0"},{displayName:"Bun (>= 1.3)",jsonName:"Bun",cmd:"bun",required:"recommended",min:"1.3"},{displayName:"Claude CLI",jsonName:"Claude CLI",cmd:"claude",required:"optional"},{displayName:"Codex CLI",jsonName:"Codex CLI",cmd:"codex",required:"optional"},{displayName:"Cline CLI",jsonName:"Cline CLI",cmd:"cline",required:"optional"},{displayName:"Aider CLI",jsonName:"Aider CLI",cmd:"aider",required:"optional"}]});import{existsSync as E0,mkdirSync as p9,readdirSync as v3,readFileSync as N0,renameSync as l9,writeFileSync as d9}from"fs";import{dirname as m3,join as g3,resolve as f3}from"path";import{fileURLToPath as u3}from"url";function c3(){try{let $=m3(u3(import.meta.url)),Q=f3($,"..","..","data","model-pricing.json");if(!E0(Q))return _$;let z=JSON.parse(N0(Q,"utf8")).pricing;if(!z||typeof z!=="object")return _$;let X={};for(let[q,K]of Object.entries(z))if(K!==null&&typeof K==="object"&&typeof K.input==="number"&&typeof K.output==="number")X[q]={input:K.input,output:K.output};for(let q of Object.keys(_$))if(!(q in X))return _$;return X}catch{return _$}}function p3($){return Math.round(($+Number.EPSILON)*1e4)/1e4}function l3($){let Q=($??x0).toLowerCase();return k0[Q]??k0[x0]}function S0($){let Q=0;for(let Z of $){if(typeof Z.cost_usd==="number"&&Number.isFinite(Z.cost_usd)){Q+=Z.cost_usd;continue}let z=l3(Z.model),X=typeof Z.input_tokens==="number"?Z.input_tokens:0,q=typeof Z.output_tokens==="number"?Z.output_tokens:0;Q+=X/1e6*z.input+q/1e6*z.output}return p3(Q)}function D0($){if(!E0($))return[];let Q=[],Z;try{Z=v3($)}catch{return[]}for(let z of Z){if(!z.endsWith(".json"))continue;let X=g3($,z);try{let q=N0(X,"utf8"),K=JSON.parse(q);if(K&&typeof K==="object")Q.push(K)}catch{}}return Q}var _$,k0,x0="sonnet";var C0=P(()=>{C();_$={fable:{input:10,output:50},opus:{input:5,output:25},sonnet:{input:3,output:15},haiku:{input:1,output:5},"gpt-5.3-codex":{input:1.5,output:12}};k0=Object.freeze(c3())});import{existsSync as g$,readdirSync as d3,readFileSync as o3,statSync as n3}from"fs";import{join as f$}from"path";function a3($){let Q=[],Z=f$($,"votes");if(!g$(Z))return Q;let z;try{z=d3(Z)}catch{return Q}for(let X of z){if(!X.startsWith("round-")||!X.endsWith(".json"))continue;try{let q=f$(Z,X);if(!n3(q).isFile())continue;let K=JSON.parse(o3(q,"utf8"));Q.push({iteration:typeof K.iteration==="number"?K.iteration:void 0,verdict:typeof K.verdict==="string"?K.verdict:void 0,complete_votes:typeof K.complete_votes==="number"?K.complete_votes:void 0,total_members:typeof K.total_members==="number"?K.total_members:void 0,threshold:typeof K.threshold==="number"?K.threshold:void 0})}catch{}}return Q}function s3(){return{iteration_count:0,total_cost_usd:0,avg_cost_per_iteration:null,total_input_tokens:0,total_output_tokens:0,total_duration_ms:0,avg_duration_ms_per_iteration:null,model_breakdown:{},phase_breakdown:{},status_breakdown:{}}}function t3(){return{council_rounds:0,unanimous_rate:null,approval_rate:null,iteration_success_rate:null}}function r3($){let Q=s3();if($.length===0)return Q;Q.iteration_count=$.length,Q.total_cost_usd=Math.round(S0($)*1e4)/1e4;for(let Z of $){if(typeof Z.input_tokens==="number")Q.total_input_tokens+=Z.input_tokens;if(typeof Z.output_tokens==="number")Q.total_output_tokens+=Z.output_tokens;let z=Z;if(typeof z.duration_ms==="number")Q.total_duration_ms+=z.duration_ms;if(typeof Z.model==="string")Q.model_breakdown[Z.model]=(Q.model_breakdown[Z.model]??0)+1;if(typeof z.phase==="string")Q.phase_breakdown[z.phase]=(Q.phase_breakdown[z.phase]??0)+1;if(typeof z.status==="string")Q.status_breakdown[z.status]=(Q.status_breakdown[z.status]??0)+1}return Q.avg_cost_per_iteration=Math.round(Q.total_cost_usd/Q.iteration_count*1e4)/1e4,Q.avg_duration_ms_per_iteration=Math.round(Q.total_duration_ms/Q.iteration_count),Q}function i3($,Q,Z){let z=t3();if(z.council_rounds=$.length,$.length>0){let X=0,q=0;for(let K of $){if(typeof K.complete_votes==="number"&&typeof K.total_members==="number"&&K.total_members>0&&K.complete_votes===K.total_members)X+=1;if(K.verdict==="COMPLETE")q+=1}z.unanimous_rate=Math.round(X/$.length*1e4)/1e4,z.approval_rate=Math.round(q/$.length*1e4)/1e4}if(Z>0)z.iteration_success_rate=Math.round(Q/Z*1e4)/1e4;return z}function b0($){let Q=[],Z=f$($,"metrics","efficiency"),z=f$($,"council"),X=g$(Z)?D0(Z):[];if(!g$(Z))Q.push("no .loki/metrics/efficiency/ dir (efficiency KPIs zeroed)");else if(X.length===0)Q.push(".loki/metrics/efficiency/ exists but no iteration files found");let q=a3(z);if(!g$(z))Q.push("no .loki/council/ dir (accuracy KPIs zeroed)");else if(q.length===0)Q.push(".loki/council/ exists but no round-N.json files found");let K=r3(X),W=K.status_breakdown.success??0,V=i3(q,W,K.iteration_count);return{schema_version:1,generated_at:new Date().toISOString(),loki_dir:$,efficiency:K,accuracy:V,notes:Q}}function h0($){return JSON.stringify($,null,2)}function y0($){let Q=[];Q.push(`Loki Mode KPIs  (snapshot at ${$.generated_at})`),Q.push(`Source: ${$.loki_dir}`),Q.push(""),Q.push("Efficiency"),Q.push(`  Iterations:           ${$.efficiency.iteration_count}`),Q.push(`  Total cost USD:       ${$.efficiency.total_cost_usd}`),Q.push(`  Avg cost per iter:    ${$.efficiency.avg_cost_per_iteration??"n/a"}`),Q.push(`  Total input tokens:   ${$.efficiency.total_input_tokens}`),Q.push(`  Total output tokens:  ${$.efficiency.total_output_tokens}`),Q.push(`  Total duration (ms):  ${$.efficiency.total_duration_ms}`),Q.push(`  Avg duration / iter:  ${$.efficiency.avg_duration_ms_per_iteration??"n/a"}`);let Z=Object.entries($.efficiency.model_breakdown).sort((q,K)=>q[0].localeCompare(K[0]));if(Z.length>0)Q.push(`  Model breakdown:      ${Z.map(([q,K])=>`${q}=${K}`).join(", ")}`);let z=Object.entries($.efficiency.phase_breakdown).sort((q,K)=>q[0].localeCompare(K[0]));if(z.length>0)Q.push(`  Phase breakdown:      ${z.map(([q,K])=>`${q}=${K}`).join(", ")}`);let X=Object.entries($.efficiency.status_breakdown).sort((q,K)=>q[0].localeCompare(K[0]));if(X.length>0)Q.push(`  Status breakdown:     ${X.map(([q,K])=>`${q}=${K}`).join(", ")}`);if(Q.push(""),Q.push("Accuracy"),Q.push(`  Council rounds:       ${$.accuracy.council_rounds}`),Q.push(`  Unanimous rate:       ${$.accuracy.unanimous_rate??"n/a"}`),Q.push(`  Approval rate:        ${$.accuracy.approval_rate??"n/a"}`),Q.push(`  Iter success rate:    ${$.accuracy.iteration_success_rate??"n/a"}`),$.notes.length>0){Q.push(""),Q.push("Notes");for(let q of $.notes)Q.push(`  - ${q}`)}return Q.push(""),Q.push("See also: loki trust  (trust trajectory across runs)"),Q.join(`
`)}var v0=P(()=>{C0()});var M1={};b(M1,{runKpis:()=>$6});function $6($,Q={}){if(Q.aliasOf)K1(Q.aliasOf,"report kpis",$);let Z=!1;for(let X of $){if(X==="--help"||X==="-h"||X==="help")return process.stdout.write(e3),0;if(X==="--json"){Z=!0;continue}if(X==="-q"||X==="--quiet")continue;return process.stderr.write(`loki kpis: unknown arg: ${X}
Run 'loki kpis --help' for usage.
`),1}let z=b0(j());return process.stdout.write(Z?h0(z)+`
`:y0(z)+`
`),0}var e3=`loki report kpis -- accuracy + efficiency KPI snapshot (v7.5.28 MVP)

Usage:
  loki report kpis        Pretty-print KPI snapshot
  loki report kpis --json Emit KPIs as JSON
  loki report kpis --help Show this help
  (the old top-level 'loki kpis' still works; it prints a one-line pointer)

Reads from .loki/metrics/efficiency/iteration-*.json and
.loki/council/votes/round-*.json. Missing files yield zero/null KPIs
with explicit notes (not silent failure).

Efficiency KPIs: iteration count, total cost USD, avg cost per iter,
total input/output tokens, model/phase/status breakdowns, durations.

Accuracy KPIs: council rounds, unanimous rate, approval rate,
iteration success rate.

This is the Phase K MVP -- read-only derivation. Per-iteration
emission, dashboard panel, and the loki-bench harness are deferred
follow-ups (see project_v7_5_18_arc_status.md).
`;var T1=P(()=>{v0();C();q1()});var m0={};b(m0,{delegateToBash:()=>z6});import{resolve as Q6}from"path";async function z6($){let Q=Q6(h,"autonomy","loki"),Z=Bun.spawn({cmd:[Q,...$],stdin:"inherit",stdout:"inherit",stderr:"inherit",env:{...process.env,LOKI_LEGACY_BASH:"1"}}),z=setTimeout(()=>{try{Z.kill("SIGKILL")}catch{}},Z6);try{return await Z.exited}finally{clearTimeout(z)}}var Z6=3600000;var g0=P(()=>{C()});import{existsSync as X6,mkdirSync as K6,readdirSync as q6,readFileSync as J6,statSync as V6,writeFileSync as W6}from"fs";import{join as I$}from"path";function O1($){return $&&typeof $==="object"?$:{}}function X$($){return Math.round($*1e4)/1e4}function B6($){let Q=String($??"").trim().toUpperCase();if(!Q)return null;for(let Z of u0)if(Q.startsWith(Z))return!0;return!1}function M6($){let Q=B6($.final_verdict);if(Q!==null)return Q?1:0;let Z=$.reviewers;if(Array.isArray(Z)&&Z.length>0){let z=0,X=0;for(let q of Z){if(!q||typeof q!=="object")continue;X+=1;let K=String(q.vote??"").trim().toUpperCase();if(u0.some((W)=>K.startsWith(W)))z+=1}if(X>0)return z===X?1:0}return null}function T6($){let Q=Number($.total),Z=Number($.passed);if(!Number.isFinite(Q)||!Number.isFinite(Z))return null;if(Q<=0)return null;return Math.max(0,Math.min(1,Z/Q))}function O6($){let Q;if($&&typeof $==="object")Q=$.count;else Q=$;let Z=Number(Q);if(!Number.isFinite(Z)||Z<0)return null;return Z}function A6($){let Q=O1($.council);for(let Z of[Q.interventions,$.interventions]){let z=Number(Z);if(Number.isFinite(z)&&z>=0)return z}return null}function w6($){let Q=I$($,"proofs"),Z=[];if(!X6(Q))return Z;let z;try{z=q6(Q).sort()}catch{return Z}for(let X of z){let q=I$(Q,X);try{if(!V6(q).isDirectory())continue}catch{continue}let K=null;try{K=JSON.parse(J6(I$(q,"proof.json"),"utf8"))}catch{continue}if(!K||typeof K!=="object")continue;Z.push({run_id:String(K.run_id??X),generated_at:typeof K.generated_at==="string"?K.generated_at:null,council_pass_rate:M6(O1(K.council)),gate_pass_rate:T6(O1(K.quality_gates)),iterations:O6(K.iterations),interventions:A6(K)})}return Z.sort((X,q)=>{let K=X.generated_at===null?1:0,W=q.generated_at===null?1:0;if(K!==W)return K-W;return(X.generated_at??"").localeCompare(q.generated_at??"")}),Z}function f0($){return $.reduce((Q,Z)=>Q+Z,0)/$.length}function _6($,Q){let Z=G6[$],z=U6[$],X=Y6[$],q=Q.filter((A)=>A!==null),K=q.length;if(K===0)return{axis:$,label:X,available:!1,higher_is_better:Z,note:"no runs recorded this metric"};if(K<2)return{axis:$,label:X,available:!0,higher_is_better:Z,data_points:K,latest:X$(q[K-1]),direction:"flat",improving:null,delta:0,earlier_mean:X$(q[0]),later_mean:X$(q[K-1]),insufficient:!0,note:"not enough history yet (need 2+ runs with this metric)"};let W=Math.floor(K/2),V=q.slice(0,W),H=q.slice(K-W),G=f0(V),Y=f0(H),U=Y-G,B;if(Math.abs(U)<=z)B="flat";else if(U>0)B="up";else B="down";let T;if(B==="flat")T=null;else T=B==="up"===Z;return{axis:$,label:X,available:!0,higher_is_better:Z,data_points:K,latest:X$(q[K-1]),direction:B,improving:T,delta:X$(U),earlier_mean:X$(G),later_mean:X$(Y),insufficient:!1}}function c0($){let Q=w6($),Z=Q.map((V)=>({run_id:V.run_id,generated_at:V.generated_at,council_pass_rate:V.council_pass_rate,gate_pass_rate:V.gate_pass_rate,iterations:V.iterations,interventions:V.interventions})),z={};for(let V of u$)z[V]=_6(V,Q.map((H)=>H[V]));let X=Q.length<2,q=u$.filter((V)=>z[V].available&&z[V].improving===!0),K=u$.filter((V)=>z[V].available&&z[V].improving===!1),W=[];if(X)W.push(`not enough history yet: ${Q.length} run(s) recorded, need 2+ to show a trend`);if(!z.interventions.available)W.push("intervention trend unavailable: no per-run intervention count in proof.json yet (axis lights up automatically once recorded)");return{schema_version:H6,generated_at:new Date().toISOString(),loki_dir:$,runs_count:Q.length,insufficient:X,axes:z,improving_count:q.length,regressing_count:K.length,improving_axes:q,regressing_axes:K,series:Z,notes:W}}function p0($){return JSON.stringify($,null,2)}function l0($,Q){let Z=I$($,"metrics"),z=I$(Z,"trust-trajectory.json");try{return K6(Z,{recursive:!0}),W6(z,JSON.stringify(Q,null,2)),z}catch{return null}}function I6($){if($==="up")return"up";if($==="down")return"down";return"flat"}function L6($){let Q=$.label??$.axis;if(!$.available)return`  ${(Q+":").padEnd(26)} no data`;let Z;if($.insufficient)Z="(need 2+ runs)";else if($.improving===!0)Z="improving";else if($.improving===!1)Z="regressing";else Z="stable";let z=$.higher_is_better?"higher better":"lower better",X=$.latest??"n/a";return`  ${(Q+":").padEnd(26)} ${I6($.direction).padEnd(5)} latest=${String(X).padEnd(7)} ${Z.padEnd(11)} [${z}]`}function d0($){let Q=[];if(Q.push(`Loki Mode Trust Trajectory  (snapshot at ${$.generated_at})`),Q.push(`Source: ${$.loki_dir}`),Q.push(`Runs analyzed: ${$.runs_count}`),Q.push(""),$.insufficient){if(Q.push("Not enough history yet."),Q.push("Trust trajectory needs 2+ recorded runs to show a direction."),Q.push("Each `loki start` run writes a proof-of-run; come back after the next run."),$.notes.length>0){Q.push(""),Q.push("Notes");for(let X of $.notes)Q.push(`  - ${X}`)}return Q.join(`
`)}Q.push("Is the agent earning autonomy on this repo?");for(let X of u$)if($.axes[X])Q.push(L6($.axes[X]));Q.push("");let{improving_count:Z,regressing_count:z}=$;if(Z&&!z)Q.push(`Overall: trending more trustworthy (${Z} axis improving).`);else if(z&&!Z)Q.push(`Overall: trust regressing (${z} axis regressing). Review recent runs.`);else if(Z||z)Q.push(`Overall: mixed (${Z} improving / ${z} regressing).`);else Q.push("Overall: stable.");if($.notes.length>0){Q.push(""),Q.push("Notes");for(let X of $.notes)Q.push(`  - ${X}`)}return Q.join(`
`)}var H6=1,u$,G6,U6,Y6,u0;var o0=P(()=>{u$=["council_pass_rate","gate_pass_rate","iterations","interventions"],G6={council_pass_rate:!0,gate_pass_rate:!0,iterations:!1,interventions:!1},U6={council_pass_rate:0.01,gate_pass_rate:0.01,iterations:0.25,interventions:0.25},Y6={council_pass_rate:"Council pass rate",gate_pass_rate:"Gate pass rate",iterations:"Iterations to completion",interventions:"Human interventions"},u0=["APPROVE","APPROVED","COMPLETE","PASS","PASSED"]});var n0={};b(n0,{runTrust:()=>j6});function j6($){let Q=!1;for(let X of $){if(X==="--help"||X==="-h"||X==="help")return process.stdout.write(P6),0;if(X==="--json"){Q=!0;continue}return process.stderr.write(`loki trust: unknown arg: ${X}
Run 'loki trust --help' for usage.
`),1}let Z=j(),z=c0(Z);return l0(Z,z),process.stdout.write(Q?p0(z)+`
`:d0(z)+`
`),0}var P6=`loki trust -- visible trust trajectory (R4)

Usage:
  loki trust             Pretty-print the per-project trust trajectory
  loki trust --json      Emit the trajectory as JSON
  loki trust --help      Show this help

Shows whether the agent is earning autonomy on THIS repo over time:
  - Council pass rate        (higher is better)
  - Gate pass rate           (higher is better)
  - Iterations to completion (lower is better)
  - Human interventions      (lower is better, when recorded)

Derived read-only from proof-of-run history in .loki/proofs/. With fewer
than 2 recorded runs it reports "not enough history yet" rather than a
fabricated trend. Complements 'loki kpis' (single-run snapshot).
`;var a0=P(()=>{o0();C()});import{closeSync as L$,fstatSync as F6,fsyncSync as s0,lstatSync as R6,mkdirSync as t0,openSync as p$,readSync as k6,renameSync as x6,rmSync as r0,statSync as E6,unlinkSync as i0,writeSync as e0}from"fs";import{dirname as A1}from"path";function w1($,Q){t0(A1($),{recursive:!0});let Z=`${$}.tmp.${process.pid}.${++N6}`,z=p$(Z,"w");try{e0(z,Q),s0(z)}finally{L$(z)}x6(Z,$),S6($)}function S6($){let Q=null;try{Q=p$(A1($),"r"),s0(Q)}catch{}finally{if(Q!==null)try{L$(Q)}catch{}}}function P$($,Q){w1($,`${JSON.stringify(Q,null,2)}
`)}async function $Q($,Q){let Z=c$.get($)??Promise.resolve(),z=()=>{},X=new Promise((K)=>{z=K}),q=Z.catch(()=>{}).then(()=>X);c$.set($,q);try{return await Z.catch(()=>{}),await Q()}finally{if(z(),c$.get($)===q)c$.delete($)}}function C6($){return`${$}.lock`}function b6($){if(!Number.isFinite($)||$<=0)return!1;try{return process.kill($,0),!0}catch(Q){return Q?.code==="EPERM"}}function h6($){let Q=null;try{return t0(A1($),{recursive:!0}),Q=p$($,"wx"),e0(Q,`${process.pid}
`),Q}catch(Z){if(Q!==null){try{L$(Q)}catch{}try{i0($)}catch{}}if(Z?.code==="EEXIST")return null;throw Z}}function y6($,Q){let Z;try{Z=R6($)}catch{return!0}if(Z.isSymbolicLink())try{return i0($),!0}catch{return!1}let z;try{z=p$($,"r")}catch{return!0}try{let X=F6(z);if(Date.now()-X.mtimeMs<Q)return!1;let K=NaN;try{let W=Buffer.alloc(64),V=k6(z,W,0,64,0);K=Number.parseInt(W.subarray(0,V).toString("utf-8").trim(),10)}catch{}if(Number.isFinite(K)&&b6(K))return!1;try{if(E6($).mtimeMs>X.mtimeMs)return!1}catch{return!0}try{r0($,{force:!0})}catch{}return!0}finally{try{L$(z)}catch{}}}function j$($,Q,Z={}){let z=Z.timeoutMs??1e4,X=Z.pollMs??25,q=Z.staleMs??30000,K=C6($),W=Date.now()+z,V=null,H=0,G=new Int32Array(new SharedArrayBuffer(4));while(V===null){if(V=h6(K),V!==null)break;if(Date.now()>W)throw Error(`withFileLockSync: timed out after ${z}ms acquiring ${K}`);if(y6(K,q))continue;let Y=Math.min(X*2**Math.min(H,4),D6);H+=1,Atomics.wait(G,0,0,Y)}try{return Q()}finally{try{L$(V)}catch{}try{r0(K,{force:!0})}catch{}}}var N6=0,c$,D6=50;var F$=P(()=>{c$=new Map});import{existsSync as K$,mkdirSync as B$,copyFileSync as XQ,readFileSync as L1,readdirSync as v6,statSync as m6,writeFileSync as g6,renameSync as KQ,appendFileSync as qQ,rmSync as f6}from"fs";import{join as m,dirname as l$}from"path";function c6($){let Q=ZQ.then($,$);return ZQ=Q.catch((Z)=>{console.warn("[checkpoint] serialized op rejected:",Z);return}),Q}function n($){return m($,"state","checkpoints")}function JQ($){return m(n($),"index.jsonl")}async function p6($){let Q=await R(["git","rev-parse","HEAD"],{cwd:$,timeoutMs:5000});if(Q.exitCode!==0)return"no-git";return Q.stdout.trim()||"no-git"}async function l6($){let Q=await R(["git","branch","--show-current"],{cwd:$,timeoutMs:5000});if(Q.exitCode!==0)return"unknown";return Q.stdout.trim()||"unknown"}async function d6($){let Q=await R(["git","diff","--quiet"],{cwd:$,timeoutMs:5000}),Z=await R(["git","diff","--cached","--quiet"],{cwd:$,timeoutMs:5000}),z=Q.exitCode===1,X=Z.exitCode===1;return z||X}function o6($){let Q=m($,"state","orchestrator.json");if(!K$(Q))return"unknown";try{let z=JSON.parse(L1(Q,"utf-8")).currentPhase;return typeof z==="string"&&z.length>0?z:"unknown"}catch{return"unknown"}}function a6($,Q){for(let Z of n6){let z=m($,Z);if(!K$(z))continue;let X=m(Q,Z);B$(l$(X),{recursive:!0});try{XQ(z,X)}catch{}}}function WQ($,Q){B$(l$($),{recursive:!0});let Z=`${$}.tmp.${process.pid}.${++VQ}`;g6(Z,Q),KQ(Z,$)}function s6($){return JSON.stringify($,null,2)}function HQ($){return`{${[`"id": ${JSON.stringify($.id)}`,`"ts": ${JSON.stringify($.ts)}`,`"iter": ${JSON.stringify($.iter)}`,`"task": ${JSON.stringify($.task)}`,`"sha": ${JSON.stringify($.sha)}`].join(", ")}}`}async function t6($){return c6(()=>r6($))}async function r6($){let Q=$.lokiDirOverride??j(),Z=process.cwd(),z=n(Q);if(B$(z,{recursive:!0}),!$.forceCreate){if(!await d6(Z))return{created:!1,reason:"no uncommitted changes"}}let X=await p6(Z),q=await l6(Z),K=$.iteration??Number.parseInt(process.env.ITERATION_COUNT??"0",10),W=$.epochOverride??Math.floor(Date.now()/1000),V=`cp-${K}-${W}`,H=m(z,V);B$(H,{recursive:!0}),a6(Q,H);let G=new Date().toISOString().replace(/\.\d{3}Z$/,"Z"),Y=($.taskDescription??"task completed").slice(0,u6),U=$.provider??process.env.PROVIDER_NAME??"claude",B={id:V,timestamp:G,iteration:K,task_id:$.taskId??"unknown",task_description:Y,git_sha:X,git_branch:q,provider:U,phase:o6(Q)};WQ(m(H,"metadata.json"),s6(B));let T={id:B.id,ts:B.timestamp,iter:B.iteration,task:B.task_description,sha:B.git_sha},A=JQ(Q);return j$(A,()=>{qQ(A,`${HQ(T)}
`)}),i6(Q),{created:!0,id:V,metadata:B,dir:H}}function P1($){let Q=n($);if(!K$(Q))return[];return v6(Q).filter((Z)=>Z.startsWith("cp-")).filter((Z)=>{try{return m6(m(Q,Z)).isDirectory()}catch{return!1}})}function j1($){return[...$].sort((Q,Z)=>{let z=zQ(Q),X=zQ(Z);return z-X})}function zQ($){let Q=$.split("-");if(Q.length<3)return 0;let Z=Q[Q.length-1],z=Number.parseInt(Z??"0",10);return Number.isFinite(z)?z:0}function i6($){let Q=P1($);if(Q.length<=QQ)return;let Z=j1(Q),z=Z.slice(0,Z.length-QQ);for(let X of z)try{f6(m(n($),X),{recursive:!0,force:!0})}catch{}e6($)}function e6($){let Q=j1(P1($)),Z=[];for(let q of Q){let K=m(n($),q,"metadata.json"),W=m(n($),q);if(!K$(K)){_1($,W,"missing_field","metadata.json");continue}try{let V=JSON.parse(L1(K,"utf-8")),H=UQ(V,K);if(!H.ok){_1($,W,H.reason,H.field);continue}let G=H.value;Z.push(HQ({id:G.id,ts:G.timestamp,iter:G.iteration,task:G.task_description??"",sha:G.git_sha}))}catch{_1($,W,"invalid_type","metadata.json")}}let z=JQ($),X=Z.length>0?`${Z.join(`
`)}
`:"";WQ(z,X)}function _1($,Q,Z,z){let X=m($,"events.jsonl"),q={timestamp:new Date().toISOString(),type:"checkpoint.metadata.dropped",checkpoint_dir:Q,reason:Z,field:z};try{B$(l$(X),{recursive:!0}),j$(X,()=>{qQ(X,`${JSON.stringify(q)}
`)})}catch{}}function F1($){let Q=$??j(),Z=j1(P1(Q)),z=[];for(let X of Z){let q=GQ(Q,X);if(q)z.push(q)}return z}function GQ($,Q){let Z=m(n($),Q,"metadata.json");if(!K$(Z))return null;try{let z=JSON.parse(L1(Z,"utf-8"));return $7(z,Z)}catch{return null}}function $7($,Q){let Z=UQ($,Q);return Z.ok?Z.value:null}function UQ($,Q){if($===null||typeof $!=="object")return console.warn(`[checkpoint] invalid metadata at ${Q}: not an object`),{ok:!1,reason:"invalid_type",field:"<root>"};let Z=$,z=["id","timestamp","task_id","task_description","git_sha","git_branch","provider","phase"];for(let X of z){if(!(X in Z))return console.warn(`[checkpoint] invalid metadata at ${Q}: field "${X}" missing`),{ok:!1,reason:"missing_field",field:X};if(typeof Z[X]!=="string")return console.warn(`[checkpoint] invalid metadata at ${Q}: field "${X}" not a string`),{ok:!1,reason:"invalid_type",field:X}}if(!Object.prototype.hasOwnProperty.call(Z,"iteration"))return console.warn(`[checkpoint] invalid metadata at ${Q}: field "iteration" missing`),{ok:!1,reason:"missing_field",field:"iteration"};if(typeof Z.iteration!=="number"||!Number.isFinite(Z.iteration))return console.warn(`[checkpoint] invalid metadata at ${Q}: field "iteration" not a finite number`),{ok:!1,reason:"invalid_type",field:"iteration"};for(let X of Z7){let q=Z[X];if(Q7.test(q))return console.warn(`[checkpoint] invalid metadata at ${Q}: field "${X}" contains control characters`),{ok:!1,reason:"control_chars",field:X}}return{ok:!0,value:{id:Z.id,timestamp:Z.timestamp,iteration:Z.iteration,task_id:Z.task_id,task_description:Z.task_description,git_sha:Z.git_sha,git_branch:Z.git_branch,provider:Z.provider,phase:Z.phase}}}function R1($,Q){if(!z7.test($))throw new YQ($);let Z=Q??j(),z=m(n(Z),$);if(!K$(z))throw new I1($);let X=GQ(Z,$);if(!X)throw new I1($);return X}function BQ($,Q){let Z=R1($,Q),z=Q??j(),X=m(n(z),$),q=[];for(let K of X7){let W=m(X,K);if(!K$(W))continue;q.push({from:W,to:m(z,K)})}return{id:$,metadata:Z,restore:q}}function K7($){let Q=[],Z=0;for(let z of $.restore)try{B$(l$(z.to),{recursive:!0});let X=`${z.to}.tmp.${process.pid}.${++VQ}`;XQ(z.from,X),KQ(X,z.to),Z+=1}catch(X){Q.push(`${z.from} -> ${z.to}: ${X.message}`)}return{restored:Z,errors:Q}}async function MQ($,Q,Z=!1){let z=null;try{let q=await t6({taskDescription:`pre-rollback snapshot (before restoring ${$.id})`,taskId:"rollback",forceCreate:!0,lokiDirOverride:Q});if(q.created)z=q.id}catch(q){let K=q instanceof Error?q.message:String(q);if(!Z)throw Error("pre-rollback snapshot failed ("+K+"); aborting rollback to preserve current state. Re-run with force to roll back anyway without a safety snapshot.");console.warn("[checkpoint] pre-rollback snapshot failed; proceeding due to force:",K)}let X=K7($);return{preRollbackSnapshotId:z,restored:X.restored,errors:X.errors}}var QQ=50,u6=200,ZQ,n6,VQ=0,Q7,Z7,z7,I1,YQ,X7;var TQ=P(()=>{C();o();F$();ZQ=Promise.resolve();n6=["state/orchestrator.json","autonomy-state.json","queue/pending.json","queue/completed.json","queue/in-progress.json","queue/current-task.json","CONTINUITY.md"];Q7=/[\x00-\x08\x0a-\x1f\x7f-\x9f]/,Z7=["id","task_id","git_sha","git_branch","provider","phase"];z7=/^[a-zA-Z0-9_-]+$/;I1=class I1 extends Error{id;constructor($){super(`Checkpoint not found: ${$}`);this.id=$;this.name="CheckpointNotFoundError"}};YQ=class YQ extends Error{id;constructor($){super(`Invalid checkpoint ID: must be alphanumeric, hyphens, underscores only (got: ${$})`);this.id=$;this.name="InvalidCheckpointIdError"}};X7=["state/orchestrator.json","queue/pending.json","queue/completed.json","queue/in-progress.json","queue/current-task.json","CONTINUITY.md"]});var wQ={};b(wQ,{runRollback:()=>q7});async function q7($){let Q=$[0],Z=$.slice(1);if(Q===void 0||Q==="help"||Q==="--help"||Q==="-h")return process.stdout.write(OQ),Q===void 0?1:0;switch(Q){case"list":{let z=[...F1()].reverse();if(z.length===0)return process.stdout.write(`${_}No checkpoints found.${J}
`),0;process.stdout.write(`${k}Checkpoints${J} (${z.length}, newest first):
`);for(let X of z)process.stdout.write(`  ${L}${X.id}${J}  iter=${X.iteration}  ${X.git_branch||"(no branch)"}@${(X.git_sha||"").slice(0,7)}  ${X.timestamp}
`);return 0}case"show":{let z=Z[0];if(!z)return process.stderr.write(`${M}Missing checkpoint id.${J} Use \`loki rollback list\`.
`),2;try{let X=R1(z);return process.stdout.write(`${JSON.stringify(X,null,2)}
`),0}catch(X){return process.stderr.write(`${M}Failed to read checkpoint:${J} ${X.message}
`),1}}case"to":{let z=Z[0];if(!z)return process.stderr.write(`${M}Missing checkpoint id.${J} Use \`loki rollback list\`.
`),2;return await AQ(z,Z.includes("--force"))}case"latest":{let z=F1(),X=z[z.length-1];if(!X)return process.stderr.write(`${M}No checkpoints found to roll back to.${J}
`),1;return process.stdout.write(`Rolling back to latest checkpoint: ${L}${X.id}${J}
`),await AQ(X.id,Z.includes("--force"))}default:return process.stderr.write(`Unknown subcommand: ${Q}
`),process.stderr.write(OQ),2}}async function AQ($,Q=!1){let Z;try{Z=BQ($)}catch(X){return process.stderr.write(`${M}Cannot plan rollback:${J} ${X.message}
`),1}if(Z.restore.length===0)return process.stdout.write(`${_}Checkpoint ${$} has no restorable state files; nothing to do.${J}
`),0;let z;try{z=await MQ(Z,void 0,Q)}catch(X){return process.stderr.write(`${M}Rollback aborted:${J} ${X.message}
`),1}if(z.errors.length>0){for(let X of z.errors)process.stderr.write(`${M}restore error:${J} ${X}
`);return process.stderr.write(`${M}Partial rollback: ${z.restored}/${Z.restore.length} files restored.${J}
`),1}if(process.stdout.write(`${S}Rolled back ${z.restored}/${Z.restore.length} state files from ${$}.${J}
`),z.preRollbackSnapshotId)process.stdout.write(`Saved your prior state as ${L}${z.preRollbackSnapshotId}${J}; undo this rollback with \`loki rollback to ${z.preRollbackSnapshotId}\`.
`);return process.stdout.write("Run `loki start` to resume from the restored state.\n"),0}var OQ=`Usage: loki rollback <subcommand>

Subcommands:
  list                   List checkpoints (newest first)
  show <id>              Print metadata for one checkpoint
  to <id>                Restore .loki/ state + context to that checkpoint
  latest                 Restore to the most recent checkpoint

Restored automatically (safe, non-code):
  .loki/state/orchestrator.json
  .loki/queue/{pending,completed,in-progress,current-task}.json
  .loki/CONTINUITY.md            (iteration / conversation handoff context)

Re-undoable: every rollback first captures a forced pre-rollback snapshot of
your current state, so you can always undo the undo (the snapshot id is printed).

Source code is NOT touched by this command. To also restore the working tree
to the checkpoint's snapshot (if one was anchored at checkpoint time):
  git stash apply refs/loki/cp/<id>

Re-run \`loki start\` to resume from the restored state.
`;var _Q=P(()=>{TQ();p()});function J7(){return process.env.LOKI_TIER||"oss"}function IQ($){let Q=J7();if(Q==="oss")return{allowed:!0,notes:[]};if(!process.env.LOKI_LICENSE_KEY)return{allowed:!1,notes:[`${_}LOKI_TIER='${Q}' requested but no LOKI_LICENSE_KEY set.${J}`,`Hosted/enterprise license verification is not available yet (capability: ${$}).`,"OSS users: leave LOKI_TIER unset (or 'oss') -- everything stays free."]};return{allowed:!0,notes:[`${_}LOKI_LICENSE_KEY set but the verification backend is not available yet (R9 seam).${J}`]}}var LQ=P(()=>{p()});var FQ={};b(FQ,{runProof:()=>F7,renderProofBadge:()=>jQ});import{existsSync as q$,readdirSync as V7,readFileSync as PQ,mkdtempSync as W7,copyFileSync as H7,rmSync as G7}from"fs";import{join as a,resolve as U7}from"path";import{tmpdir as Y7}from"os";import{createInterface as B7}from"readline";import{readFile as M7}from"fs/promises";function d($){return $&&typeof $==="object"?$:{}}function c($){return $===void 0||$===null?"-":String($)}function M$(){return a(j(),"proofs")}function R$($){let Q=a(M$(),$,"proof.json");if(!q$(Q))return null;try{return JSON.parse(PQ(Q,"utf8"))}catch{return{}}}function $$($,Q){return $.length>=Q?$:$+" ".repeat(Q-$.length)}function O7(){let $=M$();if(!q$($))return process.stdout.write(`${_}No proofs found.${J} Run 'loki start' to generate one.
`),0;let Q=[];try{Q=V7($,{withFileTypes:!0}).filter((z)=>z.isDirectory()).map((z)=>z.name).sort()}catch{Q=[]}let Z=[];for(let z of Q){let X=a($,z,"proof.json");if(!q$(X))continue;let q={};try{q=JSON.parse(PQ(X,"utf8"))}catch{q={}}let K=c(q.run_id),W=c(q.generated_at),V=d(q.honesty).headline,H=c(V??d(q.council).final_verdict),G=c(d(q.cost).usd),Y=c(d(q.files_changed).count);Z.push(`${$$(K,26)}  ${$$(W,20)}  ${$$(H,18)}  ${$$(G,9)}  ${Y}`)}if(Z.length===0)return process.stdout.write(`${_}No proofs found.${J} Run 'loki start' to generate one.
`),0;process.stdout.write(`${$$("RUN_ID",26)}  ${$$("GENERATED_AT",20)}  ${$$("VERDICT",18)}  ${$$("COST_USD",9)}  FILES
`);for(let z of Z)process.stdout.write(`${z}
`);return 0}function A7($){if(!$)return process.stderr.write(`${M}Missing proof id.${J} Use 'loki proof list'.
`),2;let Q=R$($);if(Q===null)return process.stderr.write(`${M}Proof not found: ${$}${J}
`),process.stderr.write(`Use 'loki proof list' to see available proofs.
`),1;return process.stdout.write(`${JSON.stringify(Q,null,2)}
`),0}async function w7($){if(!$)return process.stderr.write(`${M}Missing proof id.${J} Use 'loki proof list'.
`),2;let Q=a(M$(),$,"index.html");if(!q$(Q))return process.stderr.write(`${M}Proof page not found: ${$}/index.html${J}
`),process.stderr.write(`Use 'loki proof list' to see available proofs.
`),1;process.stdout.write(`${S}Opening proof: ${Q}${J}
`);for(let Z of["open","xdg-open","start"])try{if((await R([Z,Q],{timeoutMs:5000})).exitCode===0)return 0}catch{}return process.stdout.write(`
Could not detect browser opener.
`),process.stdout.write(`Please open in browser: ${Q}
`),0}function _7($){return new Promise((Q)=>{let Z=B7({input:process.stdin,output:process.stdout});Z.question($,(z)=>{Z.close();let X=z.trim().toLowerCase();Q(X==="y"||X==="yes")})})}async function I7($,Q,Z){let z=IQ("hosted_publish");for(let U of z.notes)process.stderr.write(`${U}
`);let X=process.env.LOKI_HOSTED_ENDPOINT||"";if(!X)return process.stderr.write(`${_}Hosted publishing backend not available.${J}
`),process.stderr.write(`There is no official Loki hosted service yet (R9 ships the seam, not a live backend).
`),process.stderr.write(`To publish to your own hosted endpoint, set LOKI_HOSTED_ENDPOINT to its URL.
`),process.stderr.write(`Or publish to a GitHub Gist instead: loki proof share ${$}
`),1;let q=R$($);if(q){if(d(q.redaction).applied!==!0)return process.stderr.write(`${M}Refusing to publish: proof redaction was not confirmed applied.${J}
`),process.stderr.write(`Regenerate the proof (LOKI_PROOF=1) so the redactor runs, then retry.
`),1}process.stdout.write(`${k}Publishing proof '${$}' to hosted endpoint${J}
`),process.stdout.write(`  endpoint: ${X}
`),process.stdout.write(`  payload:  ${Q} (already redacted by the generator)

`);let K;try{K=await M7(Q)}catch{return process.stderr.write(`${M}Could not read proof page: ${Q}${J}
`),1}let W={"Content-Type":"text/html","X-Loki-Proof-Id":$},V=process.env.LOKI_LICENSE_KEY||"";if(V)W.Authorization=`Bearer ${V}`;let H;try{H=await fetch(X,{method:"POST",headers:W,body:new Uint8Array(K)})}catch(U){return process.stderr.write(`${M}Failed to reach hosted endpoint: ${String(U.message||U)}${J}
`),process.stderr.write(`Check LOKI_HOSTED_ENDPOINT or publish to a gist: loki proof share ${$}
`),1}let G=await H.text();if(!H.ok){if(process.stderr.write(`${M}Hosted endpoint returned HTTP ${H.status}.${J}
`),G)process.stderr.write(`Response:
`),process.stderr.write(`${G.slice(0,500)}
`);return process.stderr.write(`Nothing was published. Or publish to a gist: loki proof share ${$}
`),1}let Y="";try{let U=JSON.parse(G);if(U&&typeof U==="object"){let B=U.url??U.public_url;if(typeof B==="string")Y=B}}catch{}if(Y)process.stdout.write(`${S}Published: ${Y}${J}
`);else process.stdout.write(`${S}Published to ${X} (HTTP ${H.status}).${J}
`),process.stdout.write(`The endpoint did not return a 'url' field; check your endpoint's response.
`);return k1($,Y||void 0),0}function jQ($,Q){let Z=($??"").trim(),z="",X="";if(Z==="VERIFIED")z="Verified by Loki",X="brightgreen";else if(Z==="VERIFIED WITH GAPS")z="Verified with gaps",X="yellow";else if(Z==="NOT VERIFIED")z="Not verified",X="red";else return null;let q=(G)=>encodeURIComponent(G.replace(/-/g,"--")),H=`![${"Verified by Loki"}](${`https://img.shields.io/badge/${q("Loki")}-${q(z)}-${X}`})`;return Q?`[${H}](${Q})`:H}function k1($,Q){let Z=R$($),z=Z?c(d(Z.honesty).headline):"",X=jQ(z==="-"?"":z,Q);if(X)process.stdout.write(`
${k}Shareable badge${J} (copy-paste markdown):
`),process.stdout.write(`${X}
`);else process.stdout.write(`
${_}No badge:${J} this proof has no verifiable headline, so no badge is shown (no fake-green).
`)}function L7($){if(!$)return process.stderr.write(`${M}Missing proof id.${J} Use 'loki proof list'.
`),2;if(R$($)===null)return process.stderr.write(`${M}Proof not found: ${$}${J}
`),process.stderr.write(`Use 'loki proof list' to see available proofs.
`),1;return k1($),0}async function P7($){let Q="",Z=!1,z="--public",X=!1;for(let I of $)if(I==="--yes"||I==="-y")Z=!0;else if(I==="--private")z="";else if(I==="--public")z="--public";else if(I==="--hosted")X=!0;else if(I.startsWith("-"))return process.stderr.write(`${M}Unknown option: ${I}${J}
`),1;else Q=I;if(!Q)return process.stderr.write(`${M}Missing proof id.${J} Use 'loki proof list'.
`),2;let q=a(M$(),Q,"index.html");if(!q$(q))return process.stderr.write(`${M}Proof page not found: ${Q}/index.html${J}
`),process.stderr.write(`Use 'loki proof list' to see available proofs.
`),1;if(X)return I7(Q,q,a(M$(),Q,"proof.json"));if((await R(["gh","--version"],{timeoutMs:5000})).exitCode!==0)return process.stderr.write(`${M}gh CLI not found${J}
`),process.stderr.write(`Install the GitHub CLI to publish a proof:
`),process.stderr.write(`  brew install gh        # macOS
`),process.stderr.write(`  sudo apt install gh    # Ubuntu/Debian
`),process.stderr.write(`  https://cli.github.com # Other platforms
`),1;if((await R(["gh","auth","status"],{timeoutMs:1e4})).exitCode!==0)return process.stderr.write(`${M}GitHub CLI not authenticated${J}
`),process.stderr.write(`Run 'gh auth login' to authenticate, then try again.
`),1;let V=z===""?"secret":"public";process.stdout.write(`${k}Publishing proof '${Q}' as a ${V} GitHub Gist${J}

`),process.stdout.write(`What will be shared:
`),process.stdout.write(`  - ${q}
`);let H=R$(Q);if(H){let I=c(d(H.cost).usd),N=c(d(H.files_changed).count),f=c(d(H.council).final_verdict),g=d(H.redaction);process.stdout.write(`  - cost.usd:        ${I}
`),process.stdout.write(`  - files_changed:   ${N}
`),process.stdout.write(`  - council verdict: ${f}
`),process.stdout.write(`  - redaction:       applied=${c(g.applied)} rules_version=${c(g.rules_version)} redactions_count=${c(g.redactions_count)}
`)}if(process.stdout.write(`
${_}Secrets, API keys, tokens, env values, and absolute paths have already been stripped by the generator.${J}

`),!Z){if(!await _7(`Publish this proof to a ${V} gist? [y/N] `))return process.stdout.write(`Aborted. Nothing was published.
`),0}let G=W7(a(Y7(),"loki-proof-")),Y=a(G,"index.html");H7(q,Y),process.stdout.write(`Uploading proof page...
`);let U=`Loki Mode proof-of-run ${Q}`,B=["gh","gist","create",Y,"--desc",U];if(z!=="")B.push(z);let T=await R(B,{timeoutMs:60000});try{G7(G,{recursive:!0,force:!0})}catch{}if(T.exitCode!==0)return process.stderr.write(`${M}Failed to create gist${J}
`),process.stderr.write(`${T.stdout}${T.stderr}
`),1;let A=T.stdout.trim();return process.stdout.write(`${S}Shared: ${A}${J}
`),k1(Q,A),0}async function j7($){if(!$)return process.stderr.write(`${M}Missing proof id.${J} Use 'loki proof list'.
`),2;let Q=a(M$(),$,"proof.json");if(!q$(Q))return process.stderr.write(`${M}Proof not found: ${$}${J}
`),process.stderr.write(`Use 'loki proof list' to see available proofs.
`),1;let Z=U7(h,"autonomy","lib","proof-verify.py");if(!q$(Z))return process.stderr.write(`${M}Verifier not found (autonomy/lib/proof-verify.py).${J}
`),2;let z=process.env.TARGET_DIR||".",X=await R(["python3",Z,Q,z],{timeoutMs:30000});if(X.stdout)process.stdout.write(X.stdout);if(X.stderr)process.stderr.write(X.stderr);return X.exitCode}async function F7($){let Q=$[0],Z=$.slice(1);if(Q===void 0||Q==="help"||Q==="--help"||Q==="-h")return process.stdout.write(T7),Q===void 0?1:0;switch(Q){case"list":return O7();case"show":return A7(Z[0]);case"verify":return j7(Z[0]);case"open":return w7(Z[0]);case"share":return P7(Z);case"badge":return L7(Z[0]);default:return process.stderr.write(`${M}Unknown subcommand: ${Q}${J}
`),process.stderr.write(`Run 'loki proof --help' for usage.
`),1}}var T7;var RQ=P(()=>{C();o();p();LQ();T7=`${k}loki proof${J} - inspect and share proof-of-run artifacts

Usage: loki proof <subcommand> [args]

Subcommands:
  list                 List proof-of-run artifacts in .loki/proofs/
  show <id>            Pretty-print .loki/proofs/<id>/proof.json
  verify <id>          Re-check a receipt against your code (tamper + drift)
  open <id>            Open .loki/proofs/<id>/index.html in a browser
  share <id>           Publish the proof page as a GitHub Gist (opt-in)
  badge <id>           Print a copy-paste "Verified by Loki" markdown badge

Options for 'share':
  --yes                Skip the redaction-preview confirmation prompt
  --private            Create a secret gist (default: public)
  --hosted             Publish to LOKI_HOSTED_ENDPOINT (open-core seam; no official backend yet)

Proofs are generated automatically at run completion (LOKI_PROOF=0 to opt out).
`});var DQ={};b(DQ,{runCrash:()=>b7});import{existsSync as xQ,readdirSync as R7,readFileSync as k7}from"fs";import{join as EQ}from"path";function k$($){return $===void 0||$===null?"-":String($)}function d$($,Q){return $.length>=Q?$:$+" ".repeat(Q-$.length)}function NQ(){return EQ(j(),"crash")}function x1(){let $=NQ();if(!xQ($))return[];try{return R7($,{withFileTypes:!0}).filter((Q)=>Q.isFile()&&Q.name.endsWith(".json")).map((Q)=>Q.name.slice(0,-5)).sort()}catch{return[]}}function E7($){if($.length===0)return!1;if($.includes("/")||$.includes("\\"))return!1;if($.includes(".."))return!1;return!0}function o$($){if(!E7($))return null;let Q=EQ(NQ(),`${$}.json`);if(!xQ(Q))return null;try{return JSON.parse(k7(Q,"utf8"))}catch{return{}}}function N7(){let $=x1();if($.length===0)return process.stdout.write(`${_}No crash reports found.${J} Nothing has been captured in .loki/crash/.
`),0;process.stdout.write(`${d$("ID",40)}  ${d$("CAPTURED_AT",22)}  ERROR_CLASS
`);for(let Q of $){let Z=o$(Q)??{},z=k$(Z.fingerprint),X=k$(Z.captured_at),q=k$(Z.error_class),K=z!=="-"?z:Q;process.stdout.write(`${d$(K,40)}  ${d$(X,22)}  ${q}
`)}return process.stdout.write(`
${$.length} report(s). Run 'loki crash show <id>' to inspect, 'loki crash submit' to get a prefilled GitHub issue URL.
`),0}function SQ($){let Q=o$($);if(Q!==null)return{id:$,report:Q};for(let Z of x1()){let z=o$(Z);if(z&&String(z.fingerprint??"")===$)return{id:Z,report:z}}return null}function S7($){if(!$)return process.stderr.write(`${M}Missing crash id.${J} Use 'loki crash' to list reports.
`),2;let Q=SQ($);if(Q===null)return process.stderr.write(`${M}Crash report not found: ${$}${J}
`),process.stderr.write(`Use 'loki crash' to see available reports.
`),1;return process.stdout.write(`${JSON.stringify(Q.report,null,2)}
`),0}function D7($){let Q=k$($.error_class),Z=k$($.fingerprint),z=Z!=="-"?Z.slice(0,12):"unknown",X=`crash: ${Q} (${z})`,K=["Anonymous crash report captured by Loki Mode (scrubbed, whitelist-only).","","Scrubbed payload:","```json",JSON.stringify($,null,2),"```","","Nothing was sent automatically. This issue is submitted manually by me."].join(`
`),W=new URLSearchParams({title:X,body:K});return`${x7}?${W.toString()}`}function C7($){let Q;if($){if(Q=SQ($),Q===null)return process.stderr.write(`${M}Crash report not found: ${$}${J}
`),process.stderr.write(`Use 'loki crash' to see available reports.
`),1}else{let Z=x1();if(Z.length===0)return process.stdout.write(`${_}No crash reports found.${J} Nothing to submit.
`),0;let z=Z[Z.length-1],X=o$(z)??{};Q={id:z,report:X}}return process.stdout.write(`${k}Scrubbed payload (this is the ENTIRE report):${J}
`),process.stdout.write(`${JSON.stringify(Q.report,null,2)}

`),process.stdout.write(`${_}Nothing is sent automatically in this version.${J} Loki Mode never transmits crash data on its own.
`),process.stdout.write(`To submit manually, open this prefilled GitHub issue and review it first:

`),process.stdout.write(`  ${L}${D7(Q.report)}${J}

`),process.stdout.write(`${S}The payload above is exactly what the URL contains.${J}
`),process.stdout.write(`See docs/PRIVACY.md for what is and is not collected.
`),0}async function b7($){let Q=$[0];switch(Q){case void 0:case"list":return N7();case"--help":case"-h":case"help":return process.stdout.write(kQ),0;case"show":return S7($[1]);case"submit":return C7($[1]);default:return process.stderr.write(`${M}Unknown crash subcommand: ${Q}${J}
`),process.stdout.write(kQ),2}}var x7="https://github.com/asklokesh/loki-mode/issues/new",kQ;var CQ=P(()=>{C();p();kQ=`${k}loki crash${J} - inspect and manually submit local crash reports

Usage: loki crash [subcommand] [args]

Subcommands:
  (none) | list        List crash reports in .loki/crash/
  show <id>            Pretty-print one scrubbed crash report
  submit [<id>]        Print the scrubbed payload and a prefilled GitHub
                       issue URL for manual submission

Crash reports are anonymous, scrubbed, and stored locally only. Nothing is
sent automatically in this version. See docs/PRIVACY.md.
`});var vQ={};b(vQ,{runWiki:()=>g7});import{existsSync as E1,readFileSync as bQ}from"fs";import{join as N1,resolve as h7}from"path";function v7(){return N1(process.cwd(),".loki","wiki")}function m7($){let Q="";for(let X of $){if(X==="--help"||X==="-h")return process.stdout.write(`Usage: loki wiki show [section]
Sections: architecture, modules, data-flow
`),0;if(X.startsWith("-"))return process.stderr.write(`${M}Unknown option: ${X}${J}
`),1;Q=X}let Z=v7();if(!E1(Z))return process.stderr.write(`${_}No wiki found. Run 'loki wiki generate' first.${J}
`),1;if(Q){if(!y7.has(Q))return process.stderr.write(`${M}No such section: ${Q} (try: architecture, modules, data-flow)${J}
`),1;let X=N1(Z,`${Q}.md`);if(!E1(X))return process.stderr.write(`${M}Section not generated: ${Q}${J}
`),1;return process.stdout.write(bQ(X,"utf8")),0}let z=N1(Z,"index.md");if(!E1(z))return process.stderr.write(`${M}Wiki index not found. Run 'loki wiki generate'.${J}
`),1;return process.stdout.write(bQ(z,"utf8")),0}async function yQ($,Q){let Z=h7(h,"autonomy","loki"),z=3600000,X=Bun.spawn({cmd:[Z,"wiki",$,...Q],stdin:"inherit",stdout:"inherit",stderr:"inherit",env:{...process.env,LOKI_LEGACY_BASH:"1"}}),q=setTimeout(()=>{try{X.kill("SIGKILL")}catch{}},3600000);try{return await X.exited}finally{clearTimeout(q)}}async function g7($){let Q=$[0],Z=$.slice(1);switch(Q){case void 0:case"help":case"--help":case"-h":return process.stdout.write(hQ),0;case"show":return m7(Z);case"generate":return yQ("generate",Z);case"ask":return yQ("ask",Z);default:return process.stderr.write(`${M}Unknown wiki command: ${Q}${J}
`),process.stdout.write(hQ),1}}var hQ,y7;var mQ=P(()=>{C();p();hQ=`${k}loki wiki${J} - Auto-generated, cited codebase wiki + Q&A

Usage: loki wiki <command> [options]

Commands:
  generate [path] [--force]   Build/refresh the cited wiki in .loki/wiki/
  show [section]              Print the wiki (or one section: architecture|modules|data-flow)
  ask "<question>"           Cited answer grounded in the codebase (file:line)

Each wiki section cites the real source files it was built from.
Generation is incremental: it skips when the codebase is unchanged.

Examples:
  loki wiki generate
  loki wiki show architecture
  loki wiki ask "how does the cli dispatch commands"
`,y7=new Set(["architecture","modules","data-flow"])});var D1={};b(D1,{renderFindingsForPrompt:()=>l7,loadPreviousFindings:()=>S1,findLatestReviewDir:()=>pQ,_parseReviewerOutputForTests:()=>d7});import{existsSync as fQ,readFileSync as gQ,readdirSync as uQ,statSync as f7}from"fs";import{join as n$}from"path";function p7($){let Q=$.toLowerCase();if(Q==="critical")return"Critical";if(Q==="high")return"High";if(Q==="medium")return"Medium";return"Low"}function cQ($,Q,Z,z){let X=[],q=$.split(/\r?\n/);for(let K of q){let W=K.trim();if(W.length===0)continue;let V=W.replace(/^[-*]\s*/,""),H=u7.exec(V);if(!H||!H[1]||!H[2])continue;let G=p7(H[1]),Y=H[2].trim(),U=c7.exec(Y),B=U&&U[1]?U[1]:null,T=U&&U[2]?Number.parseInt(U[2],10):null;X.push({reviewId:Z,iteration:z,reviewer:Q,severity:G,description:Y,file:B,line:Number.isFinite(T)?T:null,raw:W})}return X}function pQ($,Q){let Z=n$($,"quality","reviews");if(!fQ(Z))return null;let z;try{z=uQ(Z)}catch{return null}let X=Q===void 0?z.filter((W)=>W.startsWith("review-")):z.filter((W)=>W.endsWith(`-${Q}`)&&W.startsWith("review-"));if(X.length===0)return null;X.sort();let q=X[X.length-1];if(!q)return null;let K=n$(Z,q);try{if(!f7(K).isDirectory())return null}catch{return null}return K}function S1($,Q){let Z=pQ($,Q);if(Z===null)return{reviewDir:null,reviewId:null,iteration:null,findings:[]};let z=null,X=null,q=n$(Z,"aggregate.json");if(fQ(q))try{let H=gQ(q,"utf-8"),G=JSON.parse(H);if(typeof G.review_id==="string")z=G.review_id;if(typeof G.iteration==="number")X=G.iteration}catch{}let K;try{K=uQ(Z)}catch{return{reviewDir:Z,reviewId:z,iteration:X,findings:[]}}let W=new Set(["diff.txt","files.txt","anti-sycophancy.txt"]),V=[];for(let H of K){if(!H.endsWith(".txt"))continue;if(W.has(H))continue;if(H.endsWith("-prompt.txt"))continue;let G=H.replace(/\.txt$/,""),Y;try{Y=gQ(n$(Z,H),"utf-8")}catch{continue}V.push(...cQ(Y,G,z??"",X??-1))}return{reviewDir:Z,reviewId:z,iteration:X,findings:V}}function l7($){if($.length===0)return"";let Q=["Critical","High","Medium","Low"],Z=new Map;for(let X of Q)Z.set(X,[]);for(let X of $){let q=Z.get(X.severity);if(q)q.push(X)}let z=[];z.push("PREVIOUS REVIEWER FINDINGS (must address each, or supply counter-evidence in .loki/state/counter-evidence-<iter>.json):");for(let X of Q){let q=Z.get(X)??[];if(q.length===0)continue;z.push(`  [${X}] (${q.length}):`);for(let K of q){let W=K.file?` (${K.file}${K.line!==null?":"+K.line:""})`:"";z.push(`    - ${K.description}${W} -- via ${K.reviewer}`)}}return z.join(`
`)}function d7($,Q,Z="review-test",z=0){return cQ($,Q,Z,z)}var u7,c7;var a$=P(()=>{u7=/\[(Critical|High|Medium|Low)\]\s*(.+)/i,c7=/([\w.\-/]+\.[a-zA-Z]+):(\d+)/});import{existsSync as o7}from"fs";import{join as n7}from"path";async function lQ($,Q){let Z=n7($,"memory");if(!o7(Z))return{stored:!1,reason:"memory dir not initialized"};let z=Math.max(0,Math.floor(Q.durationSeconds??0)),X={_LOKI_PROJECT_DIR:h,_LOKI_TARGET_DIR:process.cwd(),_LOKI_TASK_ID:Q.taskId,_LOKI_OUTCOME:Q.outcome,_LOKI_PHASE:Q.phase,_LOKI_GOAL:Q.goal,_LOKI_DURATION:String(z),_LOKI_LOKI_DIR:$},K=await z$(`
import os, sys
project = os.environ.get('_LOKI_PROJECT_DIR', '')
loki = os.environ.get('_LOKI_LOKI_DIR', '.loki')
task_id = os.environ.get('_LOKI_TASK_ID', '')
outcome = os.environ.get('_LOKI_OUTCOME', '')
phase = os.environ.get('_LOKI_PHASE', '')
goal = os.environ.get('_LOKI_GOAL', '')
duration = os.environ.get('_LOKI_DURATION', '0')
sys.path.insert(0, project)
try:
    from memory.engine import MemoryEngine
    from memory.schemas import EpisodeTrace
    engine = MemoryEngine(loki + '/memory')
    engine.initialize()
    trace = EpisodeTrace.create(
        task_id=task_id,
        agent='loki-orchestrator',
        phase=phase,
        goal=goal,
        outcome=outcome,
        duration_seconds=int(duration) if duration.isdigit() else 0,
    )
    engine.store_episode(trace)
    print('OK')
except Exception as e:
    print('ERR:' + str(e))
`,{env:X,timeoutMs:15000});if(K.exitCode===127)return{stored:!1,reason:"python3 not found"};let W=K.stdout.trim();if(W==="OK")return{stored:!0,reason:"stored"};if(W.startsWith("ERR:"))return{stored:!1,reason:W.replace(/^ERR:/,"")};return{stored:!1,reason:K.stderr.trim()||"unknown"}}var dQ=P(()=>{V$();C()});var sQ={};b(sQ,{loadLearnings:()=>C1,appendLearning:()=>x$,appendFromGateFailure:()=>QZ});import{existsSync as a7,readFileSync as s7}from"fs";import{join as oQ}from"path";import{createHash as t7}from"crypto";function nQ($){return oQ($,r7)}function i7($){if($===null||typeof $!=="object")return!1;let Q=$;return typeof Q.id==="string"&&typeof Q.timestamp==="string"&&typeof Q.iteration==="number"&&typeof Q.trigger==="string"&&typeof Q.rootCause==="string"&&typeof Q.fix==="string"&&typeof Q.preventInFuture==="string"&&typeof Q.evidence==="object"&&Q.evidence!==null}function aQ($){if(!a7($))return{version:1,learnings:[]};try{let Q=s7($,"utf-8"),Z=JSON.parse(Q);if(Z.version===1&&Array.isArray(Z.learnings))return{version:1,learnings:Z.learnings.filter(i7)}}catch{}return{version:1,learnings:[]}}function e7($,Q,Z){return t7("sha256").update(`${$} ${Q} ${Z??""}`).digest("hex").slice(0,16)}async function x$($,Q,Z={}){let z=e7(Q.trigger,Q.rootCause,Q.evidence.file),X=new Date().toISOString(),q={id:z,timestamp:X,...Q},K=nQ($);if(await $Q(K,()=>{j$(K,()=>{let V=aQ(K),H=V.learnings.findIndex((G)=>G.id===z);if(H>=0){let G=V.learnings[H];V.learnings[H]={...G,timestamp:X,iteration:q.iteration}}else V.learnings.push(q);P$(K,V)})}),Z.episodeBridge!==null&&(Z.episodeBridge!==void 0||process.env.LOKI_AUTO_LEARNINGS_EPISODE==="1")){let V=Z.episodeBridge??lQ,H=Z.bridgeFailureLog??$Z;try{let G=await V($,{taskId:`learning-${z}`,outcome:"failure",phase:"VERIFY",goal:`${Q.trigger}: ${Q.rootCause}`});if(G&&!G.stored){if(!new Set(["memory dir not initialized","stub"]).has(G.reason))H(`episode_bridge skipped: ${G.reason}`)}}catch(G){H(`episode_bridge threw: ${G.message}`)}}return q}function $Z($){process.stderr.write(`[learnings_writer] ${$}
`)}async function QZ($,Q,Z,z={}){let X=`[${Z.severity}] ${Z.description}`;return x$($,{iteration:Q,trigger:"gate_failure",rootCause:X,fix:"pending: dev agent must address in next iteration or supply counter-evidence",preventInFuture:"if this finding recurs, lower its severity threshold or add a regression test",evidence:{reviewId:Z.reviewId,file:Z.file??void 0,line:Z.line??void 0,severity:Z.severity,reviewer:Z.reviewer}},z)}function C1($){return aQ(nQ($))}var r7;var s$=P(()=>{F$();dQ();r7=oQ("state","relevant-learnings.json")});var rQ={};b(rQ,{runOverrideCouncil:()=>JZ,recordOverrideOutcome:()=>VZ,loadCounterEvidence:()=>qZ,canonicalFindingId:()=>t$,DEFAULT_OVERRIDE_JUDGES:()=>tQ});import{existsSync as ZZ,readFileSync as zZ}from"fs";import{join as XZ}from"path";function qZ($,Q){let Z=XZ($,"state",`counter-evidence-${Q}.json`);if(!ZZ(Z))return null;try{let z=zZ(Z,"utf-8"),X=JSON.parse(z);if(typeof X.iteration!=="number")return null;let q=Array.isArray(X.evidence)?X.evidence:[],K=[];for(let W of q){if(typeof W!=="object"||W===null)continue;let V=W;if(typeof V.findingId!=="string")continue;if(typeof V.claim!=="string")continue;let H=V.proofType;if(typeof H!=="string"||!KZ.has(H))continue;let G=H,Y=Array.isArray(V.artifacts)?V.artifacts:[];K.push({findingId:V.findingId,claim:V.claim,proofType:G,artifacts:Y.filter((U)=>typeof U==="string")})}return{iteration:X.iteration,evidence:K}}catch{return null}}async function JZ($,Q,Z,z={}){let X=z.judges??tQ,q=new Set,K=new Set,W={},V=new Map;for(let G of Q.evidence)V.set(G.findingId,G);let H=new Map;for(let G of $){let Y=t$(G);H.set(Y,(H.get(Y)??0)+1)}for(let G of $){let Y=t$(G);if((H.get(Y)??0)>1){K.add(Y);continue}let U=V.get(Y);if(!U){K.add(Y);continue}let B=await Promise.all(X.map((A)=>Z({finding:G,evidence:U,judge:A})));if(W[Y]=B,B.filter((A)=>A.verdict==="APPROVE_OVERRIDE").length>=2)q.add(Y);else K.add(Y)}return{approvedFindingIds:q,rejectedFindingIds:K,votes:W}}function t$($){let Q=$.raw.slice(0,80).replace(/\s+/g," ").trim();return`${$.reviewer}::${Q}`}async function VZ($,Q,Z,z,X={}){let q={episodeBridge:X.episodeBridge===void 0?null:X.episodeBridge};for(let K of z){let W=t$(K);if(Z.approvedFindingIds.has(W))await x$($,{iteration:Q,trigger:"override_approved",rootCause:`[${K.severity}] ${K.description}`,fix:"override council approved counter-evidence; finding lifted",preventInFuture:"if this reviewer/file pair recurs, narrow the reviewer's selector OR add a baseline doc",evidence:{findingId:W,reviewId:K.reviewId,file:K.file??void 0,line:K.line??void 0,severity:K.severity,reviewer:K.reviewer}},q);else if(Z.rejectedFindingIds.has(W))await x$($,{iteration:Q,trigger:"override_rejected",rootCause:`[${K.severity}] ${K.description}`,fix:"override council rejected -- dev agent must fix the finding",preventInFuture:"address this finding in the next iteration",evidence:{findingId:W,reviewId:K.reviewId,file:K.file??void 0,line:K.line??void 0,severity:K.severity,reviewer:K.reviewer}},q)}}var KZ,tQ;var iQ=P(()=>{s$();KZ=new Set(["file-exists","test-passes","grep-miss","reviewer-misread","duplicate-code-path","out-of-scope"]);tQ=["judge-primary","judge-secondary","judge-tertiary"]});var $8={};b($8,{writeEscalationHandoff:()=>OZ,renderHandoff:()=>eQ,readLatestHandoff:()=>AZ});import{existsSync as WZ,readdirSync as HZ,readFileSync as GZ}from"fs";import{join as r$}from"path";function UZ(){return new Date().toISOString()}function YZ($){let Q=$.file?` (${$.file}${$.line!==null?":"+$.line:""})`:"";return`  - [${$.severity}] ${$.description}${Q} -- ${$.reviewer}`}function BZ($){let Q=$.evidence,Z=Q.file?` ${Q.file}${Q.line!==void 0?":"+Q.line:""}`:"";return`  - **${$.trigger}** (iter ${$.iteration})${Z}: ${$.rootCause}`}function eQ($,Q,Z){let z=[];if(z.push(`# Loki escalation handoff -- ${UZ()}`),z.push(""),z.push(`Gate **${$.gateName}** has failed ${$.consecutiveFailures} consecutive times at iteration ${$.iteration}.`),z.push(""),z.push(`Reason: ${$.detail}`),z.push(""),Q.length>0){z.push(`## Outstanding findings (${Q.length})`),z.push("");for(let X of Q)z.push(YZ(X));z.push("")}else z.push("## Outstanding findings"),z.push(""),z.push("(no per-finding records captured -- gate failed without populating reviewer outputs)"),z.push("");if(Z.length>0){z.push(`## Recent learnings (${Math.min(Z.length,10)})`),z.push("");for(let X of Z.slice(-10))z.push(BZ(X));z.push("")}return z.push("## What the human must decide"),z.push(""),z.push("- Fix the finding? Address it in the code, then `rm .loki/PAUSE` to resume. A code_review BLOCK is NOT lifted by self-supplied counter-evidence -- the gated agent authors that file, so it cannot self-certify a trust-gate finding away."),z.push('- Override after your own review? You (the operator) are the escape path: review the finding and, if you accept it, `rm .loki/PAUSE` to resume. To direct the agent on resume, `echo "instructions" > .loki/HUMAN_INPUT.md` first.'),z.push("- Disable a gate? Set `LOKI_GATE_<NAME>=false` in env (see skills/quality-gates.md)."),z.push("- Tweak escalation? Set `LOKI_GATE_PAUSE_LIMIT` or `LOKI_GATE_ESCALATE_LIMIT`."),z.push("- Roll back? Switch to `LOKI_LEGACY_BASH=1` and re-run; the bash route does not consult this handoff doc."),z.push(""),z.push("To resume: fix the findings (or, after your own review, accept them), then `rm .loki/PAUSE`."),z.join(`
`)}function TZ($,Q){w1($,Q)}function OZ($,Q,Z={}){let z=Z.findings??S1($,Q.iteration).findings,X=Z.learnings??C1($).learnings,q=eQ(Q,z,X),K=(Z.now?.()??new Date).toISOString().replace(/[-:.]/g,""),W=r$($,"escalations"),V=++MZ,H=r$(W,`handoff-${K}-${process.pid}-${V}-${Q.gateName}.md`);return TZ(H,q),{path:H,bytes:q.length}}function AZ($){let Q=r$($,"escalations");if(!WZ(Q))return null;let Z;try{Z=HZ(Q).filter((q)=>q.endsWith(".md"))}catch{return null}if(Z.length===0)return null;Z.sort();let z=Z[Z.length-1];if(!z)return null;let X=r$(Q,z);try{return{path:X,body:GZ(X,"utf-8")}}catch{return null}}var MZ=0;var Q8=P(()=>{F$();a$();s$()});var z8={};b(z8,{runInternalPhase1Hooks:()=>jZ,_resolveForTests:()=>PZ,_internalPhase1HooksHelp:()=>xZ,__testAppendHook:()=>Z8});import{existsSync as wZ,mkdirSync as _Z,readdirSync as IZ,statSync as LZ}from"fs";import{join as E$,resolve as PZ}from"path";async function jZ($){let[Q,...Z]=$;switch(Q){case void 0:case"help":case"--help":case"-h":return process.stdout.write(b1),Q===void 0?1:0;case"reflect":return FZ(Z);case"override":return RZ(Z);case"handoff":return kZ(Z);default:return process.stderr.write(`Unknown subcommand: ${Q}
`),process.stderr.write(b1),2}}async function FZ($){let Q=h1($[0]);if(Q===null)return process.stderr.write(`reflect: missing or invalid <iter>
`),2;let Z=j();try{let X=(await Promise.resolve().then(() => (a$(),D1))).loadPreviousFindings(Z,Q);if(X.findings.length===0)return process.stdout.write(`reflect: no findings for iter ${Q} (nothing to do)
`),0;let q=E$(Z,"state");_Z(q,{recursive:!0}),P$(E$(q,`findings-${Q}.json`),{review_id:X.reviewId,iteration:Q,findings:X.findings});let K=await Promise.resolve().then(() => (s$(),sQ)),W=0,V=0;if(process.env.LOKI_AUTO_LEARNINGS!=="0"){let G=X.findings.filter((U)=>U.severity==="Critical"||U.severity==="High"),Y=Z8.fn??K.appendFromGateFailure;for(let U of G)try{await Y(Z,Q,U,{episodeBridge:null}),W+=1}catch(B){V+=1,process.stderr.write(`reflect: learning append failed for finding ${U.reviewer}/${U.severity}: ${B.message}
`)}if(V>0&&W===0)return process.stderr.write(`reflect: all ${V} learning appends failed (iter ${Q})
`),1}let H=V>0?` (${V} failed)`:"";return process.stdout.write(`reflect: persisted ${X.findings.length} findings + ${W} learnings${H} (iter ${Q})
`),0}catch(z){return process.stderr.write(`reflect: ${z.message}
`),1}}async function RZ($){let Q=h1($[0]);if(Q===null)return process.stderr.write(`override: missing or invalid <iter>
`),2;let Z=j();try{let z=await Promise.resolve().then(() => (iQ(),rQ)),X=z.loadCounterEvidence(Z,Q);if(X===null||X.evidence.length===0)return process.stdout.write(`override: no counter-evidence for iter ${Q} (skip)
`),0;let K=(await Promise.resolve().then(() => (a$(),D1))).loadPreviousFindings(Z,Q),W=K.findings.filter((T)=>T.severity==="Critical"||T.severity==="High");if(W.length===0)return process.stdout.write(`override: no blocking findings for iter ${Q} (skip)
`),0;let V=async(T)=>{return{judge:T.judge,verdict:"REJECT_OVERRIDE",reasoning:`[stub] proofType=${T.evidence.proofType}: self-supplied counter-evidence cannot lift a trust-gate BLOCK on the agent-authored route. Fix the finding, or use the human-escape path (rm .loki/PAUSE; optionally .loki/HUMAN_INPUT.md). The only adjudicated override is the Bun-route real-LLM judge.`}},H=await z.runOverrideCouncil(W,X,V);await z.recordOverrideOutcome(Z,Q,H,W);let G=E$(Z,"quality","reviews");if(wZ(G))try{let T=IZ(G).filter((I)=>I.startsWith("review-")).sort(),A=T[T.length-1];if(A&&LZ(E$(G,A)).isDirectory())P$(E$(G,A,`override-${Q}.json`),{review_id:K.reviewId,iteration:Q,approved_finding_ids:Array.from(H.approvedFindingIds),rejected_finding_ids:Array.from(H.rejectedFindingIds),votes:H.votes})}catch{}let Y=H.approvedFindingIds.size,U=H.rejectedFindingIds.size;if(U===0&&Y>0)process.stdout.write(`override: LIFTED -- ${Y} approved, ${U} rejected
`);else process.stdout.write(`override: BLOCKED -- ${Y} approved, ${U} rejected
`);return 0}catch(z){return process.stderr.write(`override: ${z.message}
`),1}}async function kZ($){let Q=$[0],Z=Number.parseInt($[1]??"0",10),z=h1($[2]);if(!Q||!Number.isFinite(Z)||z===null)return process.stderr.write(`handoff: usage: handoff <gate> <consecutive-failures> <iter>
`),2;let X=j();try{let K=(await Promise.resolve().then(() => (Q8(),$8))).writeEscalationHandoff(X,{gateName:Q,iteration:z,consecutiveFailures:Z,detail:`${Q} hit PAUSE_LIMIT (${Z} consecutive failures)`});return process.stdout.write(`handoff: wrote ${K.path} (${K.bytes}B)
`),0}catch(q){return process.stderr.write(`handoff: ${q.message}
`),1}}function h1($){if($===void 0)return null;let Q=Number.parseInt($,10);return Number.isFinite(Q)&&Q>=0?Q:null}var Z8,b1=`loki internal phase1-hooks <subcommand>

Subcommands:
  reflect <iter>                    Persist structured findings + auto-learnings.
  override <iter>                   Run override council if counter-evidence present.
  handoff <gate> <count> <iter>     Write structured handoff doc before PAUSE.

This command is invoked by autonomy/run.sh between iterations. Users
should not run it directly -- run \`loki start\` instead.
`,xZ;var X8=P(()=>{C();F$();Z8={fn:null};xZ=b1});Q1();C();import{mkdirSync as T8,readFileSync as O8,writeFileSync as A8}from"fs";import{dirname as w8,resolve as _8}from"path";var I8="https://registry.npmjs.org/loki-mode/latest",L8=86400000,P8=1500;function j8(){return _8(T$(),"cache","update-check.json")}function O$($){let Q=/^(\d+)\.(\d+)\.(\d+)$/.exec($.trim());if(!Q)return null;return[Number(Q[1]),Number(Q[2]),Number(Q[3])]}function F8($,Q){let Z=O$($),z=O$(Q);if(!Z||!z)return!1;let[X,q,K]=Z,[W,V,H]=z;if(X!==W)return X>W;if(q!==V)return q>V;return K>H}function R8(){if(process.env.LOKI_NO_UPDATE_CHECK==="1")return!0;if(process.env.CI)return!0;if(!process.stdout.isTTY)return!0;return!1}function k8($){try{let Q=O8($,"utf-8"),Z=JSON.parse(Q);if(typeof Z.checkedAt==="number"&&typeof Z.latest==="string"&&O$(Z.latest)!==null)return{checkedAt:Z.checkedAt,latest:Z.latest}}catch{}return null}function x8($,Q){try{T8(w8($),{recursive:!0}),A8($,JSON.stringify(Q),"utf-8")}catch{}}async function E8(){try{let $=await fetch(I8,{signal:AbortSignal.timeout(P8),headers:{accept:"application/json"}});if(!$.ok)return null;let Q=await $.json();if(typeof Q.version==="string"&&O$(Q.version)!==null)return Q.version}catch{}return null}async function N8($=Date.now(),Q=E8,Z=j8()){let z=k8(Z);if(z&&$-z.checkedAt<L8)return z.latest;let X=await Q();if(X===null)return null;return x8(Z,{checkedAt:$,latest:X}),X}async function g1($,Q={}){try{if(R8())return;if(O$($)===null)return;let Z=await N8(Q.now,Q.fetcher,Q.cacheFile);if(Z===null)return;if(!F8(Z,$))return;(Q.write??((X)=>process.stderr.write(X)))(`A newer Loki Mode is available: ${Z} (you have ${$}). Update: bun install -g loki-mode  (or npm i -g loki-mode)
`)}catch{}}async function f1(){let $=S$();return process.stdout.write(`Loki Mode v${$}
`),await g1($),0}o();p();C();import{readFileSync as h8,existsSync as y8}from"fs";import{resolve as v8}from"path";var m8=["claude","codex","cline","aider"];function l1(){let $=v8(j(),"state","provider");if(!y8($))return"";try{return h8($,"utf-8").trim()}catch{return""}}function g8($,Q){return $||Q||process.env.LOKI_PROVIDER||"claude"}function f8($){let Q=l1(),Z=g8($,Q);switch(process.stdout.write(`${k}Current Provider${J}
`),process.stdout.write(`
`),process.stdout.write(`${L}Provider:${J} ${Z}
`),Z){case"claude":process.stdout.write(`${S}Status:${J}   Full features (subagents, parallel, MCP)
`);break;case"cline":process.stdout.write(`${S}Status:${J}   Near-full mode (subagents, MCP, 12+ providers)
`);break;case"codex":case"aider":process.stdout.write(`${_}Status:${J}   Degraded mode (sequential only)
`);break;default:break}if(Q)process.stdout.write(`${y}(saved in .loki/state/provider)${J}
`);else process.stdout.write(`${y}(default - not explicitly set)${J}
`);return process.stdout.write(`
`),process.stdout.write(`Switch provider: ${L}loki provider set <name>${J}
`),process.stdout.write(`Available:       ${L}loki provider list${J}
`),0}async function u8(){let Q=l1()||process.env.LOKI_PROVIDER||"claude";process.stdout.write(`${k}Available Providers${J}
`),process.stdout.write(`
`);let Z=await Promise.all(m8.map(async(q)=>[q,await u(q)!==null])),z=new Map;for(let[q,K]of Z)z.set(q,K?`${S}installed${J}`:`${M}not installed${J}`);let X=[["claude","claude  - Claude Code (Anthropic)    "],["codex","codex   - Codex CLI (OpenAI)         "],["cline","cline   - Cline (multi-provider)     "],["aider","aider   - Aider (terminal pair prog) "]];for(let[q,K]of X){let W=Q===q?` ${L}(current)${J}`:"";process.stdout.write(`  ${K} ${z.get(q)}${W}
`)}return process.stdout.write(`
`),process.stdout.write(`Set provider: ${L}loki provider set <name>${J}
`),0}function c8(){return process.stdout.write(`${k}Loki Mode Provider Management${J}
`),process.stdout.write(`
`),process.stdout.write(`Usage: loki provider <command>
`),process.stdout.write(`
`),process.stdout.write(`Commands:
`),process.stdout.write(`  show     Show current provider (default)
`),process.stdout.write(`  set      Set provider for this project
`),process.stdout.write(`  list     List available providers
`),process.stdout.write(`  info     Show provider details
`),process.stdout.write(`  models   Show resolved model configuration for all providers
`),process.stdout.write(`
`),process.stdout.write(`Examples:
`),process.stdout.write(`  loki provider show
`),process.stdout.write(`  loki provider set claude
`),process.stdout.write(`  loki provider set codex
`),process.stdout.write(`  loki provider list
`),process.stdout.write(`  loki provider info codex
`),process.stdout.write(`  loki provider models
`),0}async function d1($){let Q=$[0]??"show",Z=$.slice(1);switch(Q){case"show":case"current":return f8(Z[0]);case"list":return u8();case"set":case"info":case"models":return p8(["provider",Q,...Z]);default:return c8()}}async function p8($){let{run:Q}=await Promise.resolve().then(() => (o(),p1)),{resolve:Z}=await import("path"),{REPO_ROOT:z}=await Promise.resolve().then(() => (C(),m1)),X=Z(z,"autonomy","loki"),q=await Q([X,...$],{env:{LOKI_LEGACY_BASH:"1"},timeoutMs:3600000});return process.stdout.write(q.stdout),process.stderr.write(q.stderr),q.exitCode}p();C();V$();import{existsSync as o1,readFileSync as d8}from"fs";import{resolve as W$}from"path";import{mkdir as o8}from"fs/promises";var w$=W$(T$(),"learnings");function z1($){if(!o1($))return 0;try{let Q=d8($,"utf-8"),Z=0;for(let z of Q.split(`
`))if(z.includes('"description"'))Z++;return Z}catch{return 0}}async function n8(){await o8(w$,{recursive:!0});let $=z1(W$(w$,"patterns.jsonl")),Q=z1(W$(w$,"mistakes.jsonl")),Z=z1(W$(w$,"successes.jsonl"));return process.stdout.write(`${k}Cross-Project Learnings${J}
`),process.stdout.write(`
`),process.stdout.write(`  Patterns:  ${S}${$}${J}
`),process.stdout.write(`  Mistakes:  ${_}${Q}${J}
`),process.stdout.write(`  Successes: ${L}${Z}${J}
`),process.stdout.write(`
`),process.stdout.write(`Location: ${w$}
`),process.stdout.write(`
`),process.stdout.write(`Use 'loki memory show <type>' to view entries
`),0}async function a8($){if($){let z=`
try:
    from memory.layers import IndexLayer
    layer = IndexLayer('.loki/memory')
    layer.update([])
    print('Index rebuilt')
except ImportError:
    print('Error: memory.layers module not found')
except Exception as e:
    print(f'Error: {e}')
`.trim(),X=await z$(z,{cwd:h});return process.stdout.write(X.stdout),0}let Q=W$(j(),"memory","index.json");if(!o1(Q))return process.stdout.write(`No index found
`),0;let Z=await z$(`import json, sys; sys.stdout.write(json.dumps(json.load(open(${JSON.stringify(Q)})), indent=4) + "\\n")`);if(Z.exitCode!==0)return process.stdout.write(`No index found
`),0;return process.stdout.write(Z.stdout),0}async function n1($){switch($[0]??"list"){case"list":case"ls":return n8();case"index":return a8($[1]==="rebuild");default:{let Z=W$(h,"autonomy","loki"),z=3600000,X=Bun.spawn({cmd:[Z,"memory",...$],stdin:"inherit",stdout:"inherit",stderr:"inherit",env:{...process.env,LOKI_LEGACY_BASH:"1"}}),q=setTimeout(()=>{try{X.kill("SIGKILL")}catch{}},3600000);try{return await X.exited}finally{clearTimeout(q)}}}}C();V$();o();import{resolve as s8,join as t8}from"path";import{existsSync as X1,readFileSync as r8}from"fs";import{homedir as i8}from"os";import{spawnSync as r1}from"child_process";var i1=3000;function e8(){let $=(process.env.LOKI_TELEMETRY??"").toLowerCase();if($==="off")return!1;if(process.env.LOKI_TELEMETRY_DISABLED==="true")return!1;if(process.env.DO_NOT_TRACK==="1")return!1;let Q=!1,Z=!1;try{let z=t8(i8(),".loki","config");if(X1(z)){let X=r8(z,"utf8");for(let q of X.split(`
`)){let K=q.replace(/\r$/,"");if(K==="TELEMETRY_DISABLED=true")Q=!0;if(K==="TELEMETRY_ENABLED=true")Z=!0}}}catch{}if(Q)return!1;if($==="on"||Z)return!0;return!1}var D$=!1;function $3(){return s8(h,"autonomy","lib","crash_capture.py")}function Q3($,Q){let Z=[$,"--error-class",Q.errorClass,"--message",Q.message];if(Q.stack!==void 0)Z.push("--stack",Q.stack);if(Q.rarvPhase!==void 0)Z.push("--rarv-phase",Q.rarvPhase);if(Q.exitCode!==void 0)Z.push("--exit-code",String(Q.exitCode));if(Q.frictionKind!==void 0)Z.push("--friction-kind",Q.frictionKind);return Z.push("--target-dir",Q.targetDir??process.cwd()),Z}function Z3(){if(X1("/opt/homebrew/bin/python3.12"))return"/opt/homebrew/bin/python3.12";for(let Q of["python3.12","python3"])try{let Z=r1("sh",["-c",`command -v ${Q}`],{timeout:i1,encoding:"utf8"});if(Z.status===0){let z=(Z.stdout||"").trim();if(z)return z}}catch{}return null}function a1($){try{if(!e8())return;let Q=$3();if(!X1(Q))return;let Z=Z3();if(!Z)return;let z=Q3(Q,$);r1(Z,z,{timeout:i1,stdio:"ignore"})}catch{}}function s1($,Q){if($ instanceof Error){let z={errorClass:$.name&&$.name.length>0?$.name:Q,message:$.message};if($.stack)z.stack=$.stack;return z}return{errorClass:Q,message:String($)}}var t1=!1;function e1(){if(t1)return;t1=!0,process.on("uncaughtException",($)=>{if(!D$){D$=!0;let Q=s1($,"UncaughtException");a1({errorClass:Q.errorClass,message:Q.message,...Q.stack!==void 0?{stack:Q.stack}:{},exitCode:1})}try{process.stderr.write(`${$&&$.stack||String($)}
`)}catch{}process.exit(1)}),process.on("unhandledRejection",($)=>{if(!D$){D$=!0;let Q=s1($,"UnhandledRejection");a1({errorClass:Q.errorClass,message:Q.message,...Q.stack!==void 0?{stack:Q.stack}:{},exitCode:1})}try{let Q=$ instanceof Error?$.stack||$.message:String($);process.stderr.write(`Unhandled promise rejection: ${Q}
`)}catch{}process.exit(1)})}var K8=`Loki Mode (TypeScript port, Phase 2 of bash->Bun migration)

Usage: loki <command> [args...]

Phase 2 ported (Bun-native, fast):
  version                Print Loki Mode version
  status [--json]        Show current orchestrator status
  stats [--json] [--efficiency]   Session statistics
  provider show [name]   Show current provider
  provider list          List available providers and install status
  memory list            Cross-project learnings counts
  memory index [rebuild] Show or rebuild memory index
  doctor [--json]        System prerequisites health check
  rollback <subcmd>      Restore .loki/ state from a checkpoint
                         (subcmds: list | show <id> | to <id> | latest)
  proof <subcmd>         Inspect/share proof-of-run artifacts
                         (subcmds: list | show <id> | open <id> | share <id>)
  wiki <subcmd>          Auto-generated, cited codebase wiki + Q&A
                         (subcmds: generate | show [section] | ask "<question>")

All other commands fall through to the bash CLI (autonomy/loki).
Set LOKI_LEGACY_BASH=1 to force the bash CLI for every command.
`;function EZ(){let $=process.env.LOKI_LEGACY_BASH;if($===void 0)return;let Q=$.trim().toLowerCase();if(Q!=="1"&&Q!=="true"&&Q!=="yes"&&Q!=="on")return;if(process.env.LOKI_SUPPRESS_BUN_DIRECT_WARN==="1")return;process.stderr.write(`warning: LOKI_LEGACY_BASH is set, but you are running the Bun runtime directly (src/cli.ts). The env var only takes effect via the bin/loki shim, which dispatches between Bun and bash. Behavior is unchanged; this message is informational.
`)}async function NZ($){EZ();let Q=$[0],Z=$.slice(1);switch(Q){case void 0:case"help":case"--help":case"-h":return process.stdout.write(K8),0;case"version":case"--version":case"-v":return await f1();case"provider":return d1(Z);case"memory":return n1(Z);case"status":{let{runStatus:z}=await Promise.resolve().then(() => (W0(),V0));return z(Z)}case"stats":{let{runStats:z}=await Promise.resolve().then(() => (T0(),M0));return z(Z)}case"doctor":{let{runDoctor:z}=await Promise.resolve().then(() => (R0(),F0));return z(Z)}case"kpis":{let{runKpis:z}=await Promise.resolve().then(() => (T1(),M1));return z(Z,{aliasOf:"kpis"})}case"report":{if(Z.find((q)=>!q.startsWith("-"))==="kpis"){let{runKpis:q}=await Promise.resolve().then(() => (T1(),M1)),K=!1,W=Z.filter((V)=>{if(!K&&V==="kpis")return K=!0,!1;return!0});return q(W)}let{delegateToBash:X}=await Promise.resolve().then(() => (g0(),m0));return X(["report",...Z])}case"trust":{let{runTrust:z}=await Promise.resolve().then(() => (a0(),n0));return z(Z)}case"rollback":{let{runRollback:z}=await Promise.resolve().then(() => (_Q(),wQ));return z(Z)}case"proof":case"receipt":{let{runProof:z}=await Promise.resolve().then(() => (RQ(),FQ));return z(Z)}case"crash":{let{runCrash:z}=await Promise.resolve().then(() => (CQ(),DQ));return z(Z)}case"wiki":{let{runWiki:z}=await Promise.resolve().then(() => (mQ(),vQ));return z(Z)}case"internal":{let z=Z[0];if(!z||z==="--help"||z==="-h"||z==="help"){let q=["loki internal -- runtime hooks driven by autonomy/run.sh","","Subcommands:","  phase1-hooks    Persist structured findings, run override council,","                  append learnings, and write the escalation handoff","                  doc once per iteration. Driven by run.sh; not","                  intended for direct invocation.","","Phase 1 (RARV-C closure) env vars:","  LOKI_INJECT_FINDINGS=1   Persist structured reviewer findings to","                           .loki/state/findings-<iter>.json so the","                           next iteration can address them.","  LOKI_OVERRIDE_COUNCIL=1  Allow a 3-LLM override panel to lift a","                           BLOCK when counter-evidence is presented.","                           See LOKI_OVERRIDE_JUDGES (csv),","                           LOKI_OVERRIDE_PANEL_SIZE,","                           LOKI_OVERRIDE_REAL_JUDGE.","  LOKI_AUTO_LEARNINGS      Append failure rootcauses to","                           .loki/state/relevant-learnings.json so the","                           next iteration avoids repeats. DEFAULT ON;","                           set =0 to disable. Episodic-memory mirror is","                           opt-in via LOKI_AUTO_LEARNINGS_EPISODE=1.","  LOKI_HANDOFF_MD=1        Write a structured human handoff doc to","                           .loki/escalations/<ts>.md before PAUSE.","","All four are default-on as of v7.5.3. Set to 0 to disable.","Reference: CHANGELOG.md (search 'Phase 1') and skills/healing.md.","","These commands are wired into the autonomous loop and may change","without notice. Do not script against them.",""].join(`
`);return process.stdout.write(`${q}
`),0}if(z==="phase1-hooks"){let{runInternalPhase1Hooks:q}=await Promise.resolve().then(() => (X8(),z8));return q(Z.slice(1))}return process.stderr.write(`Unknown internal subcommand: ${z}
`),process.stderr.write(`Run 'loki internal --help' for the supported list.
`),2}default:return process.stderr.write(`Unknown command: ${Q}
`),process.stderr.write(K8),2}}e1();process.on("SIGINT",()=>process.exit(130));process.on("SIGTERM",()=>process.exit(143));var SZ=await NZ(Bun.argv.slice(2));process.exit(SZ);

//# debugId=01C7E7999085D66D64756E2164756E21
