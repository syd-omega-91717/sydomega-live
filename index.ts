<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>&#937; SYD OMEGA 91717 &mdash; The Sovereign Order</title>
<meta name="description" content="SYD OMEGA 91717 &mdash; A sovereign digital order. Reveal your cosmology, ascend the 9x9x9 matrix, and take your place. The Code. The Frequency. The Legacy."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Courier+Prime:wght@400;700&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--void:#07070b;--panel:#0d0d15;--gold:#C9A84C;--solar:#E2C86D;--cyan:#00E5FF;--crimson:#8B0000;--ink:#e9e6dc;--muted:#85837b;--line:rgba(201,168,76,0.15);--D:'Cinzel Decorative',serif;--B:'Rajdhani',sans-serif;--M:'Courier Prime',monospace}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--void);color:var(--ink);font-family:var(--B);-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
canvas#scene{position:fixed;inset:0;width:100%;height:100%;z-index:0;display:block}
.z{position:relative;z-index:1}

/* HEADER */
header{position:fixed;top:0;left:0;right:0;z-index:9;display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 clamp(18px,4vw,48px);backdrop-filter:blur(6px);border-bottom:1px solid rgba(201,168,76,.1)}
.mark{font-family:var(--D);font-weight:900;color:var(--gold);font-size:19px;letter-spacing:1px}
.mark span{font-family:var(--M);font-size:9px;color:var(--muted);letter-spacing:3px;margin-left:8px}
.hnav{display:flex;gap:22px;font-family:var(--M);font-size:10px;letter-spacing:2px}
.hnav a{color:var(--muted);transition:color .15s}.hnav a:hover{color:var(--gold)}
.h-enter{font-family:var(--M);font-size:10px;letter-spacing:2px;color:var(--void);background:var(--gold);padding:8px 16px;border:1px solid var(--gold);transition:all .15s}.h-enter:hover{background:transparent;color:var(--gold)}
@media(max-width:680px){.hnav{display:none}}

/* HERO */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:90px 22px 60px}
.hero-ping{font-family:var(--M);font-size:11px;letter-spacing:4px;color:var(--cyan);margin-bottom:24px;display:inline-flex;align-items:center;gap:9px}
.hero-ping .dot{width:7px;height:7px;border-radius:50%;background:#3fb27f;box-shadow:0 0 12px #3fb27f;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}}
.hero h1{font-family:var(--D);font-weight:900;font-size:clamp(28px,7vw,74px);color:var(--gold);text-shadow:0 0 60px rgba(201,168,76,.35);line-height:1.05;letter-spacing:3px}
.hero-tag{font-family:var(--M);font-size:clamp(10px,2vw,13px);letter-spacing:7px;color:var(--ink);margin-top:18px;opacity:.85}
.hero-sub{font-weight:300;color:var(--muted);max-width:52ch;margin:20px auto 0;font-size:16px;line-height:1.65}
.hero-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:38px}
.hero-cta a{font-family:var(--M);letter-spacing:3px;font-size:11px;padding:14px 26px;border:1px solid var(--gold);color:var(--gold);background:rgba(7,7,11,.5);backdrop-filter:blur(4px);transition:all .22s}
.hero-cta a:hover,.hero-cta a.solid{color:var(--void);background:var(--gold)}
.hero-stats{display:flex;gap:clamp(20px,5vw,52px);margin-top:44px;flex-wrap:wrap;justify-content:center}
.hero-stat .n{font-family:var(--D);font-size:clamp(20px,4vw,32px);color:var(--gold)}
.hero-stat .l{font-family:var(--M);font-size:9px;letter-spacing:3px;color:var(--muted);margin-top:3px}
.scroll-cue{font-family:var(--M);font-size:10px;letter-spacing:3px;color:var(--muted);margin-top:52px;animation:float 2.8s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}

