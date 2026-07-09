// Entry point invoked by `cmd_cockpit` (autonomy/loki via autonomy/lib/
// cockpit-render.sh). Reads a CockpitState JSON on stdin, renders one frame,
// and writes the result to stdout:
//
//   image    -> the raw terminal escape sequence (bytes) on stdout, exit 0
//   fallback -> nothing on stdout; a "FALLBACK\t<reason>" line on stderr,
//               exit 3, so the bash caller prints its own text/browser summary.
//
// Flags: --protocol iterm2|kitty|auto (default auto), --no-image, --svg-out
// <path> (also write the SVG for debugging).

import { render } from "./render.ts";
import type { CockpitState } from "./svg.ts";
import type { CockpitProtocol } from "./capability.ts";

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of process.stdin as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function parseArgs(argv: string[]): { protocol: CockpitProtocol | "auto"; noImage: boolean; svgOut?: string } {
  let protocol: CockpitProtocol | "auto" = "auto";
  let noImage = false;
  let svgOut: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--protocol") {
      const v = (argv[++i] || "auto").toLowerCase();
      protocol = v === "iterm2" || v === "kitty" || v === "none" ? (v as CockpitProtocol) : "auto";
    } else if (a === "--no-image") {
      noImage = true;
    } else if (a === "--svg-out") {
      svgOut = argv[++i];
    }
  }
  return { protocol, noImage, svgOut };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const { protocol, noImage, svgOut } = parseArgs(argv);
  let state: CockpitState;
  try {
    const raw = await readStdin();
    state = JSON.parse(raw) as CockpitState;
  } catch (e) {
    process.stderr.write(`FALLBACK\tcould not parse cockpit state: ${(e as Error).message}\n`);
    return 3;
  }

  const outcome = render(state, { protocol, forceText: noImage });

  if (svgOut) {
    try {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(svgOut, outcome.svg);
    } catch {
      // Best-effort; a debug artifact failing must not change the exit path.
    }
  }

  if (outcome.kind === "image" && outcome.data) {
    process.stdout.write(outcome.data);
    return 0;
  }
  process.stderr.write(`FALLBACK\t${outcome.reason || "image unavailable"}\n`);
  return 3;
}

if (import.meta.main) {
  main().then((code) => process.exit(code));
}
