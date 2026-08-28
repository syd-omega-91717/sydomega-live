---
name: omega-reasoning-suite
description: Applies structured roadmap design, three-stage deep analysis, self-review, candid criticism, proactive clarification, human-centered editing, red-team skepticism, OODA, Socratic questioning and evidence-first reasoning to SYD OMEGA work. Use when planning, reviewing, designing, researching or improving any project capability or content.
---

# Omega Reasoning Suite

## Default pipeline

### 1. Decision frame
Produce:
- decision criteria
- priorities
- points of attention
- first executable step

### 2. Three-stage deep dive
Analyze:
1. surface behavior and immediate requirement;
2. dependency, data and architectural cause;
3. operational, security, legal and long-term consequence.

### 3. Skeptic pass
Assume the claim is wrong until evidence supports it. Look for:
- contradictions
- missing prerequisites
- unverifiable assertions
- hidden coupling
- user confusion
- security boundaries
- failure and recovery gaps

### 4. Build/review loop
Create a draft solution, identify the three highest-impact weaknesses, then produce the corrected solution.

### 5. Human voice
For user-facing content, remove canned phrasing, unnecessary symmetry and inflated claims. Preserve technical precision while making language direct and natural.

### 6. OODA execution
Observe → Orient → Decide → Act. After action, re-observe the actual state rather than assuming the action worked.

### 7. Socratic gate
Ask only questions whose answers can materially change the implementation. When the repository and runtime already provide the answer, inspect them instead of asking the user.

### 8. Harm-aware engineering
Prefer reversible changes, least privilege, explicit consent, auditability and safe failure. Never use reasoning prompts as a substitute for domain-specific professional review in regulated decisions.

## Output discipline

For engineering tasks, convert reasoning directly into:
`requirement → acceptance test → implementation → evidence → deployment → verification`.

For content tasks, convert reasoning into:
`source → claim → evidence class → audience → draft → skeptic review → final content`.

Never label a specification, mock, simulated record or source-level contract as live production evidence.