/* BANDS */
.band{position:relative;z-index:1;border-top:1px solid var(--line);padding:clamp(60px,9vw,110px) clamp(20px,5vw,80px);background:rgba(7,7,11,.88);backdrop-filter:blur(2px)}
.band-inner{max-width:1160px;margin:0 auto}
.eyebrow{font-family:var(--M);font-size:9px;letter-spacing:5px;color:var(--cyan);margin-bottom:14px}
.band h2{font-family:var(--D);font-size:clamp(20px,4vw,38px);color:var(--gold);font-weight:700;margin-bottom:16px;line-height:1.2}
.band .lead{font-weight:300;color:var(--muted);max-width:62ch;font-size:16px;line-height:1.7;margin-bottom:36px}

/* MODULE GRID */
.mod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1px;background:var(--line)}
.mod-card{background:var(--void);padding:18px;transition:background .18s;cursor:default}
.mod-card:hover{background:rgba(13,13,21,1)}
.mod-card .m-n{font-family:var(--M);font-size:9px;letter-spacing:3px;color:var(--muted);margin-bottom:6px}
.mod-card .m-title{font-family:var(--D);font-size:13px;color:var(--solar);font-weight:700;margin-bottom:6px;line-height:1.3}
.mod-card .m-desc{font-size:11px;font-weight:300;color:var(--muted);line-height:1.5}
.mod-card .m-bar{height:2px;margin-top:12px;background:linear-gradient(90deg,var(--col,var(--gold)),transparent)}

/* FILM ROW */
.film-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.film-tile{border:1px solid var(--line);background:var(--panel);padding:16px;position:relative;overflow:hidden}
.film-tile::before{content:"";position:absolute;top:0;left:0;right:0;height:2px}
.film-tile .f-num{font-family:var(--M);font-size:8px;letter-spacing:3px;color:var(--muted);margin-bottom:4px}
.film-tile .f-title{font-family:var(--D);font-size:14px;color:var(--gold);font-weight:900;margin-bottom:3px;line-height:1.2}
.film-tile .f-sub{font-family:var(--M);font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:6px}
.film-tile .f-year{font-family:var(--D);font-size:18px;color:var(--solar);font-weight:700}
.film-tile .f-el{font-family:var(--M);font-size:8px;letter-spacing:2px;margin-top:6px}

/* GAME ROW */
.game-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.game-tile{border:1px solid var(--line);background:var(--panel);padding:16px;border-top-width:2px}
.game-tile .g-n{font-family:var(--M);font-size:8px;letter-spacing:3px;color:var(--muted);margin-bottom:4px}
.game-tile .g-title{font-family:var(--D);font-size:13px;font-weight:900;margin-bottom:4px;line-height:1.2}
.game-tile .g-genre{font-family:var(--M);font-size:9px;letter-spacing:2px;color:var(--muted)}

/* AGENTS */
.agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.agent-card{border:1px solid var(--line);background:var(--panel);padding:16px;text-align:center}
.agent-card .a-icon{font-size:24px;margin-bottom:8px}
.agent-card .a-name{font-family:var(--D);font-size:13px;color:var(--gold);font-weight:700;margin-bottom:4px}
.agent-card .a-role{font-family:var(--M);font-size:9px;letter-spacing:2px;color:var(--cyan);margin-bottom:6px}
.agent-card .a-desc{font-size:11px;font-weight:300;color:var(--muted);line-height:1.5}

/* TIERS */
.tier-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1px;background:var(--line)}
.tier-card{background:var(--void);padding:18px 14px;text-align:center}
.tier-card.apex{background:rgba(13,13,21,.9)}
.tier-card .t-level{font-family:var(--M);font-size:8px;letter-spacing:2px;color:var(--muted);margin-bottom:5px}
.tier-card .t-name{font-family:var(--D);font-size:14px;font-weight:700;margin-bottom:6px}
.tier-card .t-price{font-family:var(--D);font-size:20px;color:var(--gold);font-weight:900}
.tier-card .t-price span{font-size:10px;font-family:var(--M);color:var(--muted)}
.tier-card .t-mat{font-family:var(--M);font-size:8px;letter-spacing:2px;color:var(--muted);margin-top:5px}

