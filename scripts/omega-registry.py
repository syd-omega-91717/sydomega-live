#!/usr/bin/env python3
"""
Generate and verify OMEGA_SKILL_REGISTRY.md from what is actually on disk.

WHY THIS EXISTS

Every count describing this repo's own agent infrastructure was hand-typed,
and every one of them had drifted by the time it was checked:

  .claude/skills/README.md   said "Four skills"      -- 8 exist
  CLAUDE.md sec.10           said "Five skills"      -- 8 exist
  CLAUDE.md sec.11           said "4-skill pipeline" -- 8 exist
  CLAUDE.md sec.2            said "~250 .html pages" -- 178 exist
  CLAUDE.md sec.2            said bg.js is loaded by
                             "104+ of ~250 pages"    -- 178 of 178 (100%)

and `.claude/skills/grill-me-codex/SKILL.md`, the safety gate for auth/schema/
payments/RLS work, had no YAML frontmatter at all -- so it had no `name:` and
no `description:`, which is what a coding agent matches on to decide whether a
skill applies. The one skill whose whole job is to stop a high-risk change from
going in unexamined was the single least discoverable skill in the repo.

None of that is a typo problem. It is what happens when a number that changes
is stored in prose. So this file derives all of it from the filesystem and
`--check` fails CI when the committed registry no longer matches reality --
the same generated-artifact pattern already used by types-from-schema.py.

  python3 scripts/omega-registry.py            # regenerate the registry
  python3 scripts/omega-registry.py --check    # verify it, exit 1 on drift

Two conditions are hard errors in BOTH modes, because they break skill
discovery rather than merely describing it wrongly:
  - a SKILL.md with no YAML frontmatter
  - a frontmatter with no `name:` or no `description:`
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)

REGISTRY = Path("OMEGA_SKILL_REGISTRY.md")
SKILLS_DIR = Path(".claude/skills")
AGENTS_DIR = Path(".claude/agents")

# Match scripts/context-budget.py so token figures are comparable across tools.
BYTES_PER_TOKEN = 4

# Docs that are expected to describe the skill pipeline. A skill named in none
# of them is reachable only by someone who already knows it exists.
REFERENCE_DOCS = [Path("CLAUDE.md"), SKILLS_DIR / "README.md"]

# How far the ONE recorded scratch-database run actually reached. This is a
# fact about a run that happened, so it is pinned here rather than derived from
# the current file count -- the generated text used to say
# `0001`-`00{numbered}`, which meant every newly added numbered migration
# silently claimed to have been part of a validation it was never in. Evidence:
# supabase/migrations/README.md, heading "Full 94-file sequence validated
# end-to-end for the first time". Raise this ONLY after a run that actually
# covers the higher number, and record that run in the README first.
VALIDATED_MIGRATIONS = 94


def approx_tokens(path: Path) -> int:
    return path.stat().st_size // BYTES_PER_TOKEN


def parse_frontmatter(path: Path):
    """Return (fields, error). Deliberately a minimal stdlib parser: this repo
    has no build step and no dependency manifest, so importing yaml is not an
    option. Handles the `key: value` + folded-continuation subset that the
    skill files actually use."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}, "no YAML frontmatter (a skill without one has no name/description to match on)"
    end = text.find("\n---", 3)
    if end == -1:
        return {}, "frontmatter opened with --- but never closed"
    body = text[3:end]
    fields, key = {}, None
    for line in body.splitlines():
        if not line.strip():
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$", line)
        if m:
            key = m.group(1)
            fields[key] = m.group(2).strip()
        elif key and line.startswith((" ", "\t")):
            fields[key] += " " + line.strip()
    for required in ("name", "description"):
        if not fields.get(required):
            return fields, f"frontmatter has no `{required}:`"
    return fields, None


