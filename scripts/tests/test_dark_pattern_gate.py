"""The dark-pattern gate must find each shape it exists to find, ignore real look-alikes from this repo, and be clean on the repo.
A 0 proves nothing until each of the four shapes has been planted in a scratch tree and found."""
import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("dpg", ROOT / "scripts" / "dark-pattern-gate.py")
dpg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dpg)


def found(files):
    d = tempfile.mkdtemp()
    for rel, text in files.items():
        p = pathlib.Path(d, rel)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
    return dpg.scan(d)


class MustFind(unittest.TestCase):
    def test_prechecked_consent(self):
        for tag in ('<input type="checkbox" id="marketing-optin" checked>', '<input checked type=checkbox name=newsletter>', '<input type="checkbox" id="share-data" checked="checked">'):
            self.assertTrue(found({'a.html': tag}), tag)

    def test_manufactured_urgency(self):
        for line in ('<p>Only 3 left at this price</p>', '<p>14 people are viewing this now</p>', "el.textContent='Offer ends in 10:00'", '<b>Hurry, almost gone</b>'):
            self.assertTrue(found({'a.html': line}), line)

    def test_fake_clock(self):
        self.assertTrue(found({'a.js': "var countdownEnd = Date.now() + 15*60*1000;"}))
        self.assertTrue(found({'a.js': "const offerEnds = Date.now() + 86400000;"}))

    def test_confirmshaming(self):
        for line in ("<a>No thanks, I don't want to save money</a>", '<button>I prefer to stay unprotected</button>'):
            self.assertTrue(found({'a.html': line}), line)


class MustIgnore(unittest.TestCase):
    def test_unchecked_and_handler_text(self):
        self.assertEqual(found({'a.html': '<input type="checkbox" id="toggle-marketing" disabled onchange="u(\'marketing\',this.checked)">'}), [])   # privacy.html's real shape
        self.assertEqual(found({'a.html': '<input type="checkbox" id="marketing">'}), [])
        self.assertEqual(found({'a.html': '<input type="checkbox" class="task-cb" checked>'}), [])   # projects.html: a to-do, not consent

    def test_timeout_deadline(self):
        self.assertEqual(found({'a.js': 'var deadline = Date.now() + ms;'}), [])   # omega-architecture-runtime.js's real shape
        self.assertEqual(found({'a.js': 'var expires = Date.now() + ttl;'}), [])

    def test_declared_real_figure_and_skipped_dirs(self):
        self.assertEqual(found({'a.html': '<p>Only 3 left (sourced from the database)</p>'}), [])
        self.assertEqual(found({'docs/a.html': '<p>Only 3 left</p>', 'scripts/x.js': 'hurry, almost gone'}), [])


class Repo(unittest.TestCase):
    def test_clean(self):
        self.assertEqual(dpg.scan(str(ROOT)), [])


if __name__ == '__main__':
    unittest.main()