/* CLOSING + FOOTER */
.closing{text-align:center}
.closing h2{font-size:clamp(22px,5vw,46px)}
.closing .cta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:30px}
.closing .cta-row a{font-family:var(--M);letter-spacing:3px;font-size:12px;padding:15px 30px;border:1px solid var(--gold);color:var(--gold);transition:all .22s}
.closing .cta-row a:hover,.closing .cta-row a.solid{color:var(--void);background:var(--gold)}
footer{border-top:1px solid var(--line);padding:36px 22px;text-align:center;background:rgba(7,7,11,.9)}
footer .fo{font-family:var(--D);color:var(--gold);font-size:18px;letter-spacing:2px}
footer p{font-family:var(--M);font-size:10px;color:var(--muted);letter-spacing:2px;margin-top:8px;line-height:1.8}
footer .flinks{display:flex;gap:18px;justify-content:center;margin-top:16px;font-family:var(--M);font-size:10px;letter-spacing:2px}
footer .flinks a{color:var(--muted)}.flinks a:hover{color:var(--gold)}
</style>
</head>
<body>

<canvas id="scene"></canvas>

<header class="z">
  <div class="mark">&#937; SYD OMEGA <span>9 1 7 1 7</span></div>
  <nav class="hnav">
    <a href="#system">THE SYSTEM</a>
    <a href="#modules">MODULES</a>
    <a href="#cinema">UNIVERSE</a>
    <a href="#agents">INTELLIGENCE</a>
    <a href="#tiers">JOIN</a>
  </nav>
  <a class="h-enter" href="/enter.html">ENTER &#937;</a>
</header>

