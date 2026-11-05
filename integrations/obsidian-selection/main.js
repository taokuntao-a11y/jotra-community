"use strict";

// This external adapter contains no Jotra product implementation or credentials.
const { Plugin, PluginSettingTab, Setting, Notice } = require("obsidian");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const path = require("node:path");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE = /^[A-Za-z0-9_-]{1,40}$/;
const SETTINGS = { cliPath: "", profile: "obsidian", lastRequest: null };

function failure(requestId, code, commitState = "unknown") {
  return { ok: false, requestId, error: { code, commitState } };
}

function validSettings(settings) {
  return typeof settings.cliPath === "string" && path.isAbsolute(settings.cliPath)
    && !/[\0\r\n]/.test(settings.cliPath) && PROFILE.test(settings.profile);
}

function cleanReceipt(value, requestId) {
  if (!value || value.requestId !== requestId || !UUID.test(value.requestId)
    || value.status !== "persisted" || !UUID.test(value.sparkId)
    || typeof value.persistedAt !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.persistedAt)
    || !Number.isFinite(Date.parse(value.persistedAt))
    || new Date(value.persistedAt).toISOString() !== value.persistedAt) return null;
  return { requestId: value.requestId, status: "persisted", sparkId: value.sparkId, persistedAt: value.persistedAt };
}

function parseResult(bytes, exitCode, requestId, writing) {
  let value;
  try { value = JSON.parse(bytes); } catch { return failure(requestId, "INVALID_RESPONSE"); }
  if (!value || value.protocolVersion !== 1) return failure(requestId, "INVALID_RESPONSE");
  if (value.error && !value.receipt && exitCode !== 0) {
    const error = value.error;
    if (value.requestId != null && value.requestId !== requestId) return failure(requestId, "INVALID_RESPONSE");
    if (typeof error.code !== "string" || !/^[A-Z][A-Z0-9_]{1,50}$/.test(error.code)
      || !["not_committed", "unknown"].includes(error.commitState)) return failure(requestId, "INVALID_RESPONSE");
    return failure(requestId, error.code, error.commitState);
  }
  const receipt = cleanReceipt(value.receipt, requestId);
  if (exitCode !== 0 || value.error || !receipt || (writing && typeof value.replayed !== "boolean")) {
    return failure(requestId, "INVALID_RESPONSE");
  }
  return { ok: true, receipt, ...(writing ? { replayed: value.replayed } : {}) };
}

function safeEnvironment(source = process.env) {
  const result = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL"]) {
    if (typeof source[key] === "string") result[key] = source[key];
  }
  return result;
}

function runCLI(settings, operation, request, options = {}) {
  const requestId = typeof request === "string" ? request : request.requestId;
  const writing = operation === "add";
  if (!validSettings(settings) || !UUID.test(requestId) || !["add", "receipt"].includes(operation)) {
    return Promise.resolve(failure(requestId, "INVALID_SETTINGS", "not_committed"));
  }
  const args = writing
    ? ["add", "--stdin-json", "--json", "--no-launch", "--profile", settings.profile]
    : ["receipt", requestId, "--json", "--no-launch", "--profile", settings.profile];
  const input = writing ? JSON.stringify(request) : "";
  if (Buffer.byteLength(input, "utf8") > 262144) {
    return Promise.resolve(failure(requestId, "PAYLOAD_TOO_LARGE", "not_committed"));
  }
  if (options.signal?.aborted) return Promise.resolve(failure(requestId, "CANCELLED", "not_committed"));
  return new Promise((resolve) => {
    let child, stdout = "", stderrBytes = 0, outputBytes = 0, done = false, stopping = null, started = false;
    let timer, killTimer;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      options.signal?.removeEventListener("abort", abort);
      resolve(result);
    };
    const stop = (code) => {
      if (stopping || done) return;
      stopping = code;
      child?.kill("SIGTERM");
      killTimer = setTimeout(() => child?.kill("SIGKILL"), 1000);
      killTimer.unref?.();
    };
    const abort = () => stop("CANCELLED");
    try {
      child = (options.spawn || spawn)(settings.cliPath, args, {
        shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"], env: safeEnvironment(),
      });
    } catch { finish(failure(requestId, "CLI_NOT_STARTED", "not_committed")); return; }
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      outputBytes += Buffer.byteLength(chunk, "utf8");
      if (outputBytes > 65536) stop("OUTPUT_TOO_LARGE");
      else stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes > 16384) stop("OUTPUT_TOO_LARGE");
      // Never echo CLI stderr, which may contain unexpected private information.
    });
    child.stdin.on("error", () => { /* The close/result event determines delivery state. */ });
    child.once("error", () => finish(failure(requestId, started ? "CLI_ERROR" : "CLI_NOT_STARTED", started && writing ? "unknown" : "not_committed")));
    child.once("spawn", () => { started = true; child.stdin.end(input, "utf8"); });
    child.once("close", (code) => {
      finish(stopping ? failure(requestId, stopping) : parseResult(stdout, code, requestId, writing));
    });
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) abort();
    timer = setTimeout(() => stop("TIMEOUT"), options.timeoutMs ?? 35000);
    timer.unref?.();
  });
}

function cleanLastRequest(value) {
  if (!value || !UUID.test(value.requestId) || !validSettings(value)
    || !["unknown", "not_committed", "persisted"].includes(value.status)) return null;
  const receipt = cleanReceipt(value.receipt, value.requestId);
  return {
    requestId: value.requestId, profile: value.profile, cliPath: value.cliPath,
    status: value.status, ...(receipt ? { receipt } : {}),
  };
}

