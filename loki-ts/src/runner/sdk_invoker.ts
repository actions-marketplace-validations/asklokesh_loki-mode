// v8 Phase 1: the raw-SDK "judge" path.
//
// The bridge that replaces a `claude -p --json-schema` one-shot judge call with a
// pure-HTTPS `@anthropic-ai/sdk` call (zero binary). One prompt in, one
// schema-constrained JSON object out. No tool loop, no filesystem, no subprocess.
//
// This is the deploy-at-scale layer: enterprise containers / Autonomi SaaS run
// this with just ANTHROPIC_API_KEY (or a gateway/Bedrock/Vertex base URL) and no
// `claude` binary. The agentic RARV dev loop is a SEPARATE, later phase on the
// Agent SDK; do NOT route agentic work through here.
//
// Contract: judgeJson() returns the parsed object matching `schema`, or null on
// ANY failure (missing key, refusal, transport error, no API key). Callers MUST
// fail closed on null (the bash sites already do: inconclusive / REJECT / block).
// It NEVER throws for a normal failure -- null is the single failure signal.

import Anthropic from "@anthropic-ai/sdk";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface JudgeParams {
  prompt: string;
  schema: Record<string, unknown>; // JSON Schema (draft-07); Loki's loki-ts/data/*.json
  model: string; // full model id, e.g. claude-haiku-4-5
  effort?: Effort;
  maxTokens?: number;
  timeoutMs?: number;
  system?: string;
}

// Same shape as JudgeParams but with no schema: a free-form text turn (grill
// questions, prd enrichment). The output is prose, not a schema-constrained
// object, so there is nothing to parse.
export type TextParams = Omit<JudgeParams, "schema">;

// Lazy singleton: constructing the client reads ANTHROPIC_API_KEY. Absent key ->
// we return null from judgeJson rather than throwing, so a missing key degrades
// to the bash/deterministic fallback exactly like an unsupported CLI flag does.
let _client: Anthropic | null | undefined;
function client(): Anthropic | null {
  if (_client !== undefined) return _client;
  const key = process.env["ANTHROPIC_API_KEY"];
  if (!key) {
    _client = null;
    return null;
  }
  try {
    // Bound retries (default is 2): a slow judge site must not stack
    // timeout-retries under the OS-level ceiling the bash caller wraps us in.
    // One retry tolerates a transient blip without letting worst-case latency
    // balloon (council review, security-arch lens).
    _client = new Anthropic({ apiKey: key, maxRetries: 1 });
  } catch {
    _client = null;
  }
  return _client;
}

// Return whether the SDK judge path is usable at all (key present + reachable
// client). Callers use this to decide the SDK-vs-bash branch before spending.
export function sdkJudgeAvailable(): boolean {
  return client() !== null;
}

/**
 * Run a one-shot schema-constrained judge call via the raw Anthropic SDK.
 * Returns the parsed object (typed loosely as Record) or null on any failure.
 */
export async function judgeJson(params: JudgeParams): Promise<Record<string, unknown> | null> {
  const c = client();
  if (!c) return null;

  const { prompt, schema, model, effort, maxTokens = 4096, timeoutMs = 120_000, system } = params;

  try {
    // messages.create with output_config.format = { type: 'json_schema', schema }
    // constrains the model to emit JSON matching the schema. Verified against
    // @anthropic-ai/sdk@0.111.0 (JSONOutputFormat, OutputConfig).
    const msg = await c.messages.create(
      {
        model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: prompt }],
        output_config: {
          ...(effort ? { effort } : {}),
          format: { type: "json_schema", schema },
        },
      },
      { timeout: timeoutMs },
    );

    // A structured turn ends with the JSON in a text block. Concatenate text
    // blocks and JSON.parse. (parse() would type this, but create() keeps us
    // schema-driven without a compile-time Zod/type dependency.)
    const text = (msg.content ?? [])
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    if (!text.trim()) return null;

    let obj: unknown;
    try {
      obj = JSON.parse(text);
    } catch {
      // The schema-constrained turn should always be valid JSON; if a provider/
      // gateway returned prose, fail closed rather than guess.
      return null;
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
    return obj as Record<string, unknown>;
  } catch {
    // Transport / auth / rate-limit / refusal -> single null failure signal.
    return null;
  }
}

/**
 * Run a one-shot FREE-FORM text call via the raw Anthropic SDK (no schema).
 * The sibling of judgeJson for prose sites (grill, prd-enrich) whose callers
 * parse the text themselves. Returns the concatenated text, or null on any
 * failure (missing key, transport, refusal, empty) -- same single failure
 * signal, so callers fail closed to their existing claude/deterministic path.
 */
export async function judgeText(params: TextParams): Promise<string | null> {
  const c = client();
  if (!c) return null;

  const { prompt, model, effort, maxTokens = 4096, timeoutMs = 120_000, system } = params;

  try {
    const msg = await c.messages.create(
      {
        model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: prompt }],
        // No output_config.format: a plain text turn. effort still applies.
        ...(effort ? { output_config: { effort } } : {}),
      },
      { timeout: timeoutMs },
    );
    const text = (msg.content ?? [])
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}