<main class="z">

  <!-- HERO -->
  <section class="hero">
    <div class="hero-ping"><span class="dot"></span> SYSTEM ONLINE &nbsp;&middot;&nbsp; 9.17 Hz &nbsp;&middot;&nbsp; NODE 9.9.9</div>
    <h1>SYD OMEGA<br>91717</h1>
    <div class="hero-tag">THE CODE &nbsp;&middot;&nbsp; THE FREQUENCY &nbsp;&middot;&nbsp; THE LEGACY</div>
    <p class="hero-sub">A sovereign digital order. Reveal the cosmology written in your birth, ascend a matrix of 729 nodes, and take your place among the Order.</p>
    <div class="hero-cta">
      <a class="solid" href="/enter.html">ENTER &#937;</a>
      <a href="/cinema.html">WATCH MYTH VERSE</a>
      <a href="/account.html">CREATE ACCOUNT</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><div class="n">729</div><div class="l">MATRIX NODES</div></div>
      <div class="hero-stat"><div class="n">18</div><div class="l">MODULES</div></div>
      <div class="hero-stat"><div class="n">9</div><div class="l">ELEMENTS</div></div>
      <div class="hero-stat"><div class="n">12</div><div class="l">AGENTS</div></div>
      <div class="hero-stat"><div class="n">9</div><div class="l">SAGA FILMS</div></div>
    </div>
    <div class="scroll-cue">&#8595; EXPLORE THE ORDER</div>
  </section>

  <!-- SYSTEM -->
  <section class="band" id="system">
    <div class="band-inner">
      <div class="eyebrow">THE UNIFYING ENGINE</div>
      <h2>Built on a Matrix of 729</h2>
      <p class="lead">Three axes &mdash; Knowledge, Mastery, Contribution &mdash; each from one to nine. Your authority is the magnitude of your position, rising from genesis at 1.73 toward the apex at 15.58. Every verified action moves your coordinates. Nothing is given. Everything is computed.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">
        <div style="border:1px solid var(--line);background:var(--panel);padding:22px">
          <div style="font-family:var(--D);font-size:28px;color:var(--cyan);margin-bottom:12px">A</div>
          <div style="font-family:var(--D);font-size:16px;color:var(--solar);margin-bottom:8px">KNOWLEDGE AXIS</div>
          <div style="font-weight:300;color:var(--muted);font-size:14px;line-height:1.6">What you learn, consume, and understand. Academy disciplines, horoscopic study, media completion, heritage discovery.</div>
        </div>
        <div style="border:1px solid var(--line);background:var(--panel);padding:22px">
          <div style="font-family:var(--D);font-size:28px;color:var(--gold);margin-bottom:12px">B</div>
          <div style="font-family:var(--D);font-size:16px;color:var(--solar);margin-bottom:8px">MASTERY AXIS</div>
          <div style="font-weight:300;color:var(--muted);font-size:14px;line-height:1.6">What you demonstrate and achieve. Gaming arena stages, challenge completions, milestone certifications, skill proofs.</div>
        </div>
        <div style="border:1px solid var(--line);background:var(--panel);padding:22px">
          <div style="font-family:var(--D);font-size:28px;color:var(--crimson);margin-bottom:12px">C</div>
          <div style="font-family:var(--D);font-size:16px;color:var(--solar);margin-bottom:8px">CONTRIBUTION AXIS</div>
          <div style="font-weight:300;color:var(--muted);font-size:14px;line-height:1.6">What you give back. Publications, consultancy, social reach, economic activity, family legacy, heritage records.</div>
        </div>
      </div>
      <div style="display:flex;gap:32px;margin-top:36px;flex-wrap:wrap">
        <div><div style="font-family:var(--D);font-size:32px;color:var(--gold)">&#8730;(A&#178;+B&#178;+C&#178;)</div><div style="font-family:var(--M);font-size:9px;letter-spacing:3px;color:var(--muted);margin-top:5px">AUTHORITY FORMULA</div></div>
        <div><div style="font-family:var(--D);font-size:32px;color:var(--gold)">1.73 &rarr; 15.58</div><div style="font-family:var(--M);font-size:9px;letter-spacing:3px;color:var(--muted);margin-top:5px">GENESIS &rarr; APEX</div></div>
        <div><div style="font-family:var(--D);font-size:32px;color:var(--gold)">12 &times; 729</div><div style="font-family:var(--M);font-size:9px;letter-spacing:3px;color:var(--muted);margin-top:5px">8,748 FULL FIELD</div></div>
      </div>
    </div>
  </section>

  <!-- 18 MODULES -->
  <section class="band" id="modules">
    <div class="band-inner">
      <div class="eyebrow">THE SOVEREIGN ECOSYSTEM</div>
      <h2>18 Modules. One Order.</h2>
      <p class="lead">Every surface of the platform is a module. Each module is a dimension of your evolution. Every action inside one feeds back into the 729-node matrix.</p>
    </div>
    <div class="mod-grid" id="mod-grid" style="margin-top:28px"></div>
    <div class="band-inner" style="margin-top:28px;text-align:center">
      <a href="/enter.html" style="font-family:var(--M);letter-spacing:3px;font-size:11px;padding:13px 28px;border:1px solid var(--gold);color:var(--gold);display:inline-block;transition:all .22s" onmouseover="this.style.background=this.style.color='var(--void)';this.style.background='var(--gold)'" onmouseout="this.style.background='transparent';this.style.color='var(--gold)'">EXPLORE ALL 18 MODULES &#8594;</a>
    </div>
  </section>

  <!-- CINEMATIC UNIVERSE -->
  <section class="band" id="cinema" style="background:rgba(10,5,5,.9)">
    <div class="band-inner">
      <div class="eyebrow">&#937; CINEMATIC UNIVERSE</div>
      <h2>Nine Films. One Saga.</h2>
      <p class="lead">The &#937; Saga chronicles the rise of the sovereign order from 2026 to 2034. Nine chapters, nine elements, one frequency. Each film unlocks a phase of the matrix and a layer of the platform.</p>
      <div class="film-row" id="film-row"></div>
      <div style="margin-top:20px;text-align:center">
        <a href="/cinema.html" style="font-family:var(--M);letter-spacing:3px;font-size:11px;padding:12px 26px;border:1px solid rgba(201,168,76,.4);color:var(--gold);display:inline-block">VIEW FULL UNIVERSE &rarr;</a>
      </div>
    </div>
  </section>

  <!-- GAMES -->
  <section class="band" id="games" style="background:rgba(5,5,12,.9)">
    <div class="band-inner">
      <div class="eyebrow">GAMES UNIVERSE</div>
      <h2>Nine Games. Every Genre.</h2>
      <p class="lead">From open-world RPG to city simulation, the &#937; Games Universe spans every mode of play. Each game maps to a matrix axis and an element. Winning advances your Mastery coordinates.</p>
      <div class="game-row" id="game-row"></div>
    </div>
  </section>

  <!-- AI AGENTS -->
  <section class="band" id="agents">
    <div class="band-inner">
      <div class="eyebrow">AI CIVILIZATION ENGINE</div>
      <h2>Twelve Agents. Always Active.</h2>
      <p class="lead">Each member is assigned an AI agent at onboarding, determined by their zodiac. All twelve agents operate continuously &mdash; guiding, protecting, analysing, and expanding the Order.</p>
      <div class="agent-grid" id="agent-grid"></div>
    </div>
  </section>

  <!-- TIERS -->
  <section class="band" id="tiers" style="background:rgba(10,8,3,.92)">
    <div class="band-inner">
      <div class="eyebrow">SOVEREIGN MEMBERSHIP</div>
      <h2>Nine Tiers. One Ascent.</h2>
      <p class="lead">Every tier is a material. Every material is a matrix milestone. From Sand at genesis to the Omega Master at the apex. Rise through the tiers by rising through the matrix &mdash; they are the same movement.</p>
    </div>
    <div class="tier-row" id="tier-row" style="margin-top:28px"></div>
    <div class="band-inner" style="margin-top:24px;text-align:center">
      <a href="/account.html" style="font-family:var(--M);letter-spacing:3px;font-size:11px;padding:14px 32px;border:1px solid var(--gold);color:var(--void);background:var(--gold);display:inline-block">JOIN THE ORDER &#8594;</a>
    </div>
  </section>

  <!-- CLOSING -->
  <section class="band closing">
    <div class="band-inner">
      <div class="eyebrow">THE THRESHOLD</div>
      <h2>The Gate is Open</h2>
      <p class="lead">Reveal your sign. Receive your agent. Begin to ascend. Everything you have been is already written in the frequency. The matrix is waiting.</p>
      <div class="cta-row">
        <a class="solid" href="/enter.html">ENTER THE ORDER &#8594;</a>
        <a href="/account.html">CREATE MEMBER ACCOUNT</a>
        <a href="/charter.html">READ THE CHARTER</a>
      </div>
    </div>
  </section>

