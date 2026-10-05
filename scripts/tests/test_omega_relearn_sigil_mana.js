const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("omega-relearn-sigil-mana.js", "utf8");
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const omega = context.globalThis.OmegaRelearnSigilMana;

assert.equal(omega.createRelearn({}).truth, "BLOCKED");

const relearn = omega.createRelearn({
  userId: "u1",
  learningId: "l1",
  lesson: "The workflow failed because authorization evidence was missing.",
  sourceReferences: ["evidence-1"]
});
assert.equal(relearn.truth, "USER_CREATED");
assert.equal(relearn.currentStage, "CAPTURE");
assert.equal(relearn.nextStage, "REFLECT");

const verified = omega.verifyRelearn({
  relearnId: relearn.id,
  evidenceId: "evidence-2",
  outcome: "Retry completed with authorization evidence."
});
assert.equal(verified.truth, "VERIFIED");

const sigil = omega.createSigil({
  userId: "u1",
  declaredTraits: ["builder", "learner"],
  verifiedMilestones: ["mission-17"],
  affiliations: ["Aurelia"]
});
assert.equal(sigil.truth, "CALCULATED");
assert.match(sigil.securityNote, /not an authentication credential/);

const evolved = omega.evolveSigil({
  sigilId: sigil.id,
  verifiedMilestone: "mission-18",
  version: sigil.version
});
assert.equal(evolved.truth, "VERIFIED");
assert.equal(evolved.version, 2);

const mana = omega.calculateMana({
  userId: "u1",
  verifiedCapabilities: ["search", "missions"],
  activeMissions: ["m1"],
  verifiedLearning: ["l1", "l2"],
  explicitPreferences: ["visual", "concise"],
  systemCapacity: { available: true }
});
assert.equal(mana.truth, "CALCULATED");
assert.equal(mana.components.LEARNING, 20);
assert.ok(mana.total >= 0 && mana.total <= 100);
assert.match(mana.disclaimer, /non-financial/);

assert.equal(
  omega.spendMana({ userId: "u1", component: "EXECUTION", amount: 10 }).truth,
  "BLOCKED"
);

const spent = omega.spendMana({
  userId: "u1",
  component: "EXECUTION",
  amount: 10,
  authorizationId: "auth-1"
});
assert.equal(spent.truth, "CALCULATED");

const recovered = omega.recoverMana({
  userId: "u1",
  component: "LEARNING",
  amount: 12,
  evidenceId: "evidence-3"
});
assert.equal(recovered.truth, "VERIFIED");

const publicRep = omega.representCivilization({
  userId: "u1",
  visibility: "CIVILIZATION_AGGREGATE",
  city: "Meridian Gate",
  country: "Aurelia",
  civilization: "Ω Commonwealth",
  roles: ["learner"],
  services: ["Academy"],
  verified: true
});
assert.equal(publicRep.truth, "VERIFIED");
assert.match(publicRep.privacyRule, /never implies legal citizenship/);

console.log("OMEGA_RELEARN_SIGIL_MANA=PASS");