def first_sentence(text: str, limit: int = 155) -> str:
    text = " ".join(text.split())
    cut = text.find(". ")
    if 0 < cut < limit:
        return text[: cut + 1]
    return text if len(text) <= limit else text[: limit - 1].rsplit(" ", 1)[0] + "…"


def _shallow_boundary() -> set:
    """SHAs of this clone's graft points, empty for a complete clone.

    A shallow clone's history stops at these commits: git has the commit
    objects but not their parents, so anything older is invisible. That is what
    makes `git log -1 -- <path>` unreliable here -- see git_last_touched.
    """
    try:
        gd = subprocess.run(["git", "rev-parse", "--git-dir"],
                            capture_output=True, text=True, timeout=20).stdout.strip()
        if not gd:
            return set()
        f = Path(gd) / "shallow"
        if not f.is_file():
            return set()
        return {ln.strip() for ln in f.read_text().splitlines() if ln.strip()}
    except Exception:
        return set()


_SHALLOW = None
_UNRELIABLE_DATES = []


def git_last_touched(path: Path) -> str:
    """Date of the commit that last touched `path`, or a refusal to guess.

    THE TRAP: in a shallow clone `git log -1 -- <path>` does not fail when the
    real commit is beyond the graft boundary -- it silently reports the
    BOUNDARY commit instead. At `--depth 1` that means every file in the repo
    dates to the moment of the clone. `actions/checkout@v4` is shallow by
    default, so CI would regenerate every "Last touched" cell as the CI run's
    own date, compare it against real dates committed from a deeper clone, and
    fail `--check` on drift that does not exist. Reproduced: a depth-1 clone of
    this repo reports 2026-08-29 for a file whose only commit is 90c310d7 on
    2026-08-11, and three skills sit committed as 2026-08-15 for exactly this
    reason.

    Being shallow is not itself the problem -- this repo is routinely cloned at
    depth ~480, which is deep enough that every skill's real commit is present.
    The problem is only when the answer IS the boundary, so that is what is
    detected, rather than refusing on any shallow clone and breaking a checkout
    that can answer correctly.
    """
    global _SHALLOW
    if _SHALLOW is None:
        _SHALLOW = _shallow_boundary()
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%H %ad", "--date=short", "--", str(path)],
            capture_output=True, text=True, timeout=20,
        )
        line = out.stdout.strip()
        if not line:
            return "uncommitted"
        sha, _, date = line.partition(" ")
        if sha in _SHALLOW:
            _UNRELIABLE_DATES.append(str(path))
            return "unknown"
        return date.strip() or "uncommitted"
    except Exception:
        return "unknown"


def report_unreliable_dates() -> None:
    """Fail loudly rather than commit dates the clone could not actually know."""
    if not _UNRELIABLE_DATES:
        return
    raise SystemExit(
        "omega-registry: %d file(s) last changed at or before this shallow\n"
        "  clone's graft boundary, so their real dates are unknowable here and\n"
        "  writing them would silently poison the generated registry:\n%s\n"
        "  Fix: deepen the clone (`git fetch --unshallow`), or in CI set\n"
        "       - uses: actions/checkout@v4\n"
        "         with:\n"
        "           fetch-depth: 0"
        % (len(_UNRELIABLE_DATES),
           "".join("    %s\n" % p for p in _UNRELIABLE_DATES[:10])))


def collect_skills():
    skills, errors = [], []
    for skill_md in sorted(SKILLS_DIR.glob("*/SKILL.md")):
        name = skill_md.parent.name
        fields, err = parse_frontmatter(skill_md)
        if err:
            errors.append(f"{skill_md}: {err}")
        support = sorted(
            p for p in skill_md.parent.rglob("*") if p.is_file() and p.name != "SKILL.md"
        )
        mentioned_in = [
            str(doc) for doc in REFERENCE_DOCS
            if doc.exists() and name in doc.read_text(encoding="utf-8")
        ]
        skills.append({
            "name": fields.get("name", name),
            "dir": name,
            "path": skill_md,
            "description": fields.get("description", ""),
            "bytes": skill_md.stat().st_size,
            "tokens": approx_tokens(skill_md),
            "support": support,
            "mentioned_in": mentioned_in,
            "last_touched": git_last_touched(skill_md),
            "frontmatter_ok": err is None,
        })
    return skills, errors


