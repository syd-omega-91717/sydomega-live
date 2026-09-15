/* Ω SYD OMEGA 91717 — conflict-safe spatial realm integration
 *
 * This script is intentionally additive and idempotent. It does not replace
 * the existing 3-D sculpture, navigation, data contracts, or page logic.
 * It only:
 *   1. registers the spatial runtime with the existing bg.js bootstrap;
 *   2. adds one semantic realm mount to gaming.html and cinema.html.
 *
 * The runtime itself uses CSS 3-D for the realm shell. The existing
 * omega-sculpture.js remains the sole owner of WebGL/Three.js contexts.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = {
  bg: path.join(root, 'bg.js'),
  gaming: path.join(root, 'gaming.html'),
  cinema: path.join(root, 'cinema.html'),
};

const LOAD_MARKER = 'data-omega-spatial-realms-js';
const mounts = {
  gaming: `\n<!-- Ω SPATIAL REALM: GAMING — additive mount; functional content remains authoritative -->\n<section class="omega-spatial-realm" data-omega-spatial-realm="gaming" aria-label="Gaming spatial realm"></section>\n`,
  cinema: `\n<!-- Ω SPATIAL REALM: CINEMA — additive mount; functional content remains authoritative -->\n<section class="omega-spatial-realm" data-omega-spatial-realm="cinema" aria-label="Cinema spatial realm"></section>\n`,
};

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, value) { fs.writeFileSync(file, value, 'utf8'); }

function registerRuntime() {
  let src = read(files.bg);
  if (src.includes(LOAD_MARKER) || src.includes('/omega-spatial-realms.js')) return false;

  const loader = `\n  /* Ω SPATIAL REALMS — additive loader; WebGL remains owned by omega-sculpture.js. */\n  if (!document.querySelector('[${LOAD_MARKER}]')) {\n    var _osr = document.createElement('script');\n    _osr.src = '/omega-spatial-realms.js';\n    _osr.setAttribute('${LOAD_MARKER}', '1');\n    _osr.defer = true;\n    (document.head || document.documentElement).appendChild(_osr);\n  }\n`;

  const needle = "(function () {";
  const at = src.indexOf(needle);
  if (at < 0) throw new Error('bg.js bootstrap marker not found; refusing unsafe edit');
  src = src.slice(0, at) + loader + src.slice(at);
  write(files.bg, src);
  return true;
}

function addMount(file, realm) {
  let src = read(file);
  if (src.includes(`data-omega-spatial-realm="${realm}"`)) return false;

  const insertion = mounts[realm];
  const candidates = ['</main>', '</body>'];
  for (const needle of candidates) {
    const at = src.lastIndexOf(needle);
    if (at >= 0) {
      src = src.slice(0, at) + insertion + src.slice(at);
      write(file, src);
      return true;
    }
  }
  throw new Error(`${realm}.html has no safe insertion boundary; refusing unsafe edit`);
}

registerRuntime();
addMount(files.gaming, 'gaming');
addMount(files.cinema, 'cinema');
console.log('Ω spatial realm integration complete: idempotent, additive, WebGL-single-owner safe.');
