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

/* ---- mana: the member's OWN recent activity, nothing platform-wide, fades without use ---- */
const NOW = "2026-11-15T12:00:00Z";
const daysAgo = (n) => new Date(Date.parse(NOW) - n * 86400000).toISOString();
const busy = {
  userId: "u1", now: NOW,
  tasks: [0, 1, 2, 3, 4].map((n) => ({ completed_at: daysAgo(n), points_earned: 10 })),
  evolution: [{ created_at: daysAgo(10) }],
  events: [{ created_at: daysAgo(20) }],
  missions: [
    { status: "active", started_at: daysAgo(3), last_transition_at: daysAgo(2) },
    { status: "completed", completed_at: daysAgo(5) },
    { status: "completed", completed_at: daysAgo(6) }
  ]
};
const mana = omega.calculateMana(busy);
assert.equal(mana.truth, "CALCULATED");
assert.equal(mana.components.LEARNING, 50);          // 5 learning tasks x 10
assert.equal(mana.sources.activeDays, 7);             // days 0-4, 10, 20
assert.equal(mana.components.FOCUS, Math.round(7 / 30 * 100));
assert.equal(mana.components.COLLABORATION, 7);       // 1 active mission x 7
assert.equal(mana.components.EXECUTION, 20);          // 2 completed missions x 10
assert.equal(mana.components.CREATIVE, null);         // no recorded source: never filled in
assert.equal(JSON.stringify(mana.unsourcedComponents), '["CREATIVE"]'); // JSON: the VM context has its own Array prototype
assert.ok(mana.total >= 0 && mana.total <= 100);
assert.match(mana.disclaimer, /non-financial/);

// a member with no activity gets 0, not free points (profile fields and platform tables never count)
const none = omega.calculateMana({
  userId: "u2", now: NOW,
  verifiedCapabilities: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n"],
  explicitPreferences: ["Aries", "fire", "Sentinel"],
  systemCapacity: { available: true }
});
assert.equal(none.total, 0);
assert.ok(["FOCUS", "LEARNING", "COLLABORATION", "EXECUTION"].every((k) => none.components[k] === 0));

// two members with different recorded activity get different mana
assert.notEqual(omega.calculateMana(busy).total, omega.calculateMana({ userId: "u3", now: NOW, tasks: busy.tasks.slice(0, 1) }).total);

// it fades without use: the same activity read 31 days later is gone
const later = omega.calculateMana(Object.assign({}, busy, { now: new Date(Date.parse(NOW) + 31 * 86400000).toISOString() }));
assert.equal(later.total, 0);

// rows outside the window, without a timestamp, or with a bad one are ignored, never guessed
const junk = omega.calculateMana({
  userId: "u4", now: NOW,
  tasks: [{ points_earned: 10 }, { completed_at: "not a date", points_earned: 10 }, { completed_at: daysAgo(45), points_earned: 10 },
          { completed_at: new Date(Date.parse(NOW) + 86400000).toISOString(), points_earned: 10 }, null],
  missions: [{ status: "completed" }, { status: "active" }]
});
assert.equal(junk.total, 0);

// mission status is lowercase in the database; matching is case-insensitive so a case mismatch cannot silence it
assert.equal(omega.calculateMana({ userId: "u5", now: NOW, missions: [{ status: "COMPLETED", completed_at: daysAgo(1) }] }).components.EXECUTION, 10);

// bad inputs never throw
assert.doesNotThrow(() => omega.calculateMana({ userId: "u6", tasks: "x", evolution: 5, events: {}, missions: null }));
assert.equal(omega.calculateMana({}).truth, "BLOCKED");

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