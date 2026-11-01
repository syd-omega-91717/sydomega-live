// node navigation.test.js  -- exits non-zero on any failure.
const assert = require('assert');
const { hostOf, hostsOf, isInternal, isOpenableExternally } = require('./navigation');
const H = hostsOf('https://sydomega.com');
let n = 0;
const t = (name, fn) => { fn(); n++; };

t('hostOf lowercases and drops path/port', () => {
  assert.strictEqual(hostOf('https://SydOmega.Com/'), 'sydomega.com');
  assert.strictEqual(hostOf('https://sydomega.com:8443/x'), 'sydomega.com');
});
t('hostOf rejects non-https and malformed sites', () => {
  for (const bad of ['http://sydomega.com', 'sydomega.com', '', null, 'https://', 'https://a@b.com', 'ftp://x.com'])
    assert.throws(() => hostOf(bad), /siteUrl must be/);
});
t('hostsOf is apex + www, from either spelling', () => {
  assert.deepStrictEqual(hostsOf('https://sydomega.com'), ['sydomega.com', 'www.sydomega.com']);
  assert.deepStrictEqual(hostsOf('https://www.sydomega.com/x'), ['www.sydomega.com', 'sydomega.com']);
});

const allow = ['https://sydomega.com', 'https://sydomega.com/', 'https://sydomega.com/dashboard.html?x=1#h',
  'https://sydomega.com:443/x', 'HTTPS://SYDOMEGA.COM/', 'https://www.sydomega.com/', 'https://WWW.SydOmega.com/account.html',
  'about:blank', 'blob:https://sydomega.com/abc'];
const deny = ['http://sydomega.com/', 'http://www.sydomega.com/', 'https://evil.com/', 'https://sydomega.com.evil.com/',
  'https://www.sydomega.com.evil.com/', 'https://evilsydomega.com/', 'https://wwwsydomega.com/', 'https://evil.www.sydomega.com/',
  'https://clickhouse.sydomega.com/', 'https://sydomega.pages.dev/', 'https://sydomega.com@evil.com/', 'https://evil.com@sydomega.com/',
  'https://sydomega.com%40evil.com/', 'https://sydomega.com\\@evil.com/', 'https://sydomega.com:8443/',
  'data:text/html,<script>alert(1)</script>', 'javascript:alert(1)', 'file:///etc/passwd', 'intent://x#Intent;end', '',
  'about:srcdoc', undefined, null, 42];
allow.forEach(u => t('allow ' + u, () => assert.strictEqual(isInternal(u, H), true, u)));
deny.forEach(u => t('deny ' + String(u), () => assert.strictEqual(isInternal(u, H), false, String(u))));
t('a single host string still works', () => {
  assert.strictEqual(isInternal('https://sydomega.com/', 'sydomega.com'), true);
  assert.strictEqual(isInternal('https://www.sydomega.com/', 'sydomega.com'), false);
});
t('external schemes', () => {
  for (const u of ['https://evil.com/', 'http://x.com', 'mailto:a@b.com', 'tel:+123']) assert.strictEqual(isOpenableExternally(u), true, u);
  for (const u of ['javascript:alert(1)', 'data:text/html,x', 'file:///x', 'intent://x', '', null]) assert.strictEqual(isOpenableExternally(u), false, String(u));
});
console.log('navigation.test.js: ' + n + ' assertions passed');
