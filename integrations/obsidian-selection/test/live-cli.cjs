"use strict";
// Explicit opt-in integration test. Writes only fictional QA content through the CLI.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { randomUUID, createHash } = require("node:crypto");
const { loadPlugin } = require("./load-plugin.cjs");

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes("--allow-fictional-write")) throw new Error("Explicit --allow-fictional-write is required.");
  const value = (name) => args[args.indexOf(name) + 1];
  for (const name of ["--cli", "--profile", "--evidence"]) assert.ok(args.includes(name), `${name} required`);
  const cliPath = value("--cli"), profile = value("--profile"), evidencePath = value("--evidence");
  assert.ok(path.isAbsolute(cliPath) && path.isAbsolute(evidencePath));
  const { Plugin } = loadPlugin({ data: { cliPath, profile } });
  const plugin = new Plugin(); await plugin.onload();
  const marker = randomUUID();
  const text = `Fictional Obsidian selection QA ${marker}\n虚构选中文字；引号 ' \"、换行与 $() 都是普通数据。`;
  let pending;
  const capture = plugin.captureSelection.bind(plugin);
  plugin.captureSelection = (editor) => { pending = capture(editor); return pending; };
  plugin.commands.find(command => command.id === "save-selection").editorCallback({ getSelection: () => text });
  const saved = await pending;
  assert.ok(saved?.ok, saved?.error?.code || "capture did not return persistence");
  assert.equal(saved.replayed, false);
  const requestId = saved.receipt.requestId;
  const repeated = await Plugin.adapter.runCLI({ cliPath, profile }, "add", {
    protocolVersion: 1, requestId, text, tags: ["Obsidian"], title: "Obsidian selection", url: "",
  });
  assert.equal(repeated.ok, true); assert.equal(repeated.replayed, true);
  assert.deepEqual(JSON.parse(JSON.stringify(repeated.receipt)), JSON.parse(JSON.stringify(saved.receipt)));
  const receipt = await plugin.checkLastReceipt();
  assert.equal(receipt.ok, true); assert.equal(receipt.receipt.sparkId, saved.receipt.sparkId);
  assert.ok(!JSON.stringify(plugin.saved).includes(text));
  const restored = loadPlugin({ data: plugin.saved.at(-1) });
  const reloaded = new restored.Plugin(); await reloaded.onload();
  assert.equal((await reloaded.checkLastReceipt()).receipt.sparkId, saved.receipt.sparkId);
  const rejected = await Plugin.adapter.runCLI({ cliPath, profile: "missing_" + marker.slice(0, 12).replaceAll("-", "_") }, "add", {
    protocolVersion: 1, requestId: randomUUID(), text: "Never authorized; fictional negative test.",
  });
  assert.equal(rejected.ok, false); assert.equal(rejected.error.commitState, "not_committed");
  const version = spawnSync(cliPath, ["version", "--json"], { encoding: "utf8", shell: false, env: Plugin.adapter.safeEnvironment(), timeout: 5000 });
  assert.equal(version.status, 0);
  const evidence = {
    verifiedAt: new Date().toISOString(), scope: "Obsidian command adapter harness -> real CLI -> pinned local HTTPS -> isolated QA App",
    adapterVersion: "0.1.0", cli: JSON.parse(version.stdout), cliSha256: createHash("sha256").update(fs.readFileSync(cliPath)).digest("hex"),
    platform: process.platform, arch: process.arch,
    receipt: JSON.parse(JSON.stringify(saved.receipt)),
    checks: ["registered editor command invokes capture", "real persisted receipt", "same-ID replay preserves receipt", "receipt lookup", "adapter metadata reload", "no selected text persisted", "unconfigured authorization rejected"],
    obsidianGUIVerified: false,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + "\n", { mode: 0o600 });
  plugin.onunload(); reloaded.onunload();
  console.log(JSON.stringify({ passed: evidence.checks.length, requestId, sparkId: saved.receipt.sparkId, status: saved.receipt.status, replayStable: true, obsidianGUIVerified: false }));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
