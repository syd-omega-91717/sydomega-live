"""Every committed raster image must be the bytes it was exported as (CLAUDE.md 8.1 class 1 shape:
a file that exists and looks fine in a listing, but renders as noise).

Why this exists: 31 files (30 phase portraits in Phases_HOMOGENIC_OMEGA_91717 and the token-coin
artwork) were committed after a text-mode conversion turned every CR and LF into CRLF and appended
one extra CRLF after the JPEG end marker. They decoded as green/blue static, `omega-visual-atlas.js`
pointed at them, and no gate noticed: audit.py checks that a file *exists*, not that it *decodes*.

No ffmpeg or PIL needed: a JPEG ends in FFD9 and a PNG ends in the IEND chunk, and the text-mode
mangling breaks both. Checked over the whole working tree except generated/third-party folders.
"""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKIP = {".git", "node_modules", "public", "vendor"}
JPEG_END = b"\xff\xd9"
PNG_END = b"IEND\xaeB`\x82"


def images():
    for p in ROOT.rglob("*"):
        if p.is_file() and not (set(p.relative_to(ROOT).parts) & SKIP):
            if p.suffix.lower() in (".jpg", ".jpeg", ".png"):
                yield p


def problem(path, data):
    """Return why `data` is not a complete image of the type its name claims, else None."""
    if path.suffix.lower() in (".jpg", ".jpeg"):
        if not data.startswith(b"\xff\xd8"):
            return "no JPEG start marker"
        if not data.rstrip(b"\x00").endswith(JPEG_END):
            return "does not end at the JPEG end marker FFD9 (text-mode newline appended?)"
    else:
        if not data.startswith(b"\x89PNG\r\n\x1a\n"):
            return "no PNG signature (its CRLF was rewritten?)"
        if not data.endswith(PNG_END):
            return "does not end with the PNG IEND chunk"
    return None


class ImageIntegrity(unittest.TestCase):
    def test_every_image_is_complete(self):
        found = list(images())
        self.assertGreater(len(found), 100, "scanner found almost no images - wrong root?")
        bad = [(str(p.relative_to(ROOT)), why) for p in found if (why := problem(p, p.read_bytes()))]
        self.assertEqual(bad, [], "corrupt images: %s" % bad[:5])

    def test_the_check_can_actually_fail(self):
        """A '0 findings' result is only evidence if the check can see the known bug."""
        twin = ROOT / "BlockChain_Market_Analysis_syd_omega_91717/Phases_syd_omega_91717/Architect_Omega_91717_phase_4.1.1.jpg"
        good = twin.read_bytes()
        self.assertIsNone(problem(twin, good))
        mangled = good.replace(b"\r", b"\n").replace(b"\n", b"\r\n") + b"\r\n"  # the observed corruption
        self.assertIsNotNone(problem(twin, mangled))
        self.assertNotEqual(mangled, good)


if __name__ == "__main__":
    unittest.main()
