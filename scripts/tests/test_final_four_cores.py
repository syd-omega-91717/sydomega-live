"""ORDER, MEDIA, SERVICES and OWNER cores (2026-10-18).

Each host mounts its core module; the owner board renders only for a
confirmed owner; empty tables are stated, never filled with samples; and
media.html's boot loads state before rendering it (it called render() bare
and threw "reading 'items'" on every visit).
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


CORES = {
    "hall.html": ("omega-order-core.js", "data-omega-order-core"),
    "media.html": ("omega-media-core.js", "data-omega-media-core"),
    "services.html": ("omega-services-core.js", "data-omega-services-core"),
    "control-center.html": ("omega-owner-core.js", "data-omega-owner-core"),
}


class FinalFourCores(unittest.TestCase):
    def test_hosts_mount_their_core(self):
        for page, (module, mount) in CORES.items():
            html = read(page)
            self.assertIn('src="/%s"' % module, html, page)
            self.assertIn(mount, html, page)

    def test_owner_board_requires_confirmed_owner(self):
        src = read("omega-owner-core.js")
        self.assertIn("me.data.is_owner !== true) return;", src)

    def test_cores_do_not_write(self):
        for _, (module, _) in CORES.items():
            src = read(module)
            calls = re.findall(r"\.from\([^)]*\)\s*\.(insert|update|upsert|delete)\(", src)
            self.assertEqual(calls, [], module)

    def test_media_boot_loads_before_render(self):
        boot = read("omega-media-boot.js")
        self.assertIn("M.load().then(M.render", boot)
        self.assertNotIn("OmegaMediaNative.render();", boot)


if __name__ == "__main__":
    unittest.main()
