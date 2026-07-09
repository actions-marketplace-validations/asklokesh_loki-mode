import { describe, expect, it } from "bun:test";
import { detectProtocol } from "../src/cockpit/capability.ts";
import { encodeIterm2, encodeKitty } from "../src/cockpit/encode.ts";
import { buildSvg, type CockpitState } from "../src/cockpit/svg.ts";
import { render } from "../src/cockpit/render.ts";

const ESC = "\x1b";
const BEL = "\x07";

// A tiny valid-ish PNG byte blob (content does not matter for encoding shape).
const TINY_PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);

const SAMPLE: CockpitState = {
  run: "autonomi-saas",
  iteration: 7,
  phase: "implementation",
  tier: "opus",
  provider: "claude",
  verdict: "working",
  budgetUsd: 3.42,
  budgetLimitUsd: 20,
  freshness: "3s ago",
  gates: [
    { name: "build", status: "pass" },
    { name: "tests", status: "fail" },
    { name: "static", status: "pass" },
  ],
  council: [
    { reviewer: "opus-a", vote: "approve" },
    { reviewer: "opus-b", vote: "concern" },
  ],
  fleet: [
    { name: "autonomi-saas", phase: "impl", iteration: 7, running: true },
    { name: "loki-mode", phase: "review", iteration: 12, running: false },
  ],
};

describe("cockpit encode", () => {
  it("iTerm2 sequence has the right byte shape", () => {
    const out = encodeIterm2(TINY_PNG);
    expect(out.startsWith(`${ESC}]1337;File=inline=1`)).toBe(true);
    expect(out).toContain(`size=${TINY_PNG.length}`);
    expect(out).toContain("width=auto");
    expect(out).toContain(":"); // separator before base64
    expect(out.endsWith(BEL)).toBe(true);
    // base64 payload present
    expect(out).toContain(Buffer.from(TINY_PNG).toString("base64"));
  });

  it("Kitty sequence has the right byte shape", () => {
    const out = encodeKitty(TINY_PNG);
    expect(out.startsWith(`${ESC}_G`)).toBe(true);
    expect(out).toContain("a=T,f=100");
    expect(out.endsWith(`${ESC}\\`)).toBe(true);
    expect(out).toContain(Buffer.from(TINY_PNG).toString("base64"));
  });

  it("Kitty chunks large payloads with m=1 continuations and m=0 terminator", () => {
    const big = new Uint8Array(9000).fill(65);
    const out = encodeKitty(big, 4096);
    // first chunk declares the transfer and is "more"
    expect(out).toContain("a=T,f=100,m=1");
    // last chunk closes it
    expect(out).toContain("m=0");
    // multiple APC blocks
    const blocks = out.split(`${ESC}_G`).length - 1;
    expect(blocks).toBeGreaterThan(1);
  });
});

describe("cockpit capability detection", () => {
  it("iTerm.app -> iterm2", () => {
    expect(detectProtocol({ TERM_PROGRAM: "iTerm.app" })).toBe("iterm2");
  });
  it("WezTerm and ghostty -> iterm2", () => {
    expect(detectProtocol({ TERM_PROGRAM: "WezTerm" })).toBe("iterm2");
    expect(detectProtocol({ TERM_PROGRAM: "ghostty" })).toBe("iterm2");
  });
  it("KITTY_WINDOW_ID set -> kitty", () => {
    expect(detectProtocol({ KITTY_WINDOW_ID: "3" })).toBe("kitty");
  });
  it("TERM=xterm-kitty -> kitty", () => {
    expect(detectProtocol({ TERM: "xterm-kitty" })).toBe("kitty");
  });
  it("TERM=dumb / unset -> none", () => {
    expect(detectProtocol({ TERM: "dumb" })).toBe("none");
    expect(detectProtocol({})).toBe("none");
  });
  it("LOKI_COCKPIT_PROTOCOL override wins over sniffing", () => {
    expect(detectProtocol({ TERM_PROGRAM: "iTerm.app", LOKI_COCKPIT_PROTOCOL: "kitty" })).toBe("kitty");
    expect(detectProtocol({ KITTY_WINDOW_ID: "3", LOKI_COCKPIT_PROTOCOL: "none" })).toBe("none");
  });
});

describe("cockpit SVG builder", () => {
  it("returns well-formed SVG with Autonomi identity and content", () => {
    const svg = buildSvg(SAMPLE);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    // exact Autonomi palette
    expect(svg).toContain("#553de9"); // accent
    expect(svg).toContain("#1FC5A8"); // teal dot
    // logo geometry present (the "A" strokes + squircle)
    expect(svg).toContain("M152 405");
    expect(svg).toContain('rx="118"');
    // run content present
    expect(svg).toContain("autonomi-saas");
    expect(svg).toContain("ITERATION");
    // fleet + council text present
    expect(svg).toContain("loki-mode");
    expect(svg).toContain("opus-a");
  });

  it("XML-escapes hostile run/repo names", () => {
    const svg = buildSvg({ ...SAMPLE, run: '<script>&"x' });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });
});

describe("cockpit render orchestration", () => {
  it("falls back honestly (no image) when protocol is none", () => {
    const out = render(SAMPLE, { protocol: "none" });
    expect(out.kind).toBe("fallback");
    expect(out.data).toBeUndefined();
    expect(out.svg.startsWith("<svg")).toBe(true);
  });

  it("--no-image forces fallback even on a graphics terminal", () => {
    const out = render(SAMPLE, { protocol: "iterm2", forceText: true });
    expect(out.kind).toBe("fallback");
    expect(out.reason).toContain("no-image");
  });

  it("falls back when raster is unavailable, never claiming an image", () => {
    // resvg is not installed in this repo's loki-ts; the render must not lie.
    const out = render(SAMPLE, { protocol: "iterm2" });
    expect(out.kind).toBe("fallback");
    expect(out.data).toBeUndefined();
    expect(out.reason).toBeTruthy();
  });
});
