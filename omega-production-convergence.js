(function (global) {
  "use strict";
  var STATES = Object.freeze({ PASS: "PASS", UNVERIFIED: "UNVERIFIED", BLOCKED: "BLOCKED" });
  function evaluateGate(input) {
    input = input || {};
    var required = Array.isArray(input.required) ? input.required : [];
    var evidence = Array.isArray(input.evidence) ? input.evidence : [];
    var missing = required.filter(function (item) { return evidence.indexOf(item) === -1; });
    var ownerAction = input.ownerAction === true;
    var state = missing.length === 0 ? STATES.PASS : (ownerAction ? STATES.UNVERIFIED : STATES.BLOCKED);
    return { truth: "CALCULATED", id: String(input.id || "unknown"), priority: String(input.priority || "P1"), state: state, ownerAction: ownerAction, missingEvidence: missing, blockers: state === STATES.BLOCKED ? (Array.isArray(input.blockers) ? input.blockers : []).concat(missing) : [], promotionAllowed: state === STATES.PASS };
  }
  function evaluate(input) {
    input = input || {};
    var gates = Array.isArray(input.gates) ? input.gates.map(evaluateGate) : [];
    var blocked = gates.filter(function (g) { return g.state === STATES.BLOCKED; });
    var unverified = gates.filter(function (g) { return g.state === STATES.UNVERIFIED; });
    return { truth: "CALCULATED", state: blocked.length ? STATES.BLOCKED : (unverified.length ? STATES.UNVERIFIED : STATES.PASS), productionAllowed: blocked.length === 0 && unverified.length === 0, gates: gates, p0Open: gates.filter(function (g) { return g.priority === "P0" && g.state !== STATES.PASS; }).map(function (g) { return g.id; }), blockers: blocked.map(function (g) { return g.id; }), ownerActions: unverified.map(function (g) { return g.id; }) };
  }
  global.OmegaProductionConvergence = Object.freeze({ STATES: STATES, evaluateGate: evaluateGate, evaluate: evaluate });
})(typeof globalThis !== "undefined" ? globalThis : window);
