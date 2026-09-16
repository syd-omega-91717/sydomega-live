const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'characters.html'), 'utf8');
const framework = fs.readFileSync(path.join(root, 'OMEGA_PAGE_CHARACTER_FRAMEWORK.md'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'config/page-character-manifest.json'), 'utf8');

for (const archetype of ['Observatory', 'Arena', 'Studio', 'Archive']) {
  assert(html.includes(`>${archetype}<`), `character gateway must expose ${archetype}`);
  assert(framework.includes(archetype), `framework must define ${archetype}`);
}
for (const route of ['/character.html', '/profile.html', '/bloodline.html', '/gaming.html', '/identity.html']) {
  assert(html.includes(`href=\"${route}\"`), `character gateway must expose ${route}`);
}
assert(html.includes('/omega-cinematic-system.js'), 'character gateway must use the canonical cinematic system');
assert(html.includes('prefers-reduced-motion'), 'character gateway must respect reduced motion');
assert(manifest.includes('"identity"') && manifest.includes('"gaming"'), 'character manifest must retain canonical archetype families');
assert(!/<script[^>]+src=["'][^"']*three/i.test(html), 'character gateway must not add a second Three.js renderer');
console.log('OMEGA_CHARACTER_VISUAL_GATEWAY=PASS');
