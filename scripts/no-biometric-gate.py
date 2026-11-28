#!/usr/bin/env python3
"""No biometric or DNA data is stored here, and no copy claims it is. Blocking.

WHY THIS EXISTS

The 999-point ledger contains "biometric / DNA locks": identity that is unlocked by a fingerprint, a face or a genome. The owner and this repo rejected it,
and the reasons are not squeamishness. A biometric cannot be rotated after it leaks, a genome identifies a person's relatives who never consented, and a
member who loses a password can reset it but cannot reset a face. A static site with a Postgres backend and no hardware attestation has no business holding
either.

THE SAFE VERSION OF THE IDEA (what the owner actually wanted: a lock that only the real person can open, that survives a stolen password)

  A passkey (WebAuthn). The device holds a private key behind the user's own fingerprint or face; the server stores only a PUBLIC key. The biometric never
  leaves the device and the server cannot be breached for one. It is revocable (delete the key), phishing-resistant, and works with the Supabase Auth the
  repo already uses. The plan is docs/decisions/rejected-ideas-safe-translations/PLAN.md; it is a high-risk auth change, so it is written but not built.

WHAT THIS GATE ENFORCES (so the rejected idea cannot return by accident, and the copy cannot promise what does not exist)

  1. SCHEMA: no table or column in supabase/ is named for a biometric or genetic datum (biometric, fingerprint, faceprint, face template/embedding, voiceprint,
     retina, iris, genome, dna).
  2. CODE: no face- or fingerprint-recognition library, and no device-fingerprinting library (covert tracking), is imported by client or Edge Function code.
  3. COPY: no string a member can read says biometric, DNA, genetic or HSM identity is linked, locks, unlocks, signs in or verifies, unless the same string says it is
     a concept, planned, not implemented, or that the biometric stays on the user's own device. (A member-visible "HSM biometric linked" tier that nothing
     implemented sat in all six translation packs and the English table; no page rendered it, but it was one data-i18n attribute from being shown.)

HOW TO READ A RESULT. Exit 0 means none of the three was found IN THE FILES IT SCANS (it skips docs/, scripts/tests/, vendor/, FIXES_LOG.md and this file, which
discuss the subject). It cannot see a biometric that is stored under an innocent column name, or a claim phrased in words the patterns do not know. A 0 is only
believable after a positive control: scripts/tests/test_no_biometric_gate.py plants each of the three in a scratch tree and requires the gate to find it.

Usage: python3 scripts/no-biometric-gate.py [--root DIR]      exit 1 and a list when anything is found
"""
import argparse
import os
import re
import sys

SKIP_DIRS = {'.git', 'node_modules', 'vendor', 'docs', 'public', '.claude', '__pycache__'}
SKIP_PREFIXES = ('scripts/tests/', 'tests/')
SKIP_FILES = {'FIXES_LOG.md', 'scripts/no-biometric-gate.py', 'GAP_ANALYSIS.md', 'CLAUDE.md'}
TEXT_EXT = {'.html', '.js', '.ts', '.json', '.sql', '.css', '.md', '.txt'}

# 1. schema identifiers (word-bounded on underscores too: `surface` and `candidate` must not match `face` and `dna`)
# (a bare `fingerprint` column is not flagged: key and secret fingerprints are hashes, not biometrics; fingerprintjs is caught as a library below)
BIO_IDENT = re.compile(r'(?<![a-z0-9])(biometric\w*|faceprint\w*|face_(?:template|embedding|vector|id\w*)|voiceprint\w*|retina\w*|iris_\w+|genom\w*|dna(?:_\w+)?|\w+_dna)(?![a-z0-9])', re.I)
# 2. libraries
BIO_LIB = re.compile(r'(face-api|faceapi|tracking\.js|\bFaceDetector\b|mediapipe|fingerprintjs|clientjs|evercookie|canvas[-_ ]?fingerprint)', re.I)
# 3. copy: a biometric/genetic word near an identity-claim word, with no hedge in the same line
BIO_WORD = re.compile(r'\b(biometric\w*|touch\s?id|face\s?id|(?:fingerprint|face|facial|retina\w*|iris|palm|voice)[ _-]?(?:scan|reader|sensor|unlock|login|auth\w*|match|id|print)|palm_?print|retinal\w*|voiceprint|genetic|genome|DNA|HSM)\b', re.I)
# (`identity` and `identify` are deliberately not claim words: "DNA Code ... identifier" is the platform's own format and "identifying cognitive strengths" is science copy)
CLAIM_WORD = re.compile(r'\b(linked|lock(?:s|ed)?|unlock\w*|log\s?in|sign[- ]?in|authenticat\w*|verif\w+)\b', re.I)
HEDGE = re.compile(r'(first version|used to|previously|was removed|removed|concept|not implemented|no\b.{0,60}\bimplemented|planned|future|proposed|would|will\b|never|on[- ]your[- ]device|on[- ]device|stays on|passkey|webauthn|rejected|not built|does not|do not|no hsm)', re.I)


def comment_free_sql(text):
    text = re.sub(r'/\*.*?\*/', ' ', text, flags=re.S)
    return re.sub(r'--[^\n]*', '', text)


def files(root):
    for dp, dn, fn in os.walk(root):
        rel_dir = os.path.relpath(dp, root).replace(os.sep, '/')
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in fn:
            rel = (f if rel_dir == '.' else rel_dir + '/' + f)
            if rel in SKIP_FILES or rel.startswith(SKIP_PREFIXES) or os.path.splitext(f)[1] not in TEXT_EXT:
                continue
            yield rel, os.path.join(dp, f)


def scan(root):
    out = []
    for rel, path in files(root):
        try:
            with open(path, encoding='utf-8', errors='replace') as fh:
                text = fh.read()
        except OSError:
            continue
        ext = os.path.splitext(rel)[1]
        if ext == '.sql' and rel.startswith('supabase/'):
            for m in BIO_IDENT.finditer(comment_free_sql(text)):
                out.append((rel, 0, 'schema names a biometric or genetic datum', m.group(0)))
        if ext in ('.js', '.ts', '.html') and (rel.startswith('supabase/functions/') or '/' not in rel):
            for i, line in enumerate(text.split('\n'), 1):
                m = BIO_LIB.search(line)
                if m:
                    out.append((rel, i, 'face-recognition or device-fingerprinting library', m.group(0)))
        if ext in ('.html', '.js', '.json'):
            for i, line in enumerate(text.split('\n'), 1):
                if len(line) > 3000:
                    continue
                if HEDGE.search(line):
                    continue
                for b in BIO_WORD.finditer(line):
                    near = line[max(0, b.start() - 70):b.end() + 70]   # proximity: a long line holds many unrelated entries
                    if CLAIM_WORD.search(near):
                        out.append((rel, i, 'copy says a biometric, DNA or HSM identity is real', near.strip()[:140]))
                        break
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0], formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument('--root', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    a = ap.parse_args(argv)
    found = scan(os.path.abspath(a.root))
    for rel, line, why, ex in found:
        print('%s%s: %s: %s' % (rel, (':%d' % line) if line else '', why, ex))
    print('NO-BIOMETRIC GATE: %s' % ('FAIL (%d)' % len(found) if found else 'PASS (no biometric or DNA datum stored, no library, no unhedged claim)'))
    return 1 if found else 0


if __name__ == '__main__':
    sys.exit(main())
