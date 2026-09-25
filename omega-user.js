/* ==========================================================================
   Ω SYD OMEGA 91717 — OMEGA USER ENGINE
   Loads the current user's full profile from Supabase and populates
   every standard data element on every page automatically.
   Owner always shows at absolute apex. Each member sees their own data.
   ========================================================================== */
(function(){

/* ── CANONICAL OWNER DATA (absolute, locked) ─────────────────────────────── */
var OWNER = {
  display_name    : 'MAJOR SLEIMAN YOUSSEF DAGHER',
  full_name       : 'Major Sleiman Youssef Dagher',
  title           : 'ARCHITECT & SOVEREIGN FOUNDER',
  order_number    : 'LEBANESE ORDER OF ENGINEERS NO. 30875',
  sign            : 'Aries',
  element         : 'fire',
  god             : 'Ares',
  agent           : 'Sentinel',
  token           : 'ARENITE',
  axis_a          : 9.000,
  axis_b          : 9.000,
  axis_c          : 9.000,
  authority       : 27.8367,
  a3              : 729.000,
  b3              : 729.000,
  c3              : 729.000,
  nodes_earned    : 104976,
  trophies_earned : 12,
  medals_earned   : 12,
  certificates_earned: 12,
  subscription_tier: 'sovereign',
  tier_label      : 'SOVEREIGN ARCHITECT',
  access_type     : '\u221e LIFETIME SOVEREIGN',
  level           : '9.9.9',
  identity        : '\u03A9-91717-SYD-001 \u00b7 OMEGA PRIME \u00b7 LEVEL 9.9.9',
  is_owner        : true,
  access_approved : true,
  is_trial        : false,
};

/* ── AUTH FORMULA ────────────────────────────────────────────────────────── */
var PHI = 1.6180339887, EU = 2.7182818285;
function calcAuth(a, b, c){
  return Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
}

/* ── SET ELEMENT HELPER ──────────────────────────────────────────────────── */
function se(id, val){
  var el = document.getElementById(id);
  if(el && val != null) el.textContent = String(val);
}
function seAll(ids, val){
  ids.forEach(function(id){ se(id, val); });
}

/* ── POPULATE PAGE WITH USER DATA ───────────────────────────────────────── */
window.__omegaPopulate = function(pr, user){
  if(!pr) return;
  var isOwner = pr.is_owner;

  /* Merge owner canonical data if owner */
  var d = isOwner ? Object.assign({}, pr, OWNER) : pr;

  var a    = Number(d.axis_a || 0.001);
  var b    = Number(d.axis_b || 0.001);
  var c    = Number(d.axis_c || 0.001);
  var auth = isOwner ? 27.8367 : calcAuth(a,b,c);
  var a3   = isOwner ? 729.000 : Math.pow(a,3);
  var b3   = isOwner ? 729.000 : Math.pow(b,3);
  var c3   = isOwner ? 729.000 : Math.pow(c,3);
  /* Cache authority for offline page */
  try{ localStorage.setItem('omega_cached_auth', auth.toFixed(4)); localStorage.setItem('omega_last_online', Date.now()); }catch(e){}

  var name  = isOwner ? OWNER.display_name : (d.display_name||'').toUpperCase()||(user&&user.email||'SOVEREIGN MEMBER').toUpperCase();
  var sign  = (d.sign    || 'AWAITING ASSIGNMENT').toUpperCase();
  var elem  = (d.element || 'AWAITING ASSIGNMENT').toUpperCase();
  var god   = (d.god     || 'AWAITING ASSIGNMENT').toUpperCase();
  var agent = (d.agent   || 'AWAITING ASSIGNMENT').toUpperCase();
  var token = (d.token   || 'AWAITING ASSIGNMENT').toUpperCase();
  var tier  = isOwner ? 'SOVEREIGN' : (d.subscription_tier||'free').toUpperCase();
  var nodes = Number(d.nodes_earned||0);
  var troph = Number(d.trophies_earned||0);
  var medal = Number(d.medals_earned||0);
  var certs = Number(d.certificates_earned||0);

  /* ── NAME everywhere ── */
  var nameIds=['ph-name','phm-name','user-name','profile-name','pf-name','pp-name',
               'bl-name','id-name','ach-name','hero-name','member-name','dash-name'];
  nameIds.forEach(function(id){ se(id, name); });
  /* hero-title: special treatment */
  var ht=document.getElementById('hero-title');
  if(ht) ht.textContent = isOwner ? OWNER.display_name : name;

  /* ── IDENTITY ── */
  var heroSub=document.getElementById('hero-sub');
  if(heroSub){
    if(isOwner){
      heroSub.innerHTML='PLATFORM IDENTITY: '+OWNER.identity+'<br>'
        +OWNER.order_number+'<br>'
        +'COSMOLOGY: ARIES \u00b7 FIRE \u00b7 ARES \u00b7 SENTINEL \u00b7 ARENITE';
    }
  }

  /* ── TITLE / ROLE ── */
  var pht=document.getElementById('ph-title');
  if(pht) pht.textContent = isOwner ? OWNER.title : 'SOVEREIGN MEMBER';
  var phid=document.querySelector('.phm-id');
  if(phid) phid.textContent = isOwner ? 'PLATFORM IDENTITY: '+OWNER.identity : 'SOVEREIGN MEMBER';

  /* ── COSMOLOGY ── */
  seAll(['ph-sign','user-sign','id-sign','pf-sign','pp-sign','bl-sign'], sign);
  seAll(['ph-element','user-element','pf-element','bl-element'],elem);
  seAll(['ph-god','user-god','pf-god'],god);
  seAll(['ph-agent','user-agent','pf-agent'],agent);
  seAll(['ph-token','user-token','pf-token'],token);

  /* identity page compound */
  var idSign=document.getElementById('id-sign');
  if(idSign) idSign.textContent=sign+' / '+elem;
  var idGod=document.getElementById('id-god');
  if(idGod) idGod.textContent=god+' / '+agent;

  /* ── AUTHORITY ── */
  var authStr = auth.toFixed(4);
  seAll(['ph-auth','user-auth','pf-auth','pf-auth2','pp-auth','ach-auth',
         'f-auth','f-auth2','hero-auth'], authStr);
  /* hd-auth-* (from redesign hero bands) */
  document.querySelectorAll('[id^="hd-auth-"]').forEach(function(el){el.textContent=authStr;});

  /* ── AXIS VALUES ── */
  var aStr=a.toFixed(3), bStr=b.toFixed(3), cStr=c.toFixed(3);
  seAll(['ph-axis-a','user-axis-a','pf-val-a','ax-a','mat-a-disp'], isOwner?'9.000':aStr);
  seAll(['ph-axis-b','user-axis-b','pf-val-b','ax-b','mat-b-disp'], isOwner?'9.000':bStr);
  seAll(['ph-axis-c','user-axis-c','pf-val-c','ax-c','mat-c-disp'], isOwner?'9.000':cStr);
  seAll(['ax-a3','mat-a3','pf-a3'], a3.toFixed(3));
  seAll(['ax-b3','mat-b3','pf-b3'], b3.toFixed(3));
  seAll(['ax-c3','mat-c3','pf-c3'], c3.toFixed(3));

  /* progress bars */
  ['pf-bar-a','mat-a-pb','ax-a-bar'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.style.width=((isOwner?9:a)/9*100).toFixed(1)+'%';
  });
  ['pf-bar-b','mat-b-pb','ax-b-bar'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.style.width=((isOwner?9:b)/9*100).toFixed(1)+'%';
  });
  ['pf-bar-c','mat-c-pb','ax-c-bar'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.style.width=((isOwner?9:c)/9*100).toFixed(1)+'%';
  });

  /* ── TIER / SUBSCRIPTION ── */
  seAll(['ph-tier','sub-tier','user-tier','pf-tier','id-tier'], tier);
  seAll(['mem-tier'], tier);

  /* ── NODES ── */
  seAll(['ph-nodes','user-nodes','pf-nodes','stat-nodes'], nodes===0?'0 (GENESIS)':nodes.toLocaleString());

  /* ── ACHIEVEMENTS ── */
  seAll(['ph-trophies','user-trophies','pf-trophies','ach-trophies'], troph);
  seAll(['ph-medals','user-medals','pf-medals','ach-medals'], medal);
  seAll(['ph-certs','user-certs','pf-certs','ach-certs'], certs);
  /* combined stat-honors */
  se('stat-honors', (troph+medal+certs).toString());

  /* ── ACCESS STATUS ── */
  var isTrial=d.is_trial&&d.trial_expires_at&&new Date(d.trial_expires_at)>new Date();
  var isPerm=d.access_approved&&!d.is_trial;
  var accessLabel=isOwner?'\u221e LIFETIME SOVEREIGN':
                  isPerm?'\u221e PERMANENT':
                  isTrial?'TRIAL ACTIVE':'PENDING';
  seAll(['id-status','mem-status','plan-access-type','user-status'], accessLabel);

  /* ── EMAIL ── */
  if(user){
    var email=user.email||'--';
    seAll(['id-email','au-email-disp'], email);
    var uid=user.id||'';
    se('id-uid', uid.slice(0,24)+'...');
    se('plan-uid', uid.slice(0,24)+'...');
  }

  /* ── KYC ── */
  se('id-kyc', (d.kyc_status||'PENDING').toUpperCase());

  /* ── HERO COORD (dashboard) ── */
  var hc=document.getElementById('hero-coord');
  if(hc){
    var fmt=function(v){return Number(v).toFixed(3);};
    hc.textContent='COORD ('+fmt(a)+', '+fmt(b)+', '+fmt(c)+')';
  }

  /* ── HERO BADGES (cosmology chain) ── */
  var hb=document.getElementById('hero-badges');
  if(hb&&d.sign){
    hb.innerHTML='<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:1.5px;color:var(--gold,#C9A84C)">'
      +sign+' \u00b7 '+elem+' \u00b7 '+god+' \u00b7 '+agent+' \u00b7 '+token
      +'</span>';
  }

  /* ── OWNER CONSOLE BLOCK ── */
  if(isOwner){
    var ocd=document.getElementById('owner-console-block');
    if(ocd) ocd.style.display='block';
    /* fetch member stats for owner console */
    if(window.__omegaSb){
      window.__omegaSb.rpc('get_all_members').then(function(r){
        var members=(r.data||[]).filter(function(m){return !m.is_owner;});
        var now=Date.now();
        var pending=members.filter(function(m){return !m.access_approved&&!m.is_rejected;}).length;
        var trial=members.filter(function(m){return m.access_approved&&m.is_trial&&m.trial_expires_at&&new Date(m.trial_expires_at)>now;}).length;
        var perm=members.filter(function(m){return m.access_approved&&!m.is_trial;}).length;
        var el=document.getElementById('owner-pending-count');
        if(el) el.innerHTML=(pending>0?'<span style="color:var(--crim,#C4453C)">\u25b2 '+pending+' PENDING</span>':'\u2713 NO PENDING')+' \u00b7 '+trial+' TRIAL \u00b7 '+perm+' PERMANENT';
        var el2=document.getElementById('owner-trial-count');
        if(el2) el2.textContent=members.length+' TOTAL MEMBERS IN THE ORDER';
      }).catch(function(e){ console.warn('[Omega] non-critical async operation failed:', e); });
    }
  }

  /* ── STORE GLOBALLY ── */
  window.__omegaProfile = d;
  /* Update lattice grids with current node count */
  var _nodes=isOwner?104976:Number(d.nodes_earned||0);
  document.querySelectorAll('[data-lattice]').forEach(function(el){
    el.setAttribute('data-nodes',_nodes);
    var _sys=el.getAttribute('data-lattice')||'canonical';
    if(window.renderLattice9x9&&(_sys==='plane'||_sys==='9x9')){window.renderLattice9x9(el,_nodes,{total:729});}
    else if(window.renderTrackGrid){window.renderTrackGrid(el,_sys,_nodes);}
  });
  window.__omegaUser    = user;
  window.__omegaAuth    = auth;
  window.__omegaIsOwner = isOwner;

  /* Canonical compatibility bridge for visual modules.
     Keep the historical OmegaAuth/OmegaSign contract backed by the same
     already-loaded profile rather than creating a second auth/data path. */
  window.OmegaAuth = window.OmegaAuth || {};
  window.OmegaAuth.getProfile = function(){ return window.__omegaProfile || null; };
  window.OmegaAuth.getUser = function(){ return window.__omegaUser || null; };
  window.OmegaSign = d.sign || null;

  window.__omegaUserLoaded = true;
  try{document.dispatchEvent(new CustomEvent('omega:populated',{detail:{profile:d},bubbles:false}));}catch(_){}
};

/* ── AUTO-RUN ON EVERY PAGE ─────────────────────────────────────────────── */
window.__omegaUserLoaded = false;
function tryPopulate(){
  if(window.__omegaUserLoaded) return;
  if(!window.__omegaSb) return;
  window.__omegaSb.auth.getSession().then(function(resp){
    var sess=resp.data&&resp.data.session;
    if(!sess) return;
    return window.__omegaSb.from('profiles').select('*').eq('id',sess.user.id).maybeSingle()
      .then(function(r){
        var pr=r.data||{};
        if(!pr.id) return;
        window.__omegaUserLoaded = true;
        window.__omegaPopulate(pr, sess.user);
      });
  }).catch(function(e){ console.warn('[Omega] non-critical async operation failed:', e); });
}

/* Run after Supabase is ready */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', function(){setTimeout(tryPopulate,300);});
} else {
  setTimeout(tryPopulate, 300);
}
/* Also run when explicitly triggered */
document.addEventListener('omega:populated', tryPopulate);

})();
