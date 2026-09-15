#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..');
const runtime = fs.readFileSync(path.join(root, 'omega-visual-runtime.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert(runtime.includes("if(page!=='index') return;"), 'opening visual must remain scoped to index');
assert(runtime.includes('.ohz-hero-art[data-omega-sculpture="signet"]'), 'canonical opening mount selector must remain supported');
assert(runtime.includes("document.querySelector('.ohz-hero-art[data-omega-sculpture=\"signet\"]') ||"), 'runtime must retain the canonical signet mount');
assert(runtime.includes('perspective:1100px'), 'opening stage must preserve 3-D perspective');
assert(runtime.includes('transform-style:preserve-3d'), 'opening stage must preserve 3-D transform composition');
assert(runtime.includes('translateZ(85px)'), 'Omega monument must have real depth positioning');
assert(runtime.includes('prefers-reduced-motion:reduce'), 'opening visual must honor reduced motion');
assert(runtime.includes('pointermove'), 'opening visual must support restrained interactive parallax');
assert(runtime.includes('DOMContentLoaded'), 'runtime must tolerate deferred DOM timing');
assert(index.includes('<script src="/omega-visual-runtime.js" defer></script>'), 'index must keep the visual runtime entrypoint');
assert(index.includes('data-omega-sculpture="signet"'), 'index must keep the canonical sculpture mount');

console.log('OMEGA_VISUAL_RUNTIME=PASS');
