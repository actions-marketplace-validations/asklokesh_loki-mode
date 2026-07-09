// State -> self-contained SVG builder for the `loki cockpit` frame.
//
// Renders the approved Autonomi cockpit: a header with the real Autonomi mark
// (purple squircle + white "A" + teal dot), a primary run panel (iteration /
// phase / tier / provider / verdict / budget / freshness), a gate strip, a
// council-vote strip, and a compact multi-repo fleet list.
//
// The SVG is fully self-contained (no external fonts/images): the logo is
// inline vector, fonts fall back through the system stack, all colors are the
// verified Autonomi palette. Text is XML-escaped so arbitrary run/repo names
// cannot break the markup.

export type Verdict = "verified" | "working" | "failed" | "pending" | "unknown";
export type GateStatus = "pass" | "fail" | "skip" | "pending";
export type CouncilVote = "approve" | "concern" | "reject" | "pending";

export interface Gate {
  name: string;
  status: GateStatus;
}

export interface Council {
  reviewer: string;
  vote: CouncilVote;
}

export interface RepoRun {
  name: string;
  phase?: string;
  iteration?: number;
  status?: string; // running | stopped | ...
  running?: boolean;
}

export interface CockpitState {
  run: string; // focused run / project name
  iteration: number;
  phase: string;
  tier: string; // opus | sonnet | haiku
  provider: string; // claude | codex | ...
  verdict: Verdict;
  budgetUsd: number;
  budgetLimitUsd?: number;
  freshness?: string; // e.g. "fresh", "3m ago"
  gates: Gate[];
  council: Council[];
  fleet: RepoRun[];
}

// ---- Autonomi identity (verified against ~/git/autonomi-website) ----------
const ACCENT = "#553de9"; // brand purple (light)
const TEAL = "#1FC5A8"; // teal dot
const INK = "#201515";
const GROUND = "#f1f2f6"; // light-grey ground (default)
const CARD = "#ffffff";
const MUTED = "#6b6675";
const HAIRLINE = "#e2e0e8";
const VERIFIED = "#1f8a52";
const WARNING = "#9a6a12";
const FAILED = "#b23a3a";
const WHITE_A = "#FFFEFB";