class JotraSelectionPlugin extends Plugin {
  async onload() {
    const loaded = await this.loadData();
    this.settings = {
      cliPath: typeof loaded?.cliPath === "string" ? loaded.cliPath : SETTINGS.cliPath,
      profile: PROFILE.test(loaded?.profile || "") ? loaded.profile : SETTINGS.profile,
      lastRequest: cleanLastRequest(loaded?.lastRequest),
    };
    this.controller = new AbortController();
    this.busy = false;
    this.addCommand({
      id: "save-selection", name: "Save selection to Jotra",
      editorCallback: (editor) => { void this.captureSelection(editor).catch(() => this.notice("Local metadata could not be saved. Check the last request in Jotra.")); },
    });
    this.addCommand({
      id: "check-last-receipt", name: "Check last Jotra write receipt",
      callback: () => { void this.checkLastReceipt().catch(() => this.notice("Local status could not be updated. Keep the request ID for verification.")); },
    });
    this.addSettingTab(new JotraSettingsTab(this.app, this));
  }

  notice(message) { if (!this.controller.signal.aborted) new Notice(message, 8000); }

  async persist() {
    // Only non-secret settings and minimal receipt metadata, never selected text.
    await this.saveData({
      cliPath: this.settings.cliPath, profile: this.settings.profile,
      lastRequest: cleanLastRequest(this.settings.lastRequest),
    });
  }

  async captureSelection(editor) {
    if (this.busy) return null;
    if (this.settings.lastRequest?.status === "unknown") {
      this.notice("The previous result is unknown. Check its receipt before sending another selection.");
      return null;
    }
    const text = editor.getSelection();
    if (!text.trim()) { this.notice("Select text to save first."); return null; }
    if (!validSettings(this.settings)) { this.notice("Set the absolute Jotra CLI path and authorized profile in plugin settings."); return null; }
    const request = { protocolVersion: 1, requestId: randomUUID(), text, tags: ["Obsidian"], title: "Obsidian selection", url: "" };
    if (Buffer.byteLength(JSON.stringify(request), "utf8") > 262144) { this.notice("This selection exceeds the input byte limit."); return null; }
    this.busy = true;
    try {
      this.settings.lastRequest = { requestId: request.requestId, profile: this.settings.profile, cliPath: this.settings.cliPath, status: "unknown" };
      await this.persist();
      const result = await runCLI(this.settings, "add", request, { signal: this.controller.signal });
      await this.recordResult(result, true);
      return result;
    } finally { this.busy = false; }
  }

  async recordResult(result, writing) {
    const last = this.settings.lastRequest;
    if (!last) return;
    if (result.ok) {
      this.settings.lastRequest = { ...last, status: "persisted", receipt: result.receipt };
      this.notice(`${writing ? "Saved to local Jotra" : "Persistence receipt verified"}. Request: ${last.requestId}`);
    } else if (!writing && last.status === "persisted" && last.receipt) {
      this.notice(`Receipt lookup is unavailable; the previously verified persistence receipt is retained. Request: ${last.requestId}`);
    } else {
      // A failed receipt query never proves an earlier write did not commit.
      const status = writing && result.error.commitState === "not_committed" ? "not_committed" : "unknown";
      this.settings.lastRequest = { ...last, status };
      this.notice(`${status === "unknown" ? "Save result unknown; check the receipt in Jotra" : "Not saved by this attempt"}. ${result.error.code}. Request: ${last.requestId}`);
    }
    try { await this.persist(); } catch {
      this.notice(`The request result was received, but local status could not be saved. Keep request ID: ${last.requestId}`);
    }
  }

  async checkLastReceipt() {
    if (this.busy || !this.settings.lastRequest) return null;
    const last = this.settings.lastRequest;
    this.busy = true;
    try {
      // Query with the original profile/path. Do not switch authorization namespaces.
      const result = await runCLI(last, "receipt", last.requestId, { signal: this.controller.signal });
      await this.recordResult(result, false);
      return result;
    } finally { this.busy = false; }
  }

  onunload() { this.controller?.abort(); }
}

class JotraSettingsTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Jotra local selection (preview)" });
    containerEl.createEl("p", { text: "Requires a compatible local developer-preview CLI and a separately authorized profile. This plugin sends only selected text, using stdin; it never reads Jotra notes." });
    new Setting(containerEl).setName("Jotra CLI absolute path").setDesc("Choose a trusted executable. No shell command or arguments.")
      .addText((input) => input.setPlaceholder("/absolute/path/to/jotra").setValue(this.plugin.settings.cliPath).onChange(async (value) => {
        this.plugin.settings.cliPath = value.trim(); await this.plugin.persist();
      }));
    new Setting(containerEl).setName("Authorized profile").setDesc("Import a dedicated profile with the CLI first. Do not paste pairing materials here.")
      .addText((input) => input.setValue(this.plugin.settings.profile).onChange(async (value) => {
        if (PROFILE.test(value)) { this.plugin.settings.profile = value; await this.plugin.persist(); }
      }));
    const last = this.plugin.settings.lastRequest;
    if (last) {
      containerEl.createEl("p", { text: `Last request: ${last.requestId} (${last.status})` });
      new Setting(containerEl).setName("Check last write receipt").addButton((button) => button.setButtonText("Check receipt").onClick(() => this.plugin.checkLastReceipt()));
      if (last.status === "unknown") containerEl.createEl("p", { text: "Do not replace the original CLI authorization while a request is unresolved. If it was revoked, use Jotra's local-tools management view to verify that request before any manual recovery." });
    }
  }
}

module.exports = JotraSelectionPlugin;
module.exports.adapter = { runCLI, parseResult, safeEnvironment, cleanReceipt, cleanLastRequest, validSettings };
