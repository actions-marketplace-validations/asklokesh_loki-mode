// v8 Phase 1: sdk_invoker judge-path contract tests. No billable API call --
// these assert the fail-closed behavior (the load-bearing safety property) and
// the availability probe. A live smoke test (real API) lives behind an env gate.
import { afterEach, describe, expect, test } from "bun:test";
import { judgeJson, sdkJudgeAvailable } from "../../src/runner/sdk_invoker.ts";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict"],
  properties: { verdict: { type: "string", enum: ["done", "incomplete", "inconclusive"] } },
} as const;

const savedKey = process.env["ANTHROPIC_API_KEY"];
afterEach(() => {
  if (savedKey === undefined) delete process.env["ANTHROPIC_API_KEY"];
  else process.env["ANTHROPIC_API_KEY"] = savedKey;
});

describe("sdk_invoker judge path (fail-closed)", () => {
  test("no API key -> not available, judgeJson returns null (never throws)", async () => {
    delete process.env["ANTHROPIC_API_KEY"];
    // availability probe is honest
    expect(sdkJudgeAvailable()).toBe(false);
    // and the call fails closed to null rather than throwing
    const r = await judgeJson({
      prompt: "irrelevant",
      schema: SCHEMA as unknown as Record<string, unknown>,
      model: "claude-haiku-4-5",
      effort: "low",
    });
    expect(r).toBeNull();
  });

  // Live smoke: only runs when explicitly enabled AND a key exists. Proves the
  // real bridge end-to-end (one prompt -> one schema-constrained JSON object).
  const liveEnabled = process.env["LOKI_SDK_LIVE_TEST"] === "1" && !!savedKey;
  test.skipIf(!liveEnabled)("LIVE: returns a schema-conforming verdict object", async () => {
    const r = await judgeJson({
      prompt: "Return a JSON object with verdict set to inconclusive.",
      schema: SCHEMA as unknown as Record<string, unknown>,
      model: "claude-haiku-4-5",
      effort: "low",
    });
    expect(r).not.toBeNull();
    expect(["done", "incomplete", "inconclusive"]).toContain(r!["verdict"]);
  });
});
