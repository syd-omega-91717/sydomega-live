#!/usr/bin/env node
"use strict";
/* Settings and Security live in profile.html (FIXES_LOG 203). This contract keeps the property the old
   test protected: nothing protected is ever shown outside the approval-gated application shell. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const profile = read("profile.html");
const settingsShim = read("settings.html");
const securityShim = read("security.html");
const mod = read("omega-profile-settings.js");

// 1. The old pages are redirect shims: no protected control may live in them.
for (const [name, html] of [["settings.html", settingsShim], ["security.html", securityShim]]) {
  assert.match(html, /location\.replace\('\/profile\.html'/, name + " must redirect into the profile");
  assert.doesNotMatch(html, /btn-delete|btn-deactivate|btn-logout|data-omega-mfa/, name + " must not carry protected controls");
}
assert.match(settingsShim, /#two-factor/, "the two-factor deep link (approvals.js, owner deck) must survive the redirect");

// 2. The destructive controls exist exactly once in the repo, inside the profile's protected shell.
const shellStart = profile.indexOf('<main class="main">');
assert.notEqual(shellStart, -1, "profile.html must have its protected main shell");
for (const id of ["btn-delete", "btn-deactivate", "btn-logout", "data-omega-mfa"]) {
  const at = profile.indexOf(id);
  assert.notEqual(at, -1, id + " must exist in profile.html");
  assert.ok(at > shellStart, id + " must sit inside the protected shell, not before it");
  assert.equal(profile.indexOf(id, at + 1) === -1 || id === "data-omega-mfa", true, id + " must not be duplicated");
}

// 3. The settings module must never reveal or hide the page: gating belongs to profile.html + bg.js.
assert.doesNotMatch(mod, /getElementById\('app'\)\.style\.display\s*=\s*'flex'/, "settings module must not reveal the protected shell");
assert.doesNotMatch(mod, /location\.(replace|href)\s*=?\s*\(?\s*'\/pending\.html/, "approval redirects stay in profile.html");

// 4. Every write the module makes checks its result (CLAUDE.md 8.1 class 1): deactivate/delete read r.data.ok.
assert.match(mod, /r\.data&&r\.data\.ok/, "account RPC results must be checked before success is shown");
console.log("SETTINGS + SECURITY IN PROFILE: FAIL-CLOSED SOURCE CONTRACT TEST: PASS");
