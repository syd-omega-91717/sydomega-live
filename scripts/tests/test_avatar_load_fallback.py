"""A valid-looking https avatar address is not a loadable image.

Found by rendering the home surface with a populated profile (2026-11-16): a deleted or moved avatar showed as a black disc with a broken-image icon, and the passport photo in profile.html cleared its
placeholder and set the dead address as a CSS background, leaving a blank box (measured: before the fix the placeholder was removed and a 404 URL applied; after it the placeholder stays). Scheme validation,
which both places already did, never catches this. Both now apply the image only when it loads, with no inline or property handlers.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROFILE = (ROOT / "profile.html").read_text(encoding="utf-8")
HOME = (ROOT / "omega-ecosystem-home.js").read_text(encoding="utf-8")


def passport_block():
    i = PROFILE.index("if(d.avatar_url){ var ph=document.getElementById('pp-photo');")
    return PROFILE[i:PROFILE.index("ppArt(sign, tier);", i)]


class AvatarLoadFallback(unittest.TestCase):
    def test_the_passport_photo_is_applied_only_after_the_image_loads(self):
        b = passport_block()
        self.assertIn("var probe=new Image();", b)
        self.assertRegex(b, r"probe\.addEventListener\('load',function\(\)\{ph\.style\.backgroundImage='url\(\"'\+av\+'\"\)'; ph\.textContent='';\}\);")
        self.assertLess(b.index("probe.addEventListener('load'"), b.index("probe.src=av"), "the listener must exist before the source is set")
        # the background and the cleared placeholder happen inside the load handler, never directly
        before_listener = b[:b.index("probe.addEventListener('load'")]
        self.assertNotIn("ph.style.backgroundImage", before_listener)
        self.assertNotIn("ph.textContent=''", before_listener)

    def test_the_passport_photo_keeps_its_existing_hardening(self):
        b = passport_block()
        self.assertIn("au.protocol==='https:'", b)
        self.assertIn("probe.referrerPolicy='no-referrer'", b)

    def test_the_home_avatar_falls_back_to_the_medallion_once(self):
        block = HOME[HOME.index("function renderProfile"):HOME.index("function num(")]
        self.assertIn("img.addEventListener('error'", block)
        self.assertIn("if (img.getAttribute('src') !== medallion) img.src = medallion;", block)

    def test_no_inline_or_property_handlers_are_used_for_either(self):
        for text in (passport_block(), HOME[HOME.index("function renderProfile"):HOME.index("function num(")]):
            self.assertNotRegex(text, r"\.onerror\s*=|\.onload\s*=|onerror=|onload=")


if __name__ == "__main__":
    unittest.main()
