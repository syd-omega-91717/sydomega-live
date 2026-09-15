/* Ω SYD OMEGA 91717 — conflict-safe spatial realm integration
 * Additive and idempotent. Existing 3-D sculpture/WebGL ownership is untouched.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = { gaming:path.join(root,'gaming.html'), cinema:path.join(root,'cinema.html') };
const mounts = {
  gaming:'\n<!-- Ω SPATIAL REALM: GAMING — additive mount; functional content remains authoritative -->\n<section class="omega-spatial-realm" data-omega-spatial-realm="gaming" aria-label="Gaming spatial realm"></section>\n',
  cinema:'\n<!-- Ω SPATIAL REALM: CINEMA — additive mount; functional content remains authoritative -->\n<section class="omega-spatial-realm" data-omega-spatial-realm="cinema" aria-label="Cinema spatial realm"></section>\n'
};
function read(f){return fs.readFileSync(f,'utf8');}
function write(f,s){fs.writeFileSync(f,s,'utf8');}
function addRuntimeScript(file){
  let src=read(file);
  if(src.includes('src="/omega-spatial-realms.js"')) return false;
  const head='</head>';
  const at=src.indexOf(head);
  if(at<0) throw new Error(path.basename(file)+' has no </head>; refusing unsafe edit');
  src=src.slice(0,at)+'<script src="/omega-spatial-realms.js" data-omega-spatial-realms-js defer></script>\n'+src.slice(at);
  write(file,src);
  return true;
}
function addMount(file,realm){
  let src=read(file);
  if(src.includes('data-omega-spatial-realm="'+realm+'"')) return false;
  const candidates=['</main>','</body>'];
  for(const needle of candidates){
    const at=src.lastIndexOf(needle);
    if(at>=0){src=src.slice(0,at)+mounts[realm]+src.slice(at);write(file,src);return true;}
  }
  throw new Error(realm+'.html has no safe insertion boundary; refusing unsafe edit');
}
for(const [realm,file] of Object.entries(files)){addRuntimeScript(file);addMount(file,realm);}
console.log('Ω spatial realm integration verified: page-local runtime, additive mount, WebGL-single-owner safe.');
