#!/usr/bin/env python3
"""No licence, no ship: every NEW audio, video or image file needs a rights record.

WHY. The platform serves media a member can see and hear (series and movie reels, concept art, trophies, sign emblems). The existing
audit (scripts/omega-asset-provenance-audit.py) hashes every file and marks rights UNVERIFIED, but it only reports: nothing recorded who
made a file or under what licence, and nothing stopped a new file of unknown origin, a ripped film, a commercial song, a game asset, from
being committed and deployed. This gate makes the rule mechanical. It decides nothing about what is allowed; it makes sure somebody said.

THE RULE.
  * Every media file tracked by git (audio, video, image; not vendor/, docs/, supabase/, scripts/, .claude/, public/) is either
      - in `baseline` of docs/media-rights.json: the files that existed on 2026-11-15, supplied by the owner and NOT individually reviewed
        for rights (they are recorded as `unreviewed`, which is a statement of ignorance, not of clearance); or
      - described by a record in `records` with every required field.
  * A new file with neither fails the gate.
  * A record must name its source, creator, licence, evidence and the date it was added. The licence must be one of `licences`.
    CC-BY licences also need `attribution` text. Anything other than an owner-made licence needs `evidence` that is an http(s) URL, so a
    reviewer can open the page and read the licence for themselves.
  * A record whose file no longer exists is a finding (a stale record claims clearance for nothing).
  * Nothing here proves a record is TRUE. A wrong licence typed in passes the gate and is still wrong: the gate forces a human to write the
    claim down where a reviewer will see it in the diff, which is the point.

Usage:
  python3 scripts/media-rights-gate.py            # gate: exit 1 on any finding
  python3 scripts/media-rights-gate.py --summary  # counts only
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTER = os.path.join(ROOT, 'docs', 'media-rights.json')

MEDIA_EXT = {'.mp4', '.webm', '.mov', '.m4v', '.mp3', '.ogg', '.oga', '.wav', '.m4a', '.flac', '.aac', '.opus',
             '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg', '.bmp', '.tif', '.tiff'}
SKIP_PREFIX = ('vendor/', 'docs/', 'supabase/', 'scripts/', '.claude/', 'public/', 'node_modules/', 'tests/', 'artifacts/')
REQUIRED = ('path', 'source', 'creator', 'licence', 'evidence', 'added')
OWNER_LICENCES = {'owner-original', 'owner-generated'}
URL = re.compile(r'^https?://\S+$')
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def is_media(path):
    return os.path.splitext(path)[1].lower() in MEDIA_EXT and not path.startswith(SKIP_PREFIX)


def evaluate(files, doc):
    """files: tracked paths. doc: the parsed register. Returns a list of findings (empty = pass)."""
    out = []
    allowed = set(doc.get('licences', []))
    baseline = set(doc.get('baseline', []))
    records = doc.get('records', [])
    tracked = {f for f in files if is_media(f)}
    by_path = {}
    for i, r in enumerate(records):
        where = 'record %d (%s)' % (i + 1, r.get('path', '?'))
        for k in REQUIRED:
            if not str(r.get(k, '')).strip():
                out.append('%s: missing %r' % (where, k))
        p = r.get('path')
        if p in by_path:
            out.append('%s: a second record for the same path' % where)
        by_path[p] = r
        lic = r.get('licence')
        if lic and lic not in allowed:
            out.append('%s: licence %r is not one of the allowed licences (%s)' % (where, lic, ', '.join(sorted(allowed))))
        if lic and lic.startswith('CC-BY') and not str(r.get('attribution', '')).strip():
            out.append('%s: %s needs an `attribution` line' % (where, lic))
        if lic and lic not in OWNER_LICENCES and not URL.match(str(r.get('evidence', ''))):
            out.append('%s: a licence from someone else needs `evidence` that is a http(s) URL a reviewer can open' % where)
        if r.get('added') and not DATE.match(str(r['added'])):
            out.append('%s: `added` must be YYYY-MM-DD' % where)
        if p and p not in tracked:
            out.append('%s: no such tracked media file (a stale record claims clearance for nothing)' % where)
    for f in sorted(tracked):
        if f not in baseline and f not in by_path:
            out.append('%s: a new media file with no rights record (add one to docs/media-rights.json)' % f)
    return out


def tracked_files():
    r = subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True, check=True)
    return [x for x in r.stdout.split('\n') if x]


def main():
    if '--help' in sys.argv or '-h' in sys.argv:
        print(__doc__)
        return 0
    with open(REGISTER, encoding='utf-8') as fh:
        doc = json.load(fh)
    files = tracked_files()
    findings = evaluate(files, doc)
    tracked = [f for f in files if is_media(f)]
    base = [f for f in tracked if f in set(doc.get('baseline', []))]
    recs = {r.get('path') for r in doc.get('records', [])}
    if '--summary' in sys.argv:
        print('%d media files: %d in the unreviewed baseline, %d with a rights record, %d with neither'
              % (len(tracked), len(base), len([f for f in tracked if f in recs]), len([f for f in tracked if f not in set(base) and f not in recs])))
    for x in findings:
        print(x)
    if findings:
        print('MEDIA RIGHTS: FAIL (%d finding%s)' % (len(findings), '' if len(findings) == 1 else 's'))
        return 1
    print('MEDIA RIGHTS: PASS (%d media files: %d unreviewed baseline, %d with a record)'
          % (len(tracked), len(base), len([f for f in tracked if f in recs])))
    return 0


if __name__ == '__main__':
    sys.exit(main())
