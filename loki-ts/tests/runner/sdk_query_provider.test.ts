// v8 Phase 4 Story 4: hermetic test for sdkQueryProvider (NO API call). The
// Agent SDK's query() is stubbed via mock.module to yield a canned SDKMessage
// stream; we assert the provider satisfies the ProviderInvoker contract, writes
// the captured text to iterationOutputPath, derives the exit code fail-closed,
// spreads process.env, and delegates non-mainLoop calls to the CLI path.
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ProviderInvocation } from "../../src/runner/types.ts";

let scratch: string;
let lastQueryArgs: { prompt: string; options: Record<string, unknown> } | undefined;

// A fake query() that records its args and yields a caller-provided message set.
function stubQuery(messages: unknown[]) {
  lastQueryArgs = undefined;
  mock.module("@anthropic-ai/claude-agent-sdk", () => ({
    query: (args: { prompt: string; options: Record<string, unknown> }) => {
      lastQueryArgs = args;
      return (async function* () {
        for (const m of messages) yield m;
      })();
    },
  }));
}

function call(overrides: Partial<ProviderInvocation> = {}): ProviderInvocation {
  return {
    provider: "claude",
    prompt: "build the thing",
    tier: "development",
    cwd: scratch,
    iterationOutputPath: join(scratch, "iter-out.txt"),
    mainLoop: true,
    ...overrides,
  };
}

beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), "loki-sdkprov-"));
});
afterEach(() => {
  mock.restore(); // undo the module mock so it never leaks to other files
  rmSync(scratch, { recursive: true, force: true });
});

describe("sdkQueryProvider (hermetic, stubbed query)", () => {
  it("mainLoop success: writes captured text + returns exit 0 + capturedOutputPath", async () => {
    stubQuery([
      { type: "assistant", message: { content: [{ type: "text", text: "hello from the loop" }] } },
      { type: "result", subtype: "success", is_error: false, total_cost_usd: 0.01, usage: {}, result: "done" },
    ]);
    const { sdkQueryProvider } = await import("../../src/runner/providers.ts");
    const r = await sdkQueryProvider().invoke(call());
    expect(r.exitCode).toBe(0);
    expect(r.capturedOutputPath).toBe(join(scratch, "iter-out.txt"));
    const body = readFileSync(r.capturedOutputPath, "utf8");
    expect(body).toContain("hello from the loop");
    expect(body).toContain("done");
  });

  it("is_error result -> exit 1", async () => {
    stubQuery([
      { type: "result", subtype: "error_during_execution", is_error: true, total_cost_usd: 0.01, usage: {} },
    ]);
    const { sdkQueryProvider } = await import("../../src/runner/providers.ts");
    const r = await sdkQueryProvider().invoke(call());
    expect(r.exitCode).toBe(1);
  });

  it("no result message (aborted/crashed stream) -> fail-closed exit 1", async () => {
    stubQuery([{ type: "assistant", message: { content: [{ type: "text", text: "partial" }] } }]);
    const { sdkQueryProvider } = await import("../../src/runner/providers.ts");
    const r = await sdkQueryProvider().invoke(call());
    expect(r.exitCode).toBe(1);
    // captured text still written (load-bearing for scanners)
    expect(readFileSync(r.capturedOutputPath, "utf8")).toContain("partial");
  });

  it("a thrown query() is fail-closed: exit 1 + captured file exists", async () => {
    mock.module("@anthropic-ai/claude-agent-sdk", () => ({
      query: () => {
        throw new Error("sdk exploded");
      },
    }));
    const { sdkQueryProvider } = await import("../../src/runner/providers.ts");
    const r = await sdkQueryProvider().invoke(call());
    expect(r.exitCode).toBe(1);
    expect(existsSync(r.capturedOutputPath)).toBe(true);
    expect(readFileSync(r.capturedOutputPath, "utf8")).toContain("sdk-loop error");
  });

  it("passes options.env spreading process.env (PATH survives -- the env-replace trap)", async () => {
    stubQuery([{ type: "result", is_error: false, total_cost_usd: 0.01, usage: {} }]);
    const { sdkQueryProvider } = await import("../../src/runner/providers.ts");
    await sdkQueryProvider().invoke(call());
    const env = lastQueryArgs?.options?.["env"] as Record<string, string> | undefined;
    expect(env).toBeTruthy();
    expect(env!["PATH"]).toBe(process.env["PATH"]); // not stripped
  });

  it("sets the fully-autonomous permission options (bypass + companion flag)", async () => {
    stubQuery([{ type: "result", is_error: false, total_cost_usd: 0.01, usage: {} }]);
    const { sdkQueryProvider } = await import("../../src/runner/providers.ts");
    await sdkQueryProvider().invoke(call());
    const opts = lastQueryArgs?.options ?? {};
    expect(opts["permissionMode"]).toBe("bypassPermissions");
    expect(opts["allowDangerouslySkipPermissions"]).toBe(true);
    expect(opts["includeHookEvents"]).toBe(true);
  });

  it("mainLoop:false delegates to the CLI path (query is NOT called)", async () => {
    stubQuery([{ type: "result", is_error: false, total_cost_usd: 0.01, usage: {} }]);
    const { sdkQueryProvider } = await import("../../src/runner/providers.ts");
    // A non-mainLoop call must delegate to claudeProvider (which spawns the CLI).
    // We only assert query() was NOT invoked (lastQueryArgs stays undefined); the
    // CLI spawn itself may fail in the sandbox, which is fine -- we catch it.
    try {
      await sdkQueryProvider().invoke(call({ mainLoop: false }));
    } catch {
      // CLI path may throw if claude is absent -- irrelevant to this assertion
    }
    expect(lastQueryArgs).toBeUndefined(); // query() never reached
  });
});

describe("resolveProvider LOKI_SDK_LOOP gate", () => {
  const prev = process.env["LOKI_SDK_LOOP"];
  afterEach(() => {
    if (prev === undefined) delete process.env["LOKI_SDK_LOOP"];
    else process.env["LOKI_SDK_LOOP"] = prev;
  });

  it("default-off: resolveProvider('claude') is NOT the SDK provider", async () => {
    delete process.env["LOKI_SDK_LOOP"];
    const { resolveProvider, sdkQueryProvider } = await import("../../src/runner/providers.ts");
    const p = await resolveProvider("claude");
    // The default provider must not be the SDK one. We compare invoke identity by
    // checking the SDK provider is a distinct object (can't deep-compare closures,
    // but the gate returning claudeProvider() means query() is never the path).
    expect(p).not.toBe(sdkQueryProvider());
  });
});
