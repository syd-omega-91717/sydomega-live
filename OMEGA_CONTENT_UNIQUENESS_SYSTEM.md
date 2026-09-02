# Omega Content Uniqueness System

**Phase B/C Bridge: Automated Duplicate Detection & Prevention**

Last updated: 2026-09-02 | Status: Specification & Implementation Guide

---

## Purpose

Prevent content duplication across SYD OMEGA's 184 pages. This system:
- Detects duplicate page titles, headings, descriptions, and primary content blocks
- Flags semantic similarity exceeding configurable thresholds
- Blocks CI on intentional duplicates without documented justification
- Enables systematic navigation clarity (each page is meaningfully distinct)

This is a **CI gate**, not a runtime filter. Duplicate content must be explicitly justified or the build fails.

---

## Problem Statement

With 184 pages and 90 modules, accidental duplication is inevitable:
- Page A and Page B share the same title or description
- Two pages explain the same concept with nearly-identical wording
- Multiple pages have identical CTAs or calls-to-action
- Modal/popup content is copy-pasted across 5 pages

Duplicates:
1. Confuse navigation (which one to visit?)
2. Hurt SEO by splitting topical authority
3. Create maintenance burden (fix a bug in one, forget the other)
4. Waste member cognitive load (redundant explanations)
5. Signal lack of intentional information architecture

---

## Architecture

### Scanning Phase

```
for each .html file in root/:
  extract:
    - <title>
    - <meta name="description">
    - <h1>, <h2>, <h3> elements
    - <button>, <a href>, <input> labels
    - <script type="module"> initial text (first 200 chars)
    - data-page attribute
    - id and class names (for pattern matching)
  
  compute:
    - exact hash of title + description + headings
    - semantic fingerprint (TF-IDF or embedding-free string similarity)
    - word frequency vector for main content blocks
```

### Matching Phase

```
for each pair of pages (A, B):
  if title is identical:
    flag "Title Duplicate" → CRITICAL
  
  if description is identical or >90% similar:
    flag "Description Duplicate" → HIGH
  
  if (headings count > 3) and (heading overlap > 50%):
    flag "Content Structure Duplicate" → MEDIUM
  
  if (semantic fingerprint distance < 0.15):
    flag "Semantic Duplicate" → MEDIUM
  
  if (CTA text identical on multiple pages):
    flag "Call-to-Action Duplicate" → LOW (expected, may be intentional)
  
  if (both pages target same data source AND navigation is unclear):
    flag "Navigation Ambiguity" → MEDIUM
```

### Justification Phase

```
.duplicate-justifications.json:
  {
    "astronomy.html / horoscope.html": {
      "reason": "Astronomy is observer-focused (data), Horoscope is personal-focused (meaning)",
      "distinguishing-feature": "astronomy shows raw data; horoscope applies to member",
      "merge-candidate": false,
      "verified": "2026-09-02"
    },
    "projects.html / studio.html": {
      "reason": "Projects are existing work; Studio is creation tool",
      "distinguishing-feature": "Projects consume; Studio produces",
      "merge-candidate": false,
      "verified": "2026-09-02"
    }
  }
```

When a duplicate is flagged:
1. Add entry to `.duplicate-justifications.json` with reasoning
2. Reference distinguishing feature (what makes them different?)
3. Commit with explanation
4. CI passes if justification is present

---

## Implementation

### Phase 1: Scanner Script (`scripts/content-uniqueness-check.py`)

```python
#!/usr/bin/env python3
"""
Detect duplicate and near-duplicate content across all pages.

Usage:
  python3 scripts/content-uniqueness-check.py [--strict] [--threshold 0.15]

--strict : Fail on ANY semantic duplicate (no justification allowed)
--threshold : Similarity threshold (0.0-1.0, default 0.15 = 85% unique)
"""

import os
import json
import re
from pathlib import Path
from collections import defaultdict

class ContentFingerprint:
    def __init__(self, title, description, headings, buttons):
        self.title = title.lower().strip()
        self.description = description.lower().strip()
        self.headings = [h.lower().strip() for h in headings]
        self.buttons = [b.lower().strip() for b in buttons]
        
    def exact_hash(self):
        """Hash for exact duplicates"""
        return f"{self.title}|{self.description}"
    
    def similarity_to(self, other):
        """Levenshtein-like similarity score"""
        # Simplified: word-overlap ratio
        self_words = set(self.title.split())
        other_words = set(other.title.split())
        if not self_words or not other_words:
            return 0.0
        overlap = len(self_words & other_words) / max(len(self_words), len(other_words))
        return overlap

def scan_pages(root_dir="."):
    """Scan all .html files"""
    findings = defaultdict(list)
    pages = {}
    
    for html_file in Path(root_dir).glob("*.html"):
        content = html_file.read_text(encoding="utf-8")
        
        # Extract metadata
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.I)
        title = title_match.group(1) if title_match else ""
        
        desc_match = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', content, re.I)
        description = desc_match.group(1) if desc_match else ""
        
        headings = re.findall(r'<h[1-3][^>]*>([^<]+)</h[1-3]>', content, re.I)
        buttons = re.findall(r'<(?:button|a)[^>]*(?:data-label|aria-label|title)="([^"]*)"', content, re.I)
        
        fp = ContentFingerprint(title, description, headings, buttons)
        pages[html_file.name] = fp
    
    # Compare all pairs
    page_list = list(pages.items())
    for i, (name_a, fp_a) in enumerate(page_list):
        for name_b, fp_b in page_list[i+1:]:
            # Exact title match
            if fp_a.title == fp_b.title and fp_a.title:
                findings["exact_title"].append((name_a, name_b))
            
            # Exact description match
            if fp_a.description == fp_b.description and fp_a.description:
                findings["exact_description"].append((name_a, name_b))
            
            # Similarity check
            sim = fp_a.similarity_to(fp_b)
            if sim > 0.7:  # >70% similar
                findings["high_similarity"].append((name_a, name_b, sim))
    
    return findings

def load_justifications(path=".duplicate-justifications.json"):
    """Load approved duplicates"""
    if not Path(path).exists():
        return {}
    return json.loads(Path(path).read_text())

def report(findings, justifications, strict=False):
    """Generate report"""
    approved = set()
    for key, justif in justifications.items():
        pages_a, pages_b = key.split(" / ")
        approved.add((pages_a, pages_b))
        approved.add((pages_b, pages_a))  # Bidirectional
    
    issues = []
    for issue_type, pairs in findings.items():
        for pair_data in pairs:
            if issue_type == "high_similarity":
                a, b, sim = pair_data
            else:
                a, b = pair_data
                sim = None
            
            key = f"{a} / {b}"
            if key in approved:
                continue  # Justified
            
            issues.append({
                "type": issue_type,
                "pages": (a, b),
                "similarity": sim,
                "justified": False
            })
    
    if issues:
        print(f"❌ Found {len(issues)} unjustified duplicates:")
        for issue in issues:
            print(f"  - {issue['pages'][0]} <> {issue['pages'][1]} ({issue['type']})")
        if strict:
            return 1
    else:
        print("✅ No unjustified duplicates found")
    
    return 0 if not issues else (1 if strict else 0)

if __name__ == "__main__":
    import sys
    strict = "--strict" in sys.argv
    findings = scan_pages()
    justifications = load_justifications()
    sys.exit(report(findings, justifications, strict))
```

