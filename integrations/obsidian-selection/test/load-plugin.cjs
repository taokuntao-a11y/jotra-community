"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadPlugin(options = {}) {
  const notices = [];
  class Plugin {
    constructor() { this.commands = []; this.saved = []; this.app = {}; }
    async loadData() { return options.data || null; }
    async saveData(value) {
      if (options.failSave) throw new Error("test persistence failure");
      this.saved.push(JSON.parse(JSON.stringify(value)));
    }
    addCommand(command) { this.commands.push(command); }
    addSettingTab(tab) { this.settingTab = tab; }
  }
  class PluginSettingTab { constructor(app, plugin) { this.app = app; this.plugin = plugin; } }
  class Notice { constructor(message) { notices.push(message); } }
  const context = {
    module: { exports: {} }, Buffer, process, AbortController, setTimeout, clearTimeout,
    require: (name) => name === "obsidian" ? { Plugin, PluginSettingTab, Notice, Setting: class {} } : require(name),
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../main.js"), "utf8"), context, { filename: "jotra-selection/main.js" });
  return { Plugin: context.module.exports, notices };
}

module.exports = { loadPlugin };