</main>

<footer class="z">
  <div class="fo">&#937; 91717</div>
  <p>SOVEREIGN ENGINEERING PROTOCOL &nbsp;&middot;&nbsp; THE CODE &nbsp;&middot;&nbsp; THE FREQUENCY &nbsp;&middot;&nbsp; THE LEGACY</p>
  <p style="margin-top:4px">100% OWNED BY SLEIMAN YOUSSEF DAGHER &nbsp;&middot;&nbsp; EST. 22 DEC 2025</p>
  <div class="flinks">
    <a href="/charter.html">CHARTER</a>
    <a href="/terms.html">TERMS</a>
    <a href="/hall.html">HALL OF THE ORDER</a>
    <a href="/account.html">MEMBER ACCESS</a>
  </div>
</footer>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
/* --- DATA --- */
var MODULES=[
  {n:'M01',t:'PLATFORM CORE',d:'Auth, profile, search, payments',col:'#C9A84C'},
  {n:'M02',t:'CONSULTANCY HUB',d:'7 sectors, booking, expert reports',col:'#00E5FF'},
  {n:'M03',t:'GAMING & CHARACTERS',d:'9 games, 9 stages, character system',col:'#E86A3A'},
  {n:'M04',t:'NFT & DIGITAL ASSETS',d:'Blockchain, wallet, ownership',col:'#9B6BF0'},
  {n:'M05',t:'AI COGNITION ENGINE',d:'12 agents, concierge, oracle layer',col:'#00E5FF'},
  {n:'M06',t:'HOROSCOPE & ASTROLOGY',d:'Daily readings, birth charts, signs',col:'#C9A84C'},
  {n:'M07',t:'SOCIAL & COMMUNITY',d:'7 platform hub, broadcast, feed',col:'#E2C86D'},
  {n:'M08',t:'MEDIA CENTER',d:'9 films, 9 series, streaming ready',col:'#8B0000'},
  {n:'M09',t:'EDUCATION & TUTORING',d:'12 disciplines, academy engine',col:'#34C6E6'},
  {n:'M10',t:'NEWS & INTELLIGENCE',d:'AI-curated feeds, wire, analytics',col:'#00E5FF'},
  {n:'M11',t:'FAMILY & HERITAGE',d:'Lineage tree, archives, cultural roots',col:'#C9A84C'},
  {n:'M12',t:'INVESTMENT & ECONOMY',d:'Portfolio, income allocation, tokens',col:'#E2C86D'},
  {n:'M13',t:'HEALTH & WELLNESS',d:'Mind, heart, soul, Ninth Element',col:'#3fb27f'},
  {n:'M14',t:'E-COMMERCE & MARKETPLACE',d:'Listings, offers, settlement engine',col:'#C9A84C'},
  {n:'M15',t:'EVENTS & CONFERENCES',d:'Sovereign calendar, XP events',col:'#00E5FF'},
  {n:'M16',t:'TRAVEL & EXPERIENCES',d:'Heritage routes, Space element',col:'#9B6BF0'},
  {n:'M17',t:'ADMIN & SYSTEM CONTROL',d:'Approvals, automation, settings',col:'#E86A3A'},
  {n:'M18',t:'&#937; CITY & INFRASTRUCTURE',d:'Sovereign smart city, city matrix',col:'#C9A84C'},
];
var FILMS=[
  {n:1,t:'THE ORIGIN',sub:'THE CODE AWAKENS',y:2026,el:'FIRE',col:'#E86A3A'},
  {n:2,t:'THE BLOODLINE',sub:'WAR FOR POWER',y:2027,el:'WATER',col:'#34C6E6'},
  {n:3,t:'THE ASCENSION',sub:'PATH OF THE CHOSEN',y:2028,el:'WIND',col:'#A9C2D8'},
  {n:4,t:'THE CIVIL WAR',sub:'KINGDOMS COLLIDE',y:2029,el:'METAL',col:'#C7CDD6'},
  {n:5,t:'THE REVELATION',sub:'SECRETS OF &#937;',y:2030,el:'SAND',col:'#D9B86A'},
  {n:6,t:'THE REBIRTH',sub:'FALL OF THE OLD WORLD',y:2031,el:'SOUL',col:'#E8E8FF'},
  {n:7,t:'THE CONVERGENCE',sub:'REALMS UNITE',y:2032,el:'SPACE',col:'#9B6BF0'},
  {n:8,t:'THE ETERNITY CODE',sub:'BEYOND TIME',y:2033,el:'VOID',col:'#7B00FF'},
  {n:9,t:'THE NEW DAWN',sub:'LEGACY FOREVER',y:2034,el:'THE NINTH',col:'#C9A84C'},
];
var GAMES=[
  {n:1,t:'&#937; MYTH-VERSE',g:'RPG / OPEN WORLD',col:'#E86A3A'},
  {n:2,t:'&#937; WARRIORS',g:'ACTION / ADVENTURE',col:'#C9A84C'},
  {n:3,t:'&#937; LEGACY',g:'STRATEGY / EMPIRE',col:'#A9C2D8'},
  {n:4,t:'&#937; ARENA',g:'COMPETITIVE / PvP',col:'#00E5FF'},
  {n:5,t:'&#937; FRONTIER',g:'SPACE EXPLORATION',col:'#9B6BF0'},
  {n:6,t:'&#937; SHADOWS',g:'STEALTH / ASSASSIN',col:'#8B0000'},
  {n:7,t:'&#937; REBIRTH',g:'SURVIVAL / POST-APOC.',col:'#7B00FF'},
  {n:8,t:'&#937; ASCENSION',g:'MMORPG',col:'#E2C86D'},
  {n:9,t:'&#937; OMEGA CITY',g:'SIM / CITY BUILDER',col:'#D9B86A'},
];
var AGENTS=[
  {icon:'&#x25CF;',n:'SENTINEL',r:'SECURITY',d:'Firewall, threat detection, session guard'},
  {icon:'&#x25C8;',n:'ANALYST',r:'FINANCE',d:'Portfolio, income, allocation logic'},
  {icon:'&#x2736;',n:'HISTORIAN',r:'ARCHIVE',d:'Memory keeper, heritage, audit log'},
  {icon:'&#x2726;',n:'TUTOR',r:'EDUCATION',d:'Knowledge engine, academy guide'},
  {icon:'&#x21C4;',n:'MERCHANT',r:'COMMERCE',d:'Marketplace, transactions, trades'},
  {icon:'&#x25B6;',n:'PROXY',r:'EXECUTION',d:'Task delegation, authority routing'},
  {icon:'&#x2609;',n:'ORACLE',r:'PREDICTION',d:'Horoscope, cosmic signals, forecasting'},
  {icon:'&#x25C9;',n:'SCOUT',r:'DISCOVERY',d:'News intelligence, trend tracking'},
  {icon:'&#x22D4;',n:'WARDEN',r:'FAMILY',d:'Lineage protection, heritage sync'},
  {icon:'&#x2699;',n:'AUDITOR',r:'VALIDATION',d:'Integrity checks, credential seal'},
  {icon:'&#x2726;',n:'BEACON',r:'ONBOARDING',d:'New member orientation, system map'},
  {icon:'&#x03A9;',n:'SOVEREIGN',r:'MASTER',d:'Owner dashboard, Order command'},
];
var TIERS=[
  {l:1,n:'INITIATE',p:'9.17',m:'SAND'},
  {l:2,n:'EXPLORER',p:'19.17',m:'GLASS'},
  {l:3,n:'SEEKER',p:'29.17',m:'IRON'},
  {l:4,n:'WARRIOR',p:'49.17',m:'STEEL'},
  {l:5,n:'CHAMPION',p:'79.17',m:'TITANIUM'},
  {l:6,n:'SOVEREIGN',p:'119.17',m:'CARBON'},
  {l:7,n:'LEGEND',p:'179.17',m:'GOLD'},
  {l:8,n:'INFINITE',p:'259.17',m:'PLATINUM'},
  {l:9,n:'&#937; NEXUS',p:'917.17',m:'OMEGA MASTER'},
];

