"""Runtime regression tests for the canonical movies spatial realm."""
import json
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class SpatialRealmRuntime(unittest.TestCase):
    def test_movies_page_mounts_through_the_shared_runtime(self):
        html = (ROOT / "movies.html").read_text(encoding="utf-8")
        runtime = (ROOT / "omega-spatial-realms.js").read_text(encoding="utf-8")
        self.assertIn('src="/omega-spatial-realms.js"', html)
        self.assertEqual(html.count('data-omega-spatial-realm="movies"'), 1)
        self.assertIn('make(\'movies\')', runtime)
        self.assertIn('.omega-spatial-realm[data-realm="movies"]', runtime)

    def test_runtime_mounts_movies_and_keeps_gaming_and_legacy_cinema(self):
        probe = r'''\
const fs = require('fs');
const vm = require('vm');
const roots = {};
for (const name of ['gaming', 'movies', 'cinema']) {
  const attrs = {};
  roots[name] = {
    attrs,
    innerHTML: '',
    setAttribute(k, v) { attrs[k] = v; },
    getAttribute(k) { return attrs[k] || null; }
  };
}
const document = {
  readyState: 'complete',
  head: { appendChild() {} },
  createElement() { return { setAttribute() {}, textContent: '' }; },
  querySelector(selector) {
    const match = selector.match(/data-omega-spatial-realm="([^"]+)"/);
    return match ? roots[match[1]] || null : null;
  }
};
const context = {
  window: {}, document,
  matchMedia() { return { matches: false }; },
  console
};
vm.runInNewContext(fs.readFileSync('omega-spatial-realms.js', 'utf8'), context);
for (const name of ['gaming', 'movies', 'cinema']) {
  if (roots[name].attrs['data-mounted'] !== '1') throw new Error(name + ' did not mount');
}
if (roots.movies.attrs['data-realm'] !== 'movies') throw new Error('movies canonical realm identity missing');
if (!roots.movies.innerHTML.includes('MOVIES REALM') || !roots.movies.innerHTML.includes('/movies.html')) throw new Error('movies content or navigation missing');
if (roots.gaming.attrs['data-realm'] !== 'gaming' || !roots.gaming.innerHTML.includes('GAMING REALM')) throw new Error('gaming regression');
if (roots.cinema.attrs['data-realm'] !== 'movies' || !roots.cinema.innerHTML.includes('MOVIES REALM')) throw new Error('legacy cinema alias regression');
console.log(JSON.stringify({gaming: 'mounted', movies: 'mounted', legacyCinema: 'mapped-to-movies'}));
'''
        result = subprocess.run(
            ["node", "-e", probe], cwd=ROOT, capture_output=True, text=True, check=False
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout), {
            "gaming": "mounted", "movies": "mounted", "legacyCinema": "mapped-to-movies"
        })


if __name__ == "__main__":
    unittest.main()
