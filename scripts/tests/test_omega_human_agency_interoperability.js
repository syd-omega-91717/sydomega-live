const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function load(file, name) {
  const source = fs.readFileSync(file, "utf8");
  const context = { console, Date, globalThis: {} };
  vm.runInNewContext(source, context);
  assert.ok(context.globalThis[name], name + " must be exposed");
  return context.globalThis[name];
}

const agency = load("omega-human-agency.js", "OmegaHumanAgency");
const fabric = load("omega-interoperability-fabric.js", "OmegaInteroperabilityFabric");

const idea = agency.createIdea({
  title: "User-created invention",
  description: "A new way to connect learning and missions.",
  author: "authenticated-user"
});
assert.equal(idea.truth, "USER_CREATED");
assert.equal(idea.state, "CAPTURED");

const goal = agency.buildLifeGoal({
  goal: "Build a verified learning path",
  domain: "education"
});
assert.equal(goal.state, "USER_DEFINED");

const persona = agency.summarizePersona({
  name: "Omega Explorer",
  values: ["curiosity", "safety"],
  boundaries: ["no automated financial actions"]
});
assert.equal(persona.state, "USER_AUTHORED");

const blockedAgent = agency.authorizeAgentAction({
  category: "finance",
  financial: true,
  irreversible: true,
  authorized: true,
  capabilityEnabled: true,
  scopeGranted: true,
  mode: "AUTOMATION",
  humanApproved: false
});
assert.equal(blockedAgent.allowed, false);
assert.ok(blockedAgent.reasons.includes("human approval required"));

const robot = agency.createRobotCommand({
  robotId: "robot-001",
  command: "inspect-zone",
  identityVerified: true,
  capabilityEnabled: true,
  authorizationVerified: true,
  humanApproved: true,
  safetyState: "SAFE"
});
assert.equal(robot.state, "READY_FOR_GOVERNED_EXECUTION");

const blockedRobot = agency.createRobotCommand({
  robotId: "robot-001",
  command: "move",
  identityVerified: true,
  capabilityEnabled: true,
  authorizationVerified: false,
  humanApproved: true,
  safetyState: "SAFE"
});
assert.equal(blockedRobot.state, "BLOCKED");

const adapter = fabric.validateAdapterRequest({
  protocol: "mcp",
  identityVerified: true,
  authorizationVerified: true,
  scopeGranted: true,
  capabilityRegistered: true
});
assert.equal(adapter.state, "READY");

const credential = fabric.validateCredential({
  issuerVerified: true,
  subjectVerified: true,
  signatureVerified: true,
  purposeAllowed: true,
  revocationChecked: true
});
assert.equal(credential.state, "VERIFIED");

const telemetry = fabric.validateTelemetry({
  deviceIdentityVerified: true,
  channelAuthorized: true,
  encrypted: true,
  freshnessVerified: true
});
assert.equal(telemetry.state, "OBSERVED");

const simulatedTwin = fabric.validateSpatialState({
  sourceVerified: true,
  timestampVerified: true,
  coordinateReferenceVerified: true,
  simulation: true,
  simulationLabel: true
});
assert.equal(simulatedTwin.state, "SIMULATED");

console.log("OMEGA_HUMAN_AGENCY_INTEROPERABILITY=PASS");
