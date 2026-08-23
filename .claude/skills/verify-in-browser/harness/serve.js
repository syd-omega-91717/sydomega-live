const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/user/sydomega-live';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.txt': 'text/plain' };
const cache = new Map();
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  // no caching: files are edited between test runs, a stale cache silently
  // serves the pre-fix copy and makes a real fix look like it failed.
  let buf; try { buf = fs.readFileSync(f); } catch (e) { buf = null; }
  if (buf === null) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(buf);
}).listen(8765, () => console.log('serving on 8765'));
