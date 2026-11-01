// Navigation policy for the WebView shell. Pure and dependency-free so it can be
// tested with plain node (see navigation.test.js); App.js is the only caller.

// Host (lowercased, no port) of the configured site. Throws unless it is https:
// a cleartext origin would put the member's session in the clear.
function hostOf(site) {
  const m = /^https:\/\/([^\/?#\\@:]+)(?::\d+)?(?:[\/?#]|$)/i.exec(String(site || ''));
  if (!m) throw new Error('siteUrl must be an https:// URL with a plain host, got: ' + site);
  return m[1].toLowerCase();
}

// The site is served on its apex and on www (both active; canonical tags use both), so a WebView
// that only accepted one would bounce the other to the browser. Other subdomains are NOT the site.
function hostsOf(site) {
  const h = hostOf(site);
  return h.indexOf('www.') === 0 ? [h, h.slice(4)] : [h, 'www.' + h];
}

// True only for the site's own https origin (any host in `hosts`: a string or an array), plus
// about:blank and blob: (blob URLs are origin-scoped, minted by the page itself). http://, data:,
// javascript:, every other host and every other subdomain are not internal.
function isInternal(url, hosts) {
  if (typeof url !== 'string') return false;
  if (url === 'about:blank' || url.indexOf('blob:') === 0) return true;
  // Authority may not contain '@' (userinfo) or '\' (parsers disagree on it).
  const m = /^https:\/\/([^\/?#\\@]+)(?:[\/?#]|$)/i.exec(url);
  if (!m) return false;
  const h = m[1].toLowerCase().replace(/:443$/, '');
  const list = Array.isArray(hosts) ? hosts : [hosts];
  return list.some(function (x) { return String(x).toLowerCase() === h; });
}

// Only these schemes may be handed to the OS; anything else is dropped.
function isOpenableExternally(url) {
  return typeof url === 'string' && /^(https?:|mailto:|tel:)/i.test(url);
}

module.exports = { hostOf, hostsOf, isInternal, isOpenableExternally };
