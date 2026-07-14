// v8 Phase 4: hermetic test for the SDK stream parser. Feeds canned SDKMessage
// arrays (NO API call) and asserts the parser writes the exact .loki state the
// bash Python parser (autonomy/run.sh:17475-17829) writes. This is the parity
// contract: whatever the loop ran on (bash claude binary or the Agent SDK), the
// dashboard/efficiency/event-bus consumers see identical files.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { consumeSdkStream, type StreamMsg } from "../../src/runner/sdk_stream_parser.ts";

let scratch: string;
const FIXED = "2026-07-13T00:00:00.000Z";
const clock = () => FIXED;

beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), "loki-sdkparse-"));
});
afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
});

function ctx(iteration = "3") {
  return {
    cwd: scratch,
    iteration,
    hookEventsEnabled: true,
    write: (_s: string) => {}, // swallow live output in tests
  };
}

const agentsPath = () => join(scratch, ".loki", "state", "agents.json");
const eventsPath = () => join(scratch, ".loki", "events.jsonl");
const costPath = (i: string) => join(scratch, ".loki", "metrics", `result-cost-${i}.json`);

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

describe("consumeSdkStream (.loki parity with the bash Python parser)", () => {
  test("orchestrator is always written; empty stream is fail-closed (no result -> exit 1)", async () => {
    const r = await consumeSdkStream([], ctx(), clock);
    expect(r.exitCode).toBe(1); // fail-closed: no terminal result message
    expect(r.sawResult).toBe(false);
    const agents = readJson(agentsPath());
    expect(Array.isArray(agents)).toBe(true);
    const orch = agents.find((a: { tool_id: string }) => a.tool_id === "orchestrator-main");
    expect(orch).toBeTruthy();
    expect(orch.agent_type).toBe("orchestrator");
  });

  test("tool_use bumps orchestrator tool_count + current_task (per-tool desc)", async () => {
    const msgs: StreamMsg[] = [
      { type: "assistant", message: { content: [{ type: "tool_use", name: "Read", id: "t1", input: { file_path: "src/a.ts" } }] } },
      { type: "assistant", message: { content: [{ type: "tool_use", name: "Bash", id: "t2", input: { description: "run tests" } }] } },
    ];
    await consumeSdkStream(msgs, ctx(), clock);
    const orch = readJson(agentsPath()).find((a: { tool_id: string }) => a.tool_id === "orchestrator-main");
    expect(orch.tool_count).toBe(2);
    expect(orch.current_task).toBe("Bash: run tests");
  });

  test("Task tool_use spawns a tracked agent; tool_result completes it", async () => {
    const msgs: StreamMsg[] = [
      {
        type: "assistant",
        message: {
          content: [
            { type: "tool_use", name: "Task", id: "task-abcdef123456", input: { subagent_type: "code-reviewer", model: "opus", description: "review the diff" } },
          ],
        },
      },
      { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "task-abcdef123456" }] } },
    ];
    await consumeSdkStream(msgs, ctx(), clock);
    const agents = readJson(agentsPath());
    const spawned = agents.find((a: { tool_id: string }) => a.tool_id === "task-abcdef123456");
    expect(spawned).toBeTruthy();
    expect(spawned.agent_id).toBe("agent-task-abc"); // first 8 chars of tool_id
    expect(spawned.agent_type).toBe("code-reviewer");
    expect(spawned.model).toBe("opus");
    expect(spawned.status).toBe("completed"); // tool_result marked it done
    expect(spawned.completed_at).toBe(FIXED);
  });

  test("system/hook_response -> .loki/events.jsonl as claude_hook_<name> with the exact record", async () => {
    // The SDK surfaces hooks as type:'system' subtype:'hook_response' (terminal
    // frame) carrying hook_event, when includeHookEvents:true.
    const msgs: StreamMsg[] = [
      { type: "system", subtype: "hook_response", hook_event: "PreToolUse" } as StreamMsg,
    ];
    await consumeSdkStream(msgs, ctx(), clock);
    expect(existsSync(eventsPath())).toBe(true);
    const line = readFileSync(eventsPath(), "utf8").trim();
    const rec = JSON.parse(line);
    expect(rec.type).toBe("claude_hook_pretooluse"); // lowercased
    expect(rec.source).toBe("claude_cli");
    expect(rec.timestamp).toBe(FIXED);
    expect(rec.payload).toBeTruthy();
  });

  test("one hook lifecycle (started+progress+response) -> exactly ONE record (dedup on response)", async () => {
    const msgs: StreamMsg[] = [
      { type: "system", subtype: "hook_started", hook_event: "PreToolUse" } as StreamMsg,
      { type: "system", subtype: "hook_progress", hook_event: "PreToolUse" } as StreamMsg,
      { type: "system", subtype: "hook_response", hook_event: "PreToolUse" } as StreamMsg,
    ];
    await consumeSdkStream(msgs, ctx(), clock);
    const lines = readFileSync(eventsPath(), "utf8").trim().split("\n").filter(Boolean);
    expect(lines.length).toBe(1); // only the terminal response recorded
  });

  test("hook events suppressed when hookEventsEnabled=false (LOKI_HOOK_EVENTS=off)", async () => {
    await consumeSdkStream(
      [{ type: "system", subtype: "hook_response", hook_event: "PreToolUse" } as StreamMsg],
      { ...ctx(), hookEventsEnabled: false },
      clock,
    );
    expect(existsSync(eventsPath())).toBe(false);
  });

  test("captured text = assistant text + result.result (load-bearing for scanners)", async () => {
    const msgs: StreamMsg[] = [
      { type: "assistant", message: { content: [{ type: "text", text: "Working on it. " }] } },
      {
        type: "result",
        is_error: false,
        total_cost_usd: 0.01,
        usage: {},
        result: "COMPLETION_PROMISE: done",
      } as StreamMsg,
    ];
    const r = await consumeSdkStream(msgs, ctx(), clock);
    expect(r.capturedText).toContain("Working on it.");
    expect(r.capturedText).toContain("COMPLETION_PROMISE: done");
  });

  test("rate_limit assistant error -> rateLimit signal + 'rate_limit' in captured text", async () => {
    const msgs = [
      { type: "assistant", error: "rate_limit", message: { content: [] } },
    ] as unknown as StreamMsg[];
    const r = await consumeSdkStream(msgs, ctx(), clock);
    expect(r.rateLimit).toBeTruthy();
    expect(r.capturedText).toContain("rate_limit");
  });

  test("TodoWrite tool_use -> .loki/queue/in-progress.json (in_progress items enriched)", async () => {
    const msgs: StreamMsg[] = [
      {
        type: "assistant",
        message: {
          content: [
            {
              type: "tool_use",
              name: "TodoWrite",
              id: "tw1",
              input: {
                todos: [
                  { content: "build the parser", status: "in_progress", activeForm: "Building the parser" },
                  { content: "write tests", status: "pending" },
                ],
              },
            },
          ],
        },
      },
    ];
    await consumeSdkStream(msgs, ctx(), clock);
    const ip = readJson(join(scratch, ".loki", "queue", "in-progress.json"));
    expect(ip.length).toBe(1); // only the in_progress item
    expect(ip[0].title).toBe("build the parser");
    expect(ip[0].source).toBe("claude_code_todowrite");
    expect(ip[0].payload.activeForm).toBe("Building the parser");
  });

  test("result event: exit 0 on success + authoritative result-cost with exact fields", async () => {
    const msgs: StreamMsg[] = [
      {
        type: "result",
        subtype: "success",
        is_error: false,
        total_cost_usd: 0.0421,
        usage: {
          input_tokens: 1200,
          output_tokens: 350,
          cache_read_input_tokens: 800,
          cache_creation_input_tokens: 100,
        },
        session_id: "sess-xyz",
      },
    ];
    const r = await consumeSdkStream(msgs, ctx("7"), clock);
    expect(r.exitCode).toBe(0);
    expect(r.sessionId).toBe("sess-xyz");
    const cost = readJson(costPath("7"));
    expect(cost).toEqual({
      total_cost_usd: 0.0421,
      input_tokens: 1200,
      output_tokens: 350,
      cache_read_tokens: 800,
      cache_creation_tokens: 100,
    });
  });

  test("result event: is_error -> exit 1 (the load-bearing exit-code contract)", async () => {
    const r = await consumeSdkStream(
      [{ type: "result", subtype: "error_during_execution", is_error: true, total_cost_usd: 0.01, usage: {} }],
      ctx(),
      clock,
    );
    expect(r.exitCode).toBe(1);
  });

  test("result with null total_cost_usd writes NO cost file (Python skips None)", async () => {
    await consumeSdkStream(
      [{ type: "result", is_error: false, total_cost_usd: null, usage: {} }],
      ctx("9"),
      clock,
    );
    expect(existsSync(costPath("9"))).toBe(false);
  });

  test("result marks still-active agents completed with 'Session complete'", async () => {
    const msgs: StreamMsg[] = [
      { type: "assistant", message: { content: [{ type: "tool_use", name: "Task", id: "task-zzz", input: { description: "d" } }] } },
      // no tool_result -> agent still active when result arrives
      { type: "result", is_error: false, total_cost_usd: 0.02, usage: {} },
    ];
    await consumeSdkStream(msgs, ctx(), clock);
    const agents = readJson(agentsPath());
    const spawned = agents.find((a: { tool_id: string }) => a.tool_id === "task-zzz");
    expect(spawned.status).toBe("completed");
    expect(spawned.current_task).toBe("Session complete");
  });

  test("stream_event deltas do not double-print with the final assistant text", async () => {
    const printed: string[] = [];
    const msgs: StreamMsg[] = [
      { type: "stream_event", event: { type: "message_start" } },
      { type: "stream_event", event: { type: "content_block_delta", delta: { type: "text_delta", text: "Hello " } } },
      { type: "stream_event", event: { type: "content_block_delta", delta: { type: "text_delta", text: "world" } } },
      // final assistant message repeats the same text -> must NOT print again
      { type: "assistant", message: { content: [{ type: "text", text: "Hello world" }] } },
    ];
    await consumeSdkStream(msgs, { ...ctx(), write: (s) => printed.push(s) }, clock);
    expect(printed.join("")).toBe("Hello world"); // streamed once, not twice
  });

  test("async-iterable input works (real query() yields an async generator)", async () => {
    async function* gen(): AsyncGenerator<StreamMsg> {
      yield { type: "result", is_error: false, total_cost_usd: 0.005, usage: {} };
    }
    const r = await consumeSdkStream(gen(), ctx("2"), clock);
    expect(r.exitCode).toBe(0);
    expect(existsSync(costPath("2"))).toBe(true);
  });

  // Story 7: cross-iteration accumulation + env-parity regression.
  test("cross-iteration: a pre-existing agents.json is merged, prior agents survive", async () => {
    // seed a prior-iteration agent
    const stateDir = join(scratch, ".loki", "state");
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(
      agentsPath(),
      JSON.stringify([
        { agent_id: "agent-prior", tool_id: "prior-tool", agent_type: "x", model: "sonnet", current_task: "old", status: "completed", spawned_at: "old", tasks_completed: [] },
      ]),
    );
    await consumeSdkStream(
      [{ type: "assistant", message: { content: [{ type: "tool_use", name: "Task", id: "new-tool", input: { description: "new" } }] } }],
      ctx(),
      clock,
    );
    const agents = readJson(agentsPath());
    const ids = agents.map((a: { tool_id: string }) => a.tool_id);
    expect(ids).toContain("prior-tool"); // prior survived the merge
    expect(ids).toContain("new-tool"); // new one added
  });

  test("env-parity: LOKI_CURRENT_MODEL sets the orchestrator model", async () => {
    const prev = process.env["LOKI_CURRENT_MODEL"];
    process.env["LOKI_CURRENT_MODEL"] = "opus";
    try {
      await consumeSdkStream([], ctx(), clock);
      const orch = readJson(agentsPath()).find((a: { tool_id: string }) => a.tool_id === "orchestrator-main");
      expect(orch.model).toBe("opus");
    } finally {
      if (prev === undefined) delete process.env["LOKI_CURRENT_MODEL"];
      else process.env["LOKI_CURRENT_MODEL"] = prev;
    }
  });

  test("env-parity: the iteration arg drives the cost filename", async () => {
    await consumeSdkStream(
      [{ type: "result", is_error: false, total_cost_usd: 0.01, usage: {} }],
      ctx("42"),
      clock,
    );
    expect(existsSync(costPath("42"))).toBe(true);
    expect(existsSync(costPath("0"))).toBe(false);
  });
});
