#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "settings.html"), "utf8");
const appStart = html.indexOf('<div class="page-shell" id="app"');
const errorStart = html.indexOf('<div id="settings-auth-error"');
assert.notEqual(errorStart, -1, "accessible auth/bootstrap error state must exist");
assert.notEqual(appStart, -1, "protected settings application must exist");
assert.ok(errorStart < appStart, "error state must be outside the protected application");
assert.match(html, /id="settings-auth-error" role="alert" aria-live="assertive" data-visible="false"/);
assert.match(html, /#settings-auth-error\[data-visible="true"\]\{display:block\}/);
assert.doesNotMatch(html, /catch\(e\)\{document\.getElementById\('app'\)\.style\.display='flex';console\.warn\(e\);\}/,
  "bootstrap failure must never reveal protected settings");
assert.match(html, /if\(app\)app\.style\.display='none';var error=document\.getElementById\('settings-auth-error'\);if\(error\)error\.setAttribute\('data-visible','true'\)/,
  "bootstrap failure must keep settings hidden and show the error state");
console.log("SETTINGS FAIL-CLOSED SOURCE CONTRACT TEST: PASS");
