const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const runtime = fs.readFileSync(path.join(root, 'omega-visual-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'omega-world-atlas.css'), 'utf8');

const portals = [
  '/dashboard.html', '/gaming.html', '/cinema.html', '/social.html',
  '/horoscope.html', '/news.html', '/heritage.html', '/matrix.html',
  '/credentials.html', '/investment.html', '/sovereign-ai.html', '/approvals.html'
];

assert(runtime.includes("addSheet('omega-world-atlas-css','omega-world-atlas.css')"), 'runtime must load atlas CSS');
assert(runtime.includes('installWorldAtlas'), 'runtime must expose the atlas installation path');
assert(runtime.includes('data-omega-world-atlas'), 'atlas must have a duplicate-install guard');
assert(!/THREE|WebGLRenderer|new\s+THREE\./.test(runtime), 'visual atlas runtime must not create a second WebGL renderer');
assert(css.includes('.omega-atlas-grid'), 'atlas grid styles must exist');
assert(css.includes('prefers-reduced-motion'), 'atlas must respect reduced motion');
for (const route of portals) {
  assert(fs.existsSync(path.join(root, route.slice(1))), `atlas destination must exist: ${route}`);
  assert(runtime.includes(`'${route}'`), `atlas must expose real destination: ${route}`);
}

console.log(`OMEGA_WORLD_ATLAS=PASS (${portals.length} real portals)`);