def collect_agents():
    agents = []
    if not AGENTS_DIR.is_dir():
        return agents
    for md in sorted(AGENTS_DIR.glob("*.md")):
        text = md.read_text(encoding="utf-8")
        role = ""
        m = re.search(r"^\*\*Role:\*\*\s*(.+)$", text, re.M)
        if m:
            role = m.group(1).strip()
        else:
            for line in text.splitlines():
                if line.strip() and not line.startswith("#"):
                    role = line.strip()
                    break
        agents.append({
            "name": md.stem,
            "path": md,
            "role": first_sentence(role),
            "tokens": approx_tokens(md),
            "last_touched": git_last_touched(md),
        })
    return agents


def platform_census():
    pages = sorted(Path(".").glob("*.html"))
    modules = sorted(Path(".").glob("omega-*.js"))
    root_js = sorted(Path(".").glob("*.js"))
    bg_pages = [p for p in pages if "bg.js" in p.read_text(encoding="utf-8", errors="ignore")]
    module_kb = sum(p.stat().st_size for p in modules) // 1024
    return {
        "pages": len(pages),
        "pages_loading_bg": len(bg_pages),
        "omega_modules": len(modules),
        "omega_modules_kb": module_kb,
        "root_js": len(root_js),
        "sql_bag": len(list(Path("supabase").glob("*.sql"))),
        "migrations": len(list(Path("supabase/migrations").glob("*.sql"))),
        "migrations_numbered": len([p for p in Path("supabase/migrations").glob("*.sql")
                                    if re.match(r"^\d{4}_", p.name)]),
        "migrations_timestamped": len([p for p in Path("supabase/migrations").glob("*.sql")
                                       if re.match(r"^\d{8}", p.name)]),
        "edge_functions": len([d for d in Path("supabase/functions").glob("*") if d.is_dir()])
                          if Path("supabase/functions").is_dir() else 0,
        "skills": len(list(SKILLS_DIR.glob("*/SKILL.md"))),
        "agents": len(list(AGENTS_DIR.glob("*.md"))) if AGENTS_DIR.is_dir() else 0,
        "i18n": i18n_census(),
    }


def i18n_census():
    """English dictionary size and each pack's key count.

    Recorded here so a pack that LOSES keys changes a committed number and
    fails `--check`. Three language packs once shipped 14 keys short for weeks
    -- one commit wrote the translations but left the files unparseable, the
    next restored the pre-translation blobs to clear the parse error and
    dropped the translations with it. Both were green, because no check
    anywhere counted these.
    """
    js = Path("i18n.js")
    if not js.is_file():
        return None
    m = re.search(r"var T_EN=\{(.*?)\n\};", js.read_text(encoding="utf-8"), re.S)
    if not m:
        return None
    out = {"en": len(re.findall(r'^"([^"]+)"\s*:', m.group(1), re.M)), "packs": {}}
    for pack in sorted(Path("i18n").glob("*.json")) if Path("i18n").is_dir() else []:
        try:
            out["packs"][pack.stem] = len(json.loads(pack.read_text(encoding="utf-8")))
        except Exception:
            # An unparseable pack is exactly the failure this census exists to
            # surface, so it is recorded rather than skipped.
            out["packs"][pack.stem] = "UNPARSEABLE"
    return out


