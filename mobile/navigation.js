// Navigation policy for the WebView shell. Pure and dependency-free so it can be
// tested with plain node (see navigation.test.js); App.js is the only caller.

// Host (lowercased, no port) of the configured site. Throws unless it is https:
// a cleartext origin would put the member's session in the clear.
function hostOf(site) {
  const m = /^https:\/\/([^\/?#\\@:]+)(?::\d+)?(?:[\/?#]|$)/i.exec(String(site || ''));
  if (!m) throw new Error('siteUrl must be an https:// URL with a plain host, got: ' + site);
  return m[1].toLowerCase();
}

// True only for the site's own https origin, plus about:blank and blob: (blob
// URLs are origin-scoped, minted by the page itself). http://, data:, javascript:
// and every other host are not internal.
function isInternal(url, host) {
  if (typeof url !== 'string') return false;
  if (url === 'about:blank' || url.indexOf('blob:') === 0) return true;
  // Authority may not contain '@' (userinfo) or '\' (parsers disagree on it).
  const m = /^https:\/\/([^\/?#\\@]+)(?:[\/?#]|$)/i.exec(url);
  if (!m) return false;
  return m[1].toLowerCase().replace(/:443$/, '') === String(host).toLowerCase();
}

// Only these schemes may be handed to the OS; anything else is dropped.
function isOpenableExternally(url) {
  return typeof url === 'string' && /^(https?:|mailto:|tel:)/i.test(url);
}

module.exports = { hostOf, isInternal, isOpenableExternally };