/* --- RENDER --- */
(function(){
  var mg=document.getElementById('mod-grid');
  MODULES.forEach(function(m){
    var c=document.createElement('div'); c.className='mod-card';
    c.style.setProperty('--col',m.col);
    c.innerHTML='<div class="m-n">'+m.n+'</div><div class="m-title">'+m.t+'</div><div class="m-desc">'+m.d+'</div><div class="m-bar"></div>';
    mg.appendChild(c);
  });
  var fr=document.getElementById('film-row');
  FILMS.forEach(function(f){
    var c=document.createElement('div'); c.className='film-tile';
    c.style.borderTopColor=f.col;
    c.innerHTML='<div class="f-num">FILM '+String(f.n).padStart(2,'0')+'</div><div class="f-title">'+f.t+'</div><div class="f-sub">'+f.sub+'</div><div class="f-year">'+f.y+'</div><div class="f-el" style="color:'+f.col+'">'+f.el+'</div>';
    fr.appendChild(c);
  });
  var gr=document.getElementById('game-row');
  GAMES.forEach(function(g){
    var c=document.createElement('div'); c.className='game-tile';
    c.style.borderTopColor=g.col;
    c.innerHTML='<div class="g-n">GAME '+String(g.n).padStart(2,'0')+'</div><div class="g-title" style="color:'+g.col+'">'+g.t+'</div><div class="g-genre">'+g.g+'</div>';
    gr.appendChild(c);
  });
  var ag=document.getElementById('agent-grid');
  AGENTS.forEach(function(a){
    var c=document.createElement('div'); c.className='agent-card';
    c.innerHTML='<div class="a-icon">'+a.icon+'</div><div class="a-name">'+a.n+'</div><div class="a-role">'+a.r+'</div><div class="a-desc">'+a.d+'</div>';
    ag.appendChild(c);
  });
  var tr=document.getElementById('tier-row');
  TIERS.forEach(function(t){
    var c=document.createElement('div'); c.className='tier-card'+(t.l===9?' apex':'');
    c.innerHTML='<div class="t-level">TIER '+t.l+'</div><div class="t-name" style="color:'+(t.l===9?'#C9A84C':t.l>=7?'#E2C86D':'#e9e6dc')+'">'+t.n+'</div><div class="t-price">$'+t.p+'<span>/mo</span></div><div class="t-mat">'+t.m+'</div>';
    tr.appendChild(c);
  });
})();