def render(skills, agents, census) -> str:
    total_tokens = sum(s["tokens"] for s in skills)
    L = []
    add = L.append

    add("# OMEGA_SKILL_REGISTRY")
    add("")
    add("**Generated file — do not edit by hand.**")
    add("Regenerate with `python3 scripts/omega-registry.py`;")
    add("`--check` runs in CI and fails when this file no longer matches the repo.")
    add("")
    add("Every number here is read off the filesystem at generation time. It exists")
    add("because the hand-written equivalents all drifted: `.claude/skills/README.md`")
    add('said "Four skills", `CLAUDE.md` §10 said "Five", §11 said "4-skill pipeline",')
    add(f"and {census['skills']} exist.")
    add("")

    # ---------------- skills ----------------
    add("## 1 · Skills")
    add("")
    add("`.claude/skills/<name>/SKILL.md`. **Discoverable** means the frontmatter carries")
    add("both a `name:` and a `description:` — that description is what a coding agent")
    add("matches against to decide whether the skill applies, so a skill without one is")
    add("effectively invisible unless invoked by exact name.")
    add("")
    add("| Skill | Discoverable | Support files | ~tokens | Named in | Last touched |")
    add("|---|---|---|---|---|---|")
    for s in skills:
        support = f"{len(s['support'])}" if s["support"] else "—"
        named = ", ".join(Path(d).name for d in s["mentioned_in"]) or "**nothing**"
        ok = "yes" if s["frontmatter_ok"] else "**NO**"
        add(f"| `{s['name']}` | {ok} | {support} | {s['tokens']:,} | {named} | {s['last_touched']} |")
    add("")
    add(f"**{len(skills)} skills, ~{total_tokens:,} tokens** if every SKILL.md were read in one")
    add("session. They are loaded on demand, so that total is a ceiling, not a per-session cost.")
    add("")
    orphans = [s for s in skills if not s["mentioned_in"]]
    if orphans:
        add(f"> **{len(orphans)} skill(s) named in no reference doc:** "
            + ", ".join(f"`{s['name']}`" for s in orphans)
            + ". Reachable by description-matching, but a reader of `CLAUDE.md` or")
        add("> `.claude/skills/README.md` will not learn they exist.")
        add("")

    add("### Purpose of each")
    add("")
    for s in skills:
        add(f"- **`{s['name']}`** — {first_sentence(s['description']) or '_no description in frontmatter_'}")
        if s["support"]:
            add(f"  - carries: {', '.join('`' + str(p.relative_to(s['path'].parent)) + '`' for p in s['support'])}")
    add("")

    # ---------------- agents ----------------
    add("## 2 · Agents")
    add("")
    if agents:
        add("`.claude/agents/*.md`. These are conversational role definitions, not a runtime —")
        add("this repo has no multi-agent execution engine (see `CLAUDE.md` §6).")
        add("")
        add("| Agent | Role | ~tokens | Last touched |")
        add("|---|---|---|---|")
        for a in agents:
            add(f"| `{a['name']}` | {a['role']} | {a['tokens']:,} | {a['last_touched']} |")
    else:
        add("_No agent definitions on disk._")
    add("")

    # ---------------- census ----------------
    add("## 3 · Platform census")
    add("")
    add("Counted at generation time. These are the numbers that kept going stale in prose.")
    add("")
    add("| What | Count |")
    add("|---|---|")
    add(f"| `.html` pages | {census['pages']} |")
    add(f"| pages loading `bg.js` | {census['pages_loading_bg']} of {census['pages']} |")
    add(f"| `omega-*.js` modules | {census['omega_modules']} ({census['omega_modules_kb']} KB) |")
    add(f"| root `.js` files | {census['root_js']} |")
    add(f"| `supabase/*.sql` (flat bag) | {census['sql_bag']} |")
    add(f"| `supabase/migrations/*.sql` | {census['migrations']} "
        f"({census['migrations_numbered']} numbered `NNNN_`, "
        f"{census['migrations_timestamped']} timestamped) |")
    add(f"| Edge Functions | {census['edge_functions']} |")
    add(f"| skills | {census['skills']} |")
    add(f"| agent definitions | {census['agents']} |")
    add("")

    i18n = census.get("i18n")
    if i18n:
        add("### Translation coverage")
        add("")
        add("Committed on purpose: a pack that loses keys changes a number here and")
        add("fails `--check`. `scripts/i18n-contract.py` enforces the rest (every")
        add("`data-i18n` key resolves, no orphan pack keys, no HTML entities in values).")
        add("")
        add("| Source | Keys |")
        add("|---|---|")
        add(f"| `T_EN` (English, inlined in `i18n.js`) | {i18n['en']} |")
        for lang, n in sorted(i18n["packs"].items()):
            gap = "" if n == i18n["en"] else (
                " — **%s**" % n if n == "UNPARSEABLE"
                else " — %d short of `T_EN`" % (i18n["en"] - n))
            add(f"| `i18n/{lang}.json` | {n}{gap} |")
        add("")
    if census["migrations_timestamped"]:
        unvalidated = census["migrations"] - VALIDATED_MIGRATIONS
        add(f"`supabase/migrations/README.md` records exactly one end-to-end run against a")
        add(f"fresh scratch PostgreSQL 16 instance, covering the **{VALIDATED_MIGRATIONS}-file numbered sequence**")
        add(f"(`0001`–`{VALIDATED_MIGRATIONS:04d}`) — see its heading *\"Full {VALIDATED_MIGRATIONS}-file sequence validated")
        add(f"end-to-end for the first time\"*. The {unvalidated} files added since (numbered and")
        add(f"timestamped alike) were **not part of that validation**, and no run has covered")
        add(f"all {census['migrations']}. Treat the validated scope as `0001`–`{VALIDATED_MIGRATIONS:04d}` only.")
        add("")

    if census["pages_loading_bg"] == census["pages"]:
        add(f"**`bg.js` is loaded by all {census['pages']} pages.** It is a hard single point of")
        add("failure for the entire platform, not a partial one — if it fails to parse, every")
        add("page is down. This is why `node --check` on it gates CI.")
    else:
        gap = census["pages"] - census["pages_loading_bg"]
        add(f"**{gap} page(s) do not load `bg.js`** and therefore get no design system, no")
        add("approval guard, and no platform modules.")
    add("")
    return "\n".join(L) + "\n"


