const fs=require('fs');const assert=require('assert');
const html=fs.readFileSync('data-observatory.html','utf8');
const js=fs.readFileSync('omega-data-observatory.js','utf8');
const css=fs.readFileSync('omega-data-observatory.css','utf8');
assert(html.includes('omega_platform_product_reality'));assert(html.includes('omega_member_product_reality'));
assert(html.includes('data-observatory'));assert(html.includes('TRUTH CONTRACT'));
assert(js.includes('OBSERVED ZERO'));assert(js.includes('CALCULATED'));assert(js.includes('SIGN IN REQUIRED'));
assert(!js.includes('innerHTML'));assert(!js.includes('insertAdjacentHTML'));
assert(css.includes('@media'));console.log('Ω DATA OBSERVATORY CONTRACT: PASS');