const FONT_DISPLAY = "'Fraunces','Georgia',serif";
const FONT_BODY = "'Inter','Helvetica Neue',Arial,sans-serif";
const FONT_MONO = "'JetBrains Mono','SF Mono',ui-monospace,monospace";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// The Autonomi mark, drawn at a given top-left with a given size (px). Uses the
// verified 512-viewBox geometry scaled to `size`. Renders as its own <g>.
function logoMark(x: number, y: number, size: number): string {
  const s = size / 512;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect x="0" y="0" width="512" height="512" rx="118" fill="${ACCENT}"/>
    <path d="M152 405 L242 120" stroke="${WHITE_A}" stroke-width="28" stroke-linecap="round" fill="none"/>
    <path d="M360 405 L270 120" stroke="${WHITE_A}" stroke-width="28" stroke-linecap="round" fill="none"/>
    <path d="M242 120 Q256 86 270 120" stroke="${WHITE_A}" stroke-width="28" stroke-linecap="round" fill="none"/>
    <circle cx="256" cy="295" r="20" fill="${TEAL}"/>
  </g>`;
}

function verdictColor(v: Verdict): string {
  switch (v) {
    case "verified":
      return VERIFIED;
    case "failed":
      return FAILED;
    case "working":
    case "pending":
      return WARNING;
    default:
      return MUTED;
  }
}

function gateColor(s: GateStatus): string {
  switch (s) {
    case "pass":
      return VERIFIED;
    case "fail":
      return FAILED;
    case "pending":
      return WARNING;
    default:
      return MUTED; // skip
  }
}

function voteColor(v: CouncilVote): string {
  switch (v) {
    case "approve":
      return VERIFIED;
    case "reject":
      return FAILED;
    case "concern":
      return WARNING;
    default:
      return MUTED;
  }
}

// A small labeled stat block.
function statBlock(x: number, y: number, label: string, value: string, valueColor = INK): string {
  return `<text x="${x}" y="${y}" font-family="${FONT_BODY}" font-size="12" fill="${MUTED}" letter-spacing="0.5">${esc(label.toUpperCase())}</text>
    <text x="${x}" y="${y + 24}" font-family="${FONT_MONO}" font-size="20" font-weight="600" fill="${valueColor}">${esc(value)}</text>`;
}

export function buildSvg(state: CockpitState): string {
  const W = 900;
  const H = 560;
  const PAD = 32;

  const budgetStr =
    state.budgetLimitUsd && state.budgetLimitUsd > 0
      ? `$${state.budgetUsd.toFixed(2)} / $${state.budgetLimitUsd.toFixed(2)}`
      : `$${state.budgetUsd.toFixed(2)}`;

  // Header
  let body = "";
  body += logoMark(PAD, PAD, 44);
  body += `<text x="${PAD + 60}" y="${PAD + 22}" font-family="${FONT_DISPLAY}" font-size="24" font-weight="600" fill="${INK}">Autonomi</text>`;
  body += `<text x="${PAD + 60}" y="${PAD + 42}" font-family="${FONT_BODY}" font-size="13" fill="${MUTED}">Loki Cockpit</text>`;
  const fresh = state.freshness ? `updated ${state.freshness}` : "live";
  body += `<text x="${W - PAD}" y="${PAD + 22}" text-anchor="end" font-family="${FONT_MONO}" font-size="12" fill="${MUTED}">${esc(fresh)}</text>`;
  body += `<text x="${W - PAD}" y="${PAD + 42}" text-anchor="end" font-family="${FONT_MONO}" font-size="13" fill="${verdictColor(state.verdict)}" font-weight="600">${esc(state.verdict.toUpperCase())}</text>`;

  // Primary run card
  const cardY = PAD + 64;
  const cardH = 168;
  body += `<rect x="${PAD}" y="${cardY}" width="${W - 2 * PAD}" height="${cardH}" rx="16" fill="${CARD}" stroke="${HAIRLINE}"/>`;
  body += `<text x="${PAD + 24}" y="${cardY + 34}" font-family="${FONT_DISPLAY}" font-size="20" font-weight="600" fill="${INK}">${esc(state.run)}</text>`;
  body += `<text x="${PAD + 24}" y="${cardY + 54}" font-family="${FONT_BODY}" font-size="13" fill="${MUTED}">phase ${esc(state.phase)}</text>`;

  const row1 = cardY + 96;
  const col = (n: number) => PAD + 24 + n * 168;
  body += statBlock(col(0), row1, "iteration", String(state.iteration));
  body += statBlock(col(1), row1, "tier", state.tier);
  body += statBlock(col(2), row1, "provider", state.provider);
  body += statBlock(col(3), row1, "budget", budgetStr);
  body += statBlock(col(4), row1, "phase", state.phase, ACCENT);

  // Gate strip
  const gateY = cardY + cardH + 40;
  body += `<text x="${PAD}" y="${gateY}" font-family="${FONT_BODY}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="0.5">QUALITY GATES</text>`;
  let gx = PAD;
  const gsy = gateY + 16;
  const gates = state.gates.length ? state.gates : [{ name: "no gates yet", status: "pending" as GateStatus }];
  for (const g of gates) {
    const label = esc(g.name);
    const wpx = Math.max(74, 14 + label.length * 7);
    const c = gateColor(g.status);
    body += `<rect x="${gx}" y="${gsy}" width="${wpx}" height="30" rx="8" fill="${CARD}" stroke="${c}"/>`;
    body += `<circle cx="${gx + 14}" cy="${gsy + 15}" r="4" fill="${c}"/>`;
    body += `<text x="${gx + 24}" y="${gsy + 19}" font-family="${FONT_MONO}" font-size="12" fill="${INK}">${label}</text>`;
    gx += wpx + 10;
    if (gx > W - PAD - 90) break; // don't overflow the frame
  }

  // Council strip
  const councilY = gsy + 62;
  body += `<text x="${PAD}" y="${councilY}" font-family="${FONT_BODY}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="0.5">COUNCIL</text>`;
  let cx = PAD;
  const csy = councilY + 16;
  const council = state.council.length ? state.council : [{ reviewer: "pending", vote: "pending" as CouncilVote }];
  for (const cv of council) {
    const label = `${esc(cv.reviewer)}: ${esc(cv.vote)}`;
    const wpx = Math.max(90, 14 + label.length * 7);
    const c = voteColor(cv.vote);
    body += `<rect x="${cx}" y="${csy}" width="${wpx}" height="30" rx="8" fill="${c}" fill-opacity="0.12" stroke="${c}"/>`;
    body += `<text x="${cx + 12}" y="${csy + 19}" font-family="${FONT_MONO}" font-size="12" fill="${INK}">${label}</text>`;
    cx += wpx + 10;
    if (cx > W - PAD - 100) break;
  }

  // Fleet list
  const fleetY = csy + 62;
  body += `<text x="${PAD}" y="${fleetY}" font-family="${FONT_BODY}" font-size="13" font-weight="600" fill="${MUTED}" letter-spacing="0.5">FLEET (${state.fleet.length})</text>`;
  let fy = fleetY + 20;
  const shown = state.fleet.slice(0, 4);
  for (const r of shown) {
    const dot = r.running ? VERIFIED : MUTED;
    body += `<circle cx="${PAD + 6}" cy="${fy - 4}" r="5" fill="${dot}"/>`;
    body += `<text x="${PAD + 20}" y="${fy}" font-family="${FONT_MONO}" font-size="13" fill="${INK}">${esc(r.name)}</text>`;
    const meta = `iter ${r.iteration ?? 0}  ${esc(r.phase || r.status || "")}`;
    body += `<text x="${W - PAD}" y="${fy}" text-anchor="end" font-family="${FONT_MONO}" font-size="12" fill="${MUTED}">${meta}</text>`;
    fy += 26;
  }
  if (state.fleet.length > shown.length) {
    body += `<text x="${PAD + 20}" y="${fy}" font-family="${FONT_BODY}" font-size="12" fill="${MUTED}">+ ${state.fleet.length - shown.length} more</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${GROUND}"/>
  ${body}
</svg>`;
}
