// v8 Phase 4 Story 5: `loki start` on the Bun route. Parses the supported flag
// subset into RunnerOpts and calls runAutonomous. Reached from bin/loki ONLY
// when LOKI_SDK_LOOP is truthy (Story 6); until then the default route still
// runs the bash cmd_start. This story just makes the Bun `start` command exist.
//
// SCOPE (locked, autonomous decision): the Bun runner supports exactly the
// RunnerOpts fields below. Any flag the bash cmd_start accepts but the Bun
// runner does not model is REJECTED with a clear error -- never silently
// dropped (that would be a hidden capability loss under LOKI_SDK_LOOP=1).

import type { ProviderName, SessionTier } from "../runner/types.ts";

function argVal(args: readonly string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}

const SUPPORTED_FLAGS = new Set([
  "--max-iterations",
  "--max-retries",
  "--budget-limit",
  "--provider",
  "--session-model",
  "--completion-promise",
  "--base-wait",
  "--max-wait",
]);

const VALID_PROVIDERS = new Set(["claude", "codex", "cline", "aider"]);
const VALID_TIERS = new Set(["planning", "development", "fast"]);

function posNum(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export interface ParsedStartOpts {
  prdPath: string;
  provider?: ProviderName;
  maxIterations?: number;
  maxRetries?: number;
  budgetLimit?: number;
  sessionModel?: SessionTier;
  completionPromise?: string;
  baseWaitSeconds?: number;
  maxWaitSeconds?: number;
}

// Parse the supported flag subset into RunnerOpts, or return an error exit code
// (2) with a message written to stderr. Exported for a pure unit test.
export function parseStartArgs(
  args: readonly string[],
  err: (s: string) => void = (s) => process.stderr.write(s),
): ParsedStartOpts | number {
  // Find the spec token: the first bare arg that is NOT a value consumed by a
  // preceding value-flag. All our supported flags take a value, so a bare token
  // immediately after a `--flag` (without `=`) is that flag's value, not the spec.
  let spec: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a) continue;
    if (a.startsWith("--")) {
      if (!a.includes("=")) i++; // skip this flag's value token
      continue;
    }
    spec = a;
    break;
  }
  if (!spec) {
    err("start: a spec source (PRD path or issue ref) is required\n");
    err("usage: loki start <spec> [--max-iterations N] [--budget-limit USD] [--provider P] ...\n");
    return 2;
  }

  // Reject any unsupported --flag loudly (no silent drop). Value-flags consume
  // the next token; we only need to catch unknown flag NAMES here.
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a || !a.startsWith("--")) continue;
    const name = a.includes("=") ? a.slice(0, a.indexOf("=")) : a;
    if (!SUPPORTED_FLAGS.has(name)) {
      err(`start: flag ${name} is not supported by the Bun (LOKI_SDK_LOOP) runner yet.\n`);
      err("Supported: " + Array.from(SUPPORTED_FLAGS).join(", ") + "\n");
      err("Run without LOKI_SDK_LOOP to use the full bash `loki start`.\n");
      return 2;
    }
    if (!a.includes("=")) i++;
  }

  const providerRaw = argVal(args, "--provider");
  if (providerRaw && !VALID_PROVIDERS.has(providerRaw)) {
    err(`start: unknown --provider '${providerRaw}'\n`);
    return 2;
  }
  const tierRaw = argVal(args, "--session-model");
  if (tierRaw && !VALID_TIERS.has(tierRaw)) {
    err(`start: unknown --session-model '${tierRaw}' (planning|development|fast)\n`);
    return 2;
  }

  return {
    prdPath: spec,
    provider: providerRaw as ProviderName | undefined,
    maxIterations: posNum(argVal(args, "--max-iterations")),
    maxRetries: posNum(argVal(args, "--max-retries")),
    budgetLimit: posNum(argVal(args, "--budget-limit")),
    sessionModel: tierRaw as SessionTier | undefined,
    completionPromise: argVal(args, "--completion-promise"),
    baseWaitSeconds: posNum(argVal(args, "--base-wait")),
    maxWaitSeconds: posNum(argVal(args, "--max-wait")),
  };
}

export async function runStart(args: readonly string[]): Promise<number> {
  const parsed = parseStartArgs(args);
  if (typeof parsed === "number") return parsed;
  const { runAutonomous } = await import("../runner/autonomous.ts");
  return runAutonomous(parsed);
}
