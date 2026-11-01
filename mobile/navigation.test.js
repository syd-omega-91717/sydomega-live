// node navigation.test.js  -- exits non-zero on any failure.
const assert = require('assert');
const { hostOf, isInternal, isOpenableExternally } = require('./navigation');
const H = hostOf('https://sydomega.pages.dev');
let n = 0;
const t = (name, fn) => { fn(); n++; };

t('hostOf lowercases and drops path/port', () => {
  assert.strictEqual(hostOf('https://SydOmega.Pages.dev/'), 'sydomega.pages.dev');
  assert.strictEqual(hostOf('https://sydomega.pages.dev:8443/x'), 'sydomega.pages.dev');
});
t('hostOf rejects non-https and malformed sites', () => {
  for (const bad of ['http://sydomega.pages.dev', 'sydomega.pages.dev', '', null, 'https://', 'https://a@b.com', 'ftp://x.com'])
    assert.throws(() => hostOf(bad), /siteUrl must be/);
});
const allow = ['https://sydomega.pages.dev', 'https://sydomega.pages.dev/', 'https://sydomega.pages.dev/dashboard.html?x=1#h',
  'https://sydomega.pages.dev:443/x', 'HTTPS://SYDOMEGA.PAGES.DEV/', 'about:blank', 'blob:https://sydomega.pages.dev/abc'];
const deny = ['http://sydomega.pages.dev/', 'https://evil.com/', 'https://sydomega.pages.dev.evil.com/', 'https://evilsydomega.pages.dev/',
  'https://sydomega.pages.dev@evil.com/', 'https://evil.com@sydomega.pages.dev/', 'https://sydomega.pages.dev%40evil.com/',
  'https://sydomega.pages.dev\\@evil.com/', 'https://sydomega.pages.dev:8443/', 'data:text/html,<script>alert(1)</script>',
  'javascript:alert(1)', 'file:///etc/passwd', 'intent://x#Intent;end', '', 'about:srcdoc', undefined, null, 42];
allow.forEach(u => t('allow ' + u, () => assert.strictEqual(isInternal(u, H), true, u)));
deny.forEach(u => t('deny ' + String(u), () => assert.strictEqual(isInternal(u, H), false, String(u))));
t('external schemes', () => {
  for (const u of ['https://evil.com/', 'http://x.com', 'mailto:a@b.com', 'tel:+123']) assert.strictEqual(isOpenableExternally(u), true, u);
  for (const u of ['javascript:alert(1)', 'data:text/html,x', 'file:///x', 'intent://x', '', null]) assert.strictEqual(isOpenableExternally(u), false, String(u));
});
console.log('navigation.test.js: ' + n + ' assertions passed');
