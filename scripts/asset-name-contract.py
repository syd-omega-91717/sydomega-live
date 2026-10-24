#!/usr/bin/env python3
"""Refuse a NEW committed media file with a generic, meaningless name.

WHY THIS EXISTS

Blueprint point 31 ("Descriptive Asset Naming") asks that assets are never
named "Image1": a name should say what the file is. Measured on 2026-10-19,
170 of the 511 committed media files carried messenger export names -- 102
`IMG-YYYYMMDD-WA####.jpg` and 68 `WhatsApp Image YYYY-MM-DD at H.MM.SS AM (n).jpeg`
-- all inside the owner's art folders. A name like that tells a
reader, a grep and a reviewer nothing, and two exports of different images
can collide on the same name in two folders.

WHAT THIS CHECKS

Every git-tracked image/video file whose basename matches a generic export
pattern (IMG_1234, IMG-20260101-WA0001, DSC_0001, PXL_..., Screenshot ...,
untitled, image.png, a bare number, a bare hash) must already be listed in
`config/asset-name-baseline.json`. The 170 existing files are frozen there:
renaming them is the owner's decision, and a rename breaks every page that
references them. A file NOT in the baseline is BLOCKING -- give it a
descriptive name (what it shows, where it is used) before committing it.

A baseline entry whose file no longer exists is reported, not failed, so
deleting or renaming one of the 170 never needs a second edit to pass;
`--write-baseline` prunes them.

USAGE

    python3 scripts/asset-name-contract.py                 # check (exit 1 on a new generic name)
    python3 scripts/asset-name-contract.py --write-baseline   # regenerate the frozen list (owner/maintainer only)

No network, no third-party imports; reads `git ls-files` only.
"""

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = os.path.join(ROOT, 'config', 'asset-name-baseline.json')

MEDIA_EXT = re.compile(r'\.(png|jpe?g|webp|avif|gif|svg|mp4|webm|mov|m4v)$', re.I)

# Generic names produced by cameras, phones, messengers and screenshot tools,
# plus names that carry no information at all. Matched against the basename.
GENERIC = re.compile(
    r'^(?:'
    r'(?:img|image|dsc|dscn|dscf|pxl|mvimg|vid|video|photo|picture|pic|'
    r'whatsapp[ _-]?image|whatsapp[ _-]?video|untitled|file|asset|download|copy|new)'
    r'[ _-]?[\w .-]*?\d+[\w .()-]*'
    r'|screen[ _-]?shot[\w ,.()-]*'
    r'|image|untitled|picture|photo|img'
    r'|\d+'
    r'|[0-9a-f]{12,}'
    r')\.[a-z0-9]+$',
    re.I,
)


def tracked_media():
    out = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT, capture_output=True, check=True)
    names = [p for p in out.stdout.decode('utf-8', 'replace').split('\0') if p]
    return sorted(p for p in names if MEDIA_EXT.search(p))


def generic(paths):
    return [p for p in paths if GENERIC.match(p.rsplit('/', 1)[-1])]


def load_baseline():
    if not os.path.exists(BASELINE):
        return set()
    with open(BASELINE, encoding='utf-8') as fh:
        return set(json.load(fh).get('files', []))


def main(argv):
    if '-h' in argv or '--help' in argv:
        print(__doc__.strip())
        return 0
    found = generic(tracked_media())
    if '--write-baseline' in argv:
        os.makedirs(os.path.dirname(BASELINE), exist_ok=True)
        with open(BASELINE, 'w', encoding='utf-8') as fh:
            json.dump({'_note': 'Generic-named media frozen by scripts/asset-name-contract.py. '
                                'Do not add to this list by hand; give new files descriptive names.',
                       'files': found}, fh, indent=2)
            fh.write('\n')
        print(f'ASSET NAME CONTRACT: baseline written ({len(found)} files)')
        return 0
    known = load_baseline()
    new = [p for p in found if p not in known]
    stale = sorted(known - set(found))
    print(f'ASSET NAME CONTRACT: {len(found)} generic-named media files, {len(known)} frozen in the baseline')
    for p in stale:
        print(f'  info: baseline entry no longer present (prune with --write-baseline): {p}')
    if new:
        for p in new:
            print(f'  NEW generic name: {p}')
        print('ASSET NAME CONTRACT: FAIL -- rename each file above to say what it shows and where it is used')
        return 1
    print('ASSET NAME CONTRACT: PASS -- no new generic asset names')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