def main():
    check = "--check" in sys.argv

    skills, errors = collect_skills()
    agents = collect_agents()
    report_unreliable_dates()
    census = platform_census()
    generated = render(skills, agents, census)

    print("=" * 68)
    print("OMEGA REGISTRY  --  skills, agents, platform census")
    print("=" * 68)
    print(f"  skills: {len(skills)}   agents: {len(agents)}   pages: {census['pages']}")

    if errors:
        print("\nFAIL  skill discovery is broken:")
        for e in errors:
            print(f"  - {e}")
        print("\n  A skill with no name/description cannot be matched by an agent.")
        return 1

    if check:
        if not REGISTRY.exists():
            print(f"\nFAIL  {REGISTRY} does not exist. Run: python3 scripts/omega-registry.py")
            return 1
        current = REGISTRY.read_text(encoding="utf-8")
        if current != generated:
            print(f"\nFAIL  {REGISTRY} is out of date.")
            import difflib
            diff = list(difflib.unified_diff(
                current.splitlines(), generated.splitlines(),
                fromfile=f"{REGISTRY} (committed)", tofile="(regenerated)", lineterm="", n=1))
            for line in diff[:40]:
                print("  " + line)
            if len(diff) > 40:
                print(f"  ... {len(diff) - 40} more diff lines")
            print("\n  Fix: python3 scripts/omega-registry.py && git add OMEGA_SKILL_REGISTRY.md")
            return 1
        print(f"\n  OK — {REGISTRY} matches the repo.")
        return 0

    REGISTRY.write_text(generated, encoding="utf-8")
    print(f"\n  wrote {REGISTRY} ({len(generated):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