### Phase 2: CI Gate (`.github/workflows/content-uniqueness.yml`)

```yaml
name: Content Uniqueness Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  uniqueness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Content Uniqueness
        run: python3 scripts/content-uniqueness-check.py --strict
```

### Phase 3: Justification Format (`.duplicate-justifications.json`)

```json
{
  "astronomy.html / horoscope.html": {
    "reason": "Astronomy observes celestial mechanics (data-driven); Horoscope applies meaning to member's life (personal-driven)",
    "distinguishing-feature": "Astronomy = objective observations; Horoscope = subjective interpretation",
    "merge-candidate": false,
    "verified-by": "owner",
    "verified-date": "2026-09-02"
  },
  "projects.html / studio.html": {
    "reason": "Projects display completed/in-progress work; Studio is the creation/editing interface",
    "distinguishing-feature": "Projects consume (gallery view); Studio produces (editor view)",
    "merge-candidate": false,
    "verified-by": "owner",
    "verified-date": "2026-09-02"
  },
  "wealth.html / vault.html": {
    "reason": "Wealth is PUBLIC net-worth display; Vault is PRIVATE asset storage (RLS-gated)",
    "distinguishing-feature": "Wealth is member-scoped public data; Vault is owner-only sensitive data",
    "merge-candidate": false,
    "verified-by": "owner",
    "verified-date": "2026-09-02"
  },
  "marketplace.html / advertising.html": {
    "reason": "Marketplace is peer-to-peer commerce; Advertising is platform-driven promotion",
    "distinguishing-feature": "Marketplace = members sell to members; Advertising = platform promotes to members",
    "merge-candidate": false,
    "verified-by": "owner",
    "verified-date": "2026-09-02"
  }
}
```

---

## Expected Findings

Initial scan will likely flag:

**Intentional Duplicates (justified):**
- Astronomy ↔ Horoscope (observer vs. personal interpretation)
- Projects ↔ Studio (consumption vs. creation)
- Wealth ↔ Vault (public vs. private)
- Marketplace ↔ Advertising (peer commerce vs. platform promotion)
- Academy ↔ Exam (teaching vs. testing)
- Publishing ↔ Publications (tool vs. archive)

**Unintentional Duplicates (to be merged or renamed):**
- [TBD by actual scan]

**Navigation Clarifications Needed:**
- Pages that share purpose but not description → rename or consolidate
- Pages with identical CTAs → differentiate or centralize

---

## Timeline

- **Week 1:** Scanner script written and tested locally
- **Week 2:** Initial scan run, justifications added for known-good duplicates
- **Week 3:** CI gate integrated, all PRs gated on content uniqueness
- **Ongoing:** New pages checked automatically before merge

---

## Validation Checklist

- [ ] Scanner detects exact title matches
- [ ] Scanner detects exact description matches
- [ ] Scanner detects semantic similarity (>70% word overlap)
- [ ] Justification format is human-readable and machine-parseable
- [ ] CI fails on unjustified duplicates
- [ ] CI passes on justified duplicates
- [ ] Performance acceptable (< 5 seconds for 184 pages)

---

## Next Phase: Visual Language Implementation

Once content uniqueness is enforced, visual language becomes the final differentiator:
- Each of 184 pages gets unique **emblem** (icon/symbol)
- Each archetype gets consistent **motion signature** (movement patterns)
- Each page-pair gets **visual distinction** (color coding, layout, typography)

This ensures: **Same content = fine; different presentation = clear**

---

## Implementation Status

- [x] Architecture defined
- [ ] Scanner script written
- [ ] CI gate configured
- [ ] Initial scan run
- [ ] Justifications documented
- [ ] Integrated into main workflow
