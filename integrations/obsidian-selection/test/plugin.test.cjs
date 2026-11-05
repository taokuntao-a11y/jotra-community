"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { loadPlugin } = require("./load-plugin.cjs");

const REQUEST = "33333333-3333-4333-8333-333333333333";
const SPARK = "44444444-4444-4444-8444-444444444444";
const RECEIPT = { requestId: REQUEST, status: "persisted", sparkId: SPARK, persistedAt: "2026-11-05T10:00:00.000Z" };

function fixture(t, mode = "success") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "jotra-example-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cliPath = path.join(directory, "jotra CLI 空格");
  const capture = path.join(directory, "capture.jsonl");
  const source = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
let text = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', part => text += part);
process.stdin.on('end', () => {
  const writing = args[0] === 'add';
  const request = writing ? JSON.parse(text) : { requestId: args[1] };
  fs.appendFileSync(${JSON.stringify(capture)}, JSON.stringify({ args, input: text }) + '\\n');
  const receipt = { requestId: request.requestId, status: 'persisted', sparkId: ${JSON.stringify(SPARK)}, persistedAt: '2026-11-05T10:00:00.000Z' };
  const reply = { protocolVersion: 1, receipt, ...(writing ? { replayed: false } : {}) };
  const mode = ${JSON.stringify(mode)};
  if (mode === 'delay') { setTimeout(() => console.log(JSON.stringify(reply)), 5000); return; }
  if (mode === 'large') { console.log('x'.repeat(70000)); return; }
  if (mode === 'stderr') { process.stderr.write('x'.repeat(18000)); console.log(JSON.stringify(reply)); return; }
  if (mode === 'unknown' && writing) {
    console.log(JSON.stringify({ protocolVersion: 1, requestId: request.requestId, error: { code: 'DELIVERY_UNKNOWN', commitState: 'unknown', message: 'PRIVATE_TEXT_MUST_NOT_BE_SHOWN' } }));
    process.exitCode = 6; return;
  }
  if (mode === 'unavailable') {
    console.log(JSON.stringify({ protocolVersion: 1, requestId: request.requestId, error: { code: 'BRIDGE_UNAVAILABLE', commitState: 'not_committed', message: 'PRIVATE_TEXT_MUST_NOT_BE_SHOWN' } }));
    process.exitCode = 3; return;
  }
  console.log(JSON.stringify(reply));
});
`;
  fs.writeFileSync(cliPath, source, { mode: 0o700 });
  return { cliPath, profile: "obsidian", directory, capture, read: () => fs.readFileSync(capture, "utf8").trim().split("\n").map(JSON.parse) };
}

test("the CLI uses argument arrays, stdin, spaces and literal shell characters", async (t) => {
  const options = fixture(t);
  const { Plugin } = loadPlugin();
  const marker = path.join(options.directory, "must-not-exist");
  const text = "虚构笔记 😀\n$(touch " + marker + ") ' \" ; &";
  const result = await Plugin.adapter.runCLI(options, "add", { protocolVersion: 1, requestId: REQUEST, text });
  assert.equal(result.ok, true);
  const [call] = options.read();
  assert.deepEqual(call.args, ["add", "--stdin-json", "--json", "--no-launch", "--profile", "obsidian"]);
  assert.equal(JSON.parse(call.input).text, text);
  assert.equal(fs.existsSync(marker), false);
});

test("only a matching persisted receipt can report success", () => {
  const { adapter } = loadPlugin().Plugin;
  for (const value of [
    { protocolVersion: 1, receipt: { ...RECEIPT, status: "queued" }, replayed: false },
    { protocolVersion: 1, receipt: { ...RECEIPT, requestId: SPARK }, replayed: false },
    { protocolVersion: 1, receipt: RECEIPT },
    { protocolVersion: 1, receipt: { ...RECEIPT, persistedAt: "2026-02-30T10:00:00.000Z" }, replayed: false },
    { protocolVersion: 1, receipt: RECEIPT, error: { code: "ERROR" }, replayed: false },
  ]) assert.equal(adapter.parseResult(JSON.stringify(value), 0, REQUEST, true).ok, false);
  assert.equal(adapter.parseResult("not JSON", 0, REQUEST, true).error.commitState, "unknown");
  assert.equal(adapter.parseResult(JSON.stringify({ protocolVersion: 1, receipt: RECEIPT, replayed: false }), 0, REQUEST, true).ok, true);
});

test("selection commands do not change the editor or persist note content", async (t) => {
  const settings = fixture(t);
  const { Plugin, notices } = loadPlugin({ data: settings });
  const plugin = new Plugin(); await plugin.onload();
  assert.equal(plugin.commands.length, 2);
  const text = "Fictional selection; never store this in plugin metadata";
  const result = await plugin.captureSelection({ getSelection: () => text });
  assert.equal(result.ok, true);
  assert.equal(plugin.settings.lastRequest.status, "persisted");
  assert.ok(plugin.saved.length >= 2);
  assert.ok(!JSON.stringify(plugin.saved).includes(text));
  assert.equal(optionsFields(plugin.saved.at(-1)), "cliPath,lastRequest,profile");
  assert.ok(notices.some(message => message.startsWith("Saved to local Jotra")));
});

function optionsFields(value) { return Object.keys(value).sort().join(","); }

test("an unresolved write blocks new IDs; a receipt check resolves the original request", async (t) => {
  const settings = fixture(t, "unknown");
  const { Plugin, notices } = loadPlugin({ data: settings });
  const plugin = new Plugin(); await plugin.onload();
  const first = await plugin.captureSelection({ getSelection: () => "Fictional pending note" });
  assert.equal(first.ok, false);
  const requestId = plugin.settings.lastRequest.requestId;
  assert.equal(plugin.settings.lastRequest.status, "unknown");
  assert.equal(await plugin.captureSelection({ getSelection: () => "Do not send a new ID" }), null);
  assert.equal(settings.read().length, 1);
  plugin.settings.profile = "changed-profile";
  const checked = await plugin.checkLastReceipt();
  assert.equal(checked.ok, true);
  assert.equal(checked.receipt.requestId, requestId);
  assert.deepEqual(settings.read()[1].args, ["receipt", requestId, "--json", "--no-launch", "--profile", "obsidian"]);
  assert.ok(!notices.some(message => message.includes("PRIVATE_TEXT")));
});

test("duplicate command activation creates one subprocess", async (t) => {
  const settings = fixture(t);
  const { Plugin } = loadPlugin({ data: settings }); const plugin = new Plugin(); await plugin.onload();
  const values = await Promise.all([plugin.captureSelection({ getSelection: () => "one" }), plugin.captureSelection({ getSelection: () => "two" })]);
  assert.equal(values.filter(Boolean).length, 1);
  assert.equal(settings.read().length, 1);
});

test("empty selection and invalid CLI configuration do not execute a command", async () => {
  const { Plugin } = loadPlugin(); const plugin = new Plugin(); await plugin.onload();
  assert.equal(await plugin.captureSelection({ getSelection: () => "  " }), null);
  assert.equal(await plugin.captureSelection({ getSelection: () => "text" }), null);
  assert.equal(plugin.saved.length, 0);
  assert.equal((await Plugin.adapter.runCLI({ cliPath: "relative", profile: "bad profile" }, "add", { requestId: REQUEST })).error.commitState, "not_committed");
});

test("metadata failure prevents submission", async (t) => {
  const settings = fixture(t);
  const { Plugin } = loadPlugin({ data: settings, failSave: true }); const plugin = new Plugin(); await plugin.onload();
  await assert.rejects(plugin.captureSelection({ getSelection: () => "Never submit this" }));
  assert.equal(fs.existsSync(settings.capture), false);
});

test("unavailable bridge is not saved and raw CLI messages are not shown", async (t) => {
  const settings = fixture(t, "unavailable"); const { Plugin, notices } = loadPlugin({ data: settings });
  const plugin = new Plugin(); await plugin.onload();
  const result = await plugin.captureSelection({ getSelection: () => "Fictional failure" });
  assert.equal(result.ok, false);
  assert.equal(plugin.settings.lastRequest.status, "not_committed");
  assert.ok(!notices.some(message => message.includes("PRIVATE_TEXT") || message.startsWith("Saved")));
});

for (const [mode, expected] of [["delay", "TIMEOUT"], ["large", "OUTPUT_TOO_LARGE"], ["stderr", "OUTPUT_TOO_LARGE"]]) {
  test(`${mode}: bounded child output/deadline preserves unknown`, async (t) => {
    const settings = fixture(t, mode); const { adapter } = loadPlugin().Plugin;
    const result = await adapter.runCLI(settings, "add", { protocolVersion: 1, requestId: REQUEST, text: "fixture" }, { timeoutMs: mode === "delay" ? 80 : 5000 });
    assert.equal(result.ok, false); assert.equal(result.error.code, expected);
    assert.equal(result.error.commitState, "unknown");
  });
}

test("an absent executable is definitely not started", async () => {
  const { adapter } = loadPlugin().Plugin;
  const result = await adapter.runCLI({ cliPath: "/nonexistent/jotra", profile: "obsidian" }, "add", { requestId: REQUEST, text: "fixture" });
  assert.equal(result.error.code, "CLI_NOT_STARTED");
  assert.equal(result.error.commitState, "not_committed");
});

test("unload/cancellation does not turn a write into definite failure", async (t) => {
  const settings = fixture(t, "delay"); const { adapter } = loadPlugin().Plugin;
  const controller = new AbortController();
  const pending = adapter.runCLI(settings, "add", { requestId: REQUEST, text: "fixture" }, { signal: controller.signal });
  setTimeout(() => controller.abort(), 80);
  const result = await pending;
  assert.equal(result.error.code, "CANCELLED"); assert.equal(result.error.commitState, "unknown");
});

test("child environment cannot inherit API keys or pairing exports", () => {
  const { adapter } = loadPlugin().Plugin;
  const env = adapter.safeEnvironment({ PATH: "/bin", HOME: "/test", LANG: "en_US.UTF-8", OPENAI_API_KEY: "fixture", JOTRA_TOKEN: "fixture", PAIRING_PROFILE: "fixture" });
  assert.equal(optionsFields(env), "HOME,LANG,PATH");
});

test("failed recheck preserves an already verified receipt", async (t) => {
  const settings = fixture(t, "unavailable");
  const { Plugin } = loadPlugin({ data: { ...settings, lastRequest: { ...settings, requestId: REQUEST, status: "persisted", receipt: RECEIPT } } });
  const plugin = new Plugin(); await plugin.onload(); await plugin.checkLastReceipt();
  assert.equal(plugin.settings.lastRequest.status, "persisted");
  assert.equal(plugin.settings.lastRequest.receipt.sparkId, SPARK);
});