/* --- WEBGL HERO --- */
(function(){
  if(typeof THREE==='undefined') return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W=window.innerWidth,H=window.innerHeight;
  var renderer=new THREE.WebGLRenderer({canvas:document.getElementById('scene'),antialias:true,alpha:true});
  function size(){renderer.setSize(window.innerWidth,window.innerHeight,false);}
  size(); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,200);
  camera.position.set(0,0,22);
  var group=new THREE.Group(); scene.add(group);
  var GOLD=0xC9A84C, CYAN=0x00E5FF, CRIMSON=0x8B0000;
  /* Matrix lattice */
  var pos=[],col=[];
  for(var x=-4;x<=4;x++) for(var y=-4;y<=4;y++) for(var z=-4;z<=4;z++){
    pos.push(x*1.8,y*1.8,z*1.8);
    var g=Math.abs(x)+Math.abs(y)+Math.abs(z);
    if(g===0){col.push(1,0.85,0.3);}
    else if(g<=3){col.push(0,0.9,1);}
    else{col.push(0.55,0.45,0.18);}
  }
  var pg=new THREE.BufferGeometry();
  pg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  pg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  group.add(new THREE.Points(pg,new THREE.PointsMaterial({size:0.18,vertexColors:true,transparent:true,opacity:0.85})));
  /* Omega symbol */
  function omegaCanvas(){
    var c=document.createElement('canvas'); c.width=c.height=256;
    var x=c.getContext('2d');
    x.fillStyle='#E2C86D'; x.shadowColor='rgba(201,168,76,0.9)'; x.shadowBlur=30;
    x.font='700 180px "Cinzel Decorative",serif'; x.textAlign='center'; x.textBaseline='middle';
    x.fillText('\u03A9',128,140);
    return new THREE.CanvasTexture(c);
  }
  var omat=new THREE.MeshBasicMaterial({map:omegaCanvas(),transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  var oG=new THREE.Group();
  oG.add(new THREE.Mesh(new THREE.PlaneGeometry(5,5),omat));
  var p2=new THREE.Mesh(new THREE.PlaneGeometry(5,5),omat); p2.rotation.y=Math.PI/2; oG.add(p2);
  group.add(oG);
  /* Stars */
  var sp=[]; for(var s=0;s<400;s++){var r=20+Math.random()*50,th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);sp.push(r*Math.sin(ph)*Math.cos(th),r*Math.sin(ph)*Math.sin(th),r*Math.cos(ph));}
  var sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:GOLD,size:0.1,transparent:true,opacity:0.45})));
  group.rotation.x=-0.4;
  function render(){requestAnimationFrame(render);group.rotation.y+=0.0032;oG.rotation.y-=0.004;renderer.render(scene,camera);}
  window.addEventListener('resize',function(){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();size();});
  if(reduce){renderer.render(scene,camera);}else{render();}
})();
</script>
</body>
</html>
