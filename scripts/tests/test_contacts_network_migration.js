#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "contacts.html"), "utf8");
const start = html.indexOf("function migrateNetworkStore(){");
const end = html.indexOf("\ntry{migrateNetworkStore();}", start);
if (start < 0 || end < 0) throw new Error("contacts migration function not found");
const migrationSource = html.slice(start, end);

const storage = new Map([
  ["omega_contacts", JSON.stringify([{ id: 7, name: "Existing Contact" }])],
  ["omega_contact_ints", "[]"],
  ["omega_network_contacts", "[]"],
  ["omega_network_interactions", JSON.stringify([
    { id: 41, contactId: "7", date: "2026-10-01", note: "Follow-up", type: "call" }
  ])]
]);
const context = {
  contacts: JSON.parse(storage.get("omega_contacts")),
  interactions: JSON.parse(storage.get("omega_contact_ints")),
  CAT_COLORS: {},
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); }
  },
  console,
  Date
};
vm.runInNewContext(migrationSource + "\nmigrateNetworkStore();", context);
assert.equal(context.interactions.length, 1, "legacy interaction should migrate without legacy contact rows");
assert.equal(String(context.interactions[0].contactId), "7", "string legacy id should resolve to canonical numeric id");
assert.equal(context.interactions[0].date, "2026-10-01");
assert.equal(context.interactions[0].note, "Follow-up");

vm.runInNewContext(migrationSource + "\nmigrateNetworkStore();", context);
assert.equal(context.interactions.length, 1, "re-running migration should not duplicate the same interaction");
assert.equal(JSON.parse(storage.get("omega_contact_ints")).length, 1, "canonical interaction must persist");
console.log("CONTACTS LEGACY INTERACTION MIGRATION TEST: PASS");
