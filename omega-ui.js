/* ==========================================================================
   Ω SYD OMEGA 91717 — UNIFIED UI SYSTEM (omega-ui.js)
   
   Platform-wide UI unification layer. Applies consistent:
   A. BREADCRUMB NAV  — context path shown on every page
   B. PAGE FOOTER     — unified footer with auth formula + links
   C. RELATED LINKS   — contextual "you might also want" links
   D. QUICK NAV BAR   — prev/next page keyboard + button navigation
   E. BACK BUTTON     — universal back-to-dashboard button
   F. FOCUS MANAGEMENT — keyboard focus trap cleanup
   G. RESPONSIVE FIXES — mobile overflow, landscape mode
   ========================================================================== */
(function(){
  if(window.__omegaUIActive) return;
  window.__omegaUIActive = true;

  var PAGE_META = {
    dashboard:    {label:'Command Bridge',  section:'COMMAND',    prev:null,             next:'analytics'},
    analytics:    {label:'Analytics',       section:'INTEL',      prev:'dashboard',      next:'intelligence'},
    intelligence: {label:'Intelligence',    section:'INTEL',      prev:'analytics',      next:'sovereign-ai'},
    'sovereign-ai':{label:'AI Command',     section:'AI',         prev:'intelligence',   next:'chatbot'},
    chatbot:      {label:'Concierge',       section:'AI',         prev:'sovereign-ai',   next:'agents'},
    agents:       {label:'Agents',          section:'AI',         prev:'chatbot',        next:'gaming'},
    evolution:    {label:'Evolution',       section:'PROGRESSION',prev:'dashboard',      next:'gates'},
    gates:        {label:'Gates',           section:'PROGRESSION',prev:'evolution',      next:'grades'},
    grades:       {label:'Grades',          section:'PROGRESSION',prev:'gates',          next:'levels'},
    levels:       {label:'Levels',          section:'PROGRESSION',prev:'grades',         next:'phases'},
    phases:       {label:'Phases',          section:'PROGRESSION',prev:'levels',         next:'ascension'},
    matrix:       {label:'Lattice Matrix',  section:'PROGRESSION',prev:'phases',         next:'evolution'},
    gaming:       {label:'Mastery',         section:'MASTERY',    prev:'agents',         next:'achievements'},
    achievements: {label:'Achievements',    section:'MASTERY',    prev:'gaming',         next:'trophies'},
    trophies:     {label:'Trophies',        section:'MASTERY',    prev:'achievements',   next:'honors'},
    vault:        {label:'Treasury',        section:'FINANCE',    prev:'dashboard',      next:'investment'},
    investment:   {label:'Investment',      section:'FINANCE',    prev:'vault',          next:'revenue'},
    revenue:      {label:'Revenue',         section:'FINANCE',    prev:'investment',     next:'income'},
    income:       {label:'Income',          section:'FINANCE',    prev:'revenue',        next:'portfolio'},
    portfolio:    {label:'Portfolio',       section:'FINANCE',    prev:'income',         next:'wallet'},
    wallet:       {label:'Wallet',          section:'FINANCE',    prev:'portfolio',      next:'vault'},
    governance:   {label:'Governance',      section:'GOVERN',     prev:'dashboard',      next:'observatory'},
    observatory:  {label:'Observatory',     section:'GOVERN',     prev:'governance',     next:'enterprise'},
    enterprise:   {label:'Enterprise',      section:'GOVERN',     prev:'observatory',    next:'compliance'},
    compliance:   {label:'Compliance',      section:'GOVERN',     prev:'enterprise',     next:'privacy'},
    privacy:      {label:'Privacy',         section:'GOVERN',     prev:'compliance',     next:'governance'},
    roadmap:      {label:'Roadmap',         section:'STRATEGY',   prev:'ecosystem',      next:'lab'},
    ecosystem:    {label:'Ecosystem',       section:'STRATEGY',   prev:'roadmap',        next:'design-system'},
    lab:          {label:'Innovation Lab',  section:'STRATEGY',   prev:'roadmap',        next:'research'},
    profile:      {label:'My Profile',      section:'IDENTITY',   prev:'dashboard',      next:'credentials'},
    credentials:  {label:'Credentials',     section:'IDENTITY',   prev:'profile',        next:'kyc'},
    kyc:          {label:'KYC',             section:'IDENTITY',   prev:'credentials',    next:'passport'},
    passport:     {label:'Passport',        section:'IDENTITY',   prev:'kyc',            next:'profile'},
    cosmos:       {label:'Cosmos',          section:'COSMOS',     prev:'dashboard',      next:'horoscope'},
    horoscope:    {label:'Horoscope',       section:'COSMOS',     prev:'cosmos',         next:'elements'},
    elements:     {label:'Elements',        section:'COSMOS',     prev:'horoscope',      next:'houses'},
    map:          {label:'Sovereign Map',   section:'COSMOS',     prev:'elements',       next:'graph'},
    graph:        {label:'Constellation',   section:'COSMOS',     prev:'map',            next:'oracle'},
    oracle:       {label:'Oracle',          section:'COSMOS',     prev:'graph',          next:'realm'},
    realm:        {label:'Sovereign Realm', section:'COSMOS',     prev:'oracle',         next:'chronicle'},
    chronicle:    {label:'Chronicle',       section:'HERITAGE',   prev:'realm',          next:'heritage'},
    heritage:     {label:'Heritage',        section:'HERITAGE',   prev:'chronicle',      next:'bloodline'},
    family:       {label:'Family',          section:'HERITAGE',   prev:'heritage',       next:'bloodline'},
    bloodline:    {label:'Bloodline',       section:'HERITAGE',   prev:'family',         next:'character'},
    leaderboard:  {label:'Leaderboard',     section:'RANKING',    prev:'dashboard',      next:'achievements'},
    exam:         {label:'Examination',     section:'MASTERY',    prev:'gaming',         next:'evolution'},
    'design-system':{label:'Design System', section:'ENGINEERING',prev:'ecosystem',      next:'lab'},
    sigma:        {label:'Sigma Protocol',  section:'INTEL',      prev:'analytics',      next:'nexus'},
    nexus:        {label:'Sovereign Nexus', section:'INTEL',      prev:'sigma',          next:'cipher'},
    cipher:       {label:'Sovereign Cipher',section:'INTEL',      prev:'nexus',          next:'rune'},
    rune:         {label:'Sovereign Sigil', section:'IDENTITY',   prev:'cipher',         next:'profile'},
    queue:        {label:'Queue Monitor',   section:'OPS',        prev:'ops',            next:'architect'},
    architect:    {label:'Architect',       section:'OPS',        prev:'queue',          next:'ops'},
    ops:          {label:'Operations',      section:'OPS',        prev:'architect',      next:'queue'},
    pulse:        {label:'Market Pulse',    section:'INTEL',      prev:'sigma',          next:'signal'},
    signal:       {label:'Signal Intel',   section:'INTEL',      prev:'pulse',          next:'nexus'},
    codex:        {label:'Knowledge Codex',section:'INTEL',      prev:'signal',         next:'intelligence'},
    oath:         {label:'Sovereign Oath',  section:'IDENTITY',   prev:'rune',           next:'profile'},
    tribe:        {label:'Element Tribes',  section:'COSMOS',     prev:'elements',       next:'horoscope'},
    dna:          {label:'Sovereign DNA',   section:'IDENTITY',   prev:'passport',       next:'rune'},
    missions:     {label:'Sovereign Quests',section:'MASTERY',    prev:'achievements',   next:'gaming'},
    mirror:       {label:'Inner Mirror',    section:'IDENTITY',   prev:'profile',        next:'credentials'},
    forge:        {label:'Mind Forge',      section:'MASTERY',    prev:'exam',           next:'achievements'},
    focus:        {label:'Deep Work',       section:'MASTERY',    prev:'forge',          next:'exam'},
    rituals:      {label:'Sovereign Rituals',section:'IDENTITY',  prev:'mirror',         next:'profile'},
    wealth:       {label:'Wealth Engine',   section:'FINANCE',    prev:'wallet',         next:'vault'},
    habits:       {label:'Habit Stack',     section:'MASTERY',    prev:'missions',       next:'forge'},
    targets:      {label:'OKR Targets',     section:'STRATEGY',   prev:'roadmap',        next:'ecosystem'},
    atlas:        {label:'Knowledge Atlas', section:'INTEL',      prev:'codex',          next:'intelligence'},
    meditate:     {label:'Breathwork',      section:'IDENTITY',   prev:'rituals',        next:'mirror'},
    library:      {label:'Reading Library', section:'INTEL',      prev:'atlas',          next:'codex'},
    nutrition:    {label:'Body Fuel',       section:'IDENTITY',   prev:'meditate',       next:'rituals'},
    sleep:        {label:'Sleep Engine',    section:'IDENTITY',   prev:'nutrition',      next:'meditate'},
    command:      {label:'Command Brief',   section:'STRATEGY',   prev:'targets',        next:'roadmap'},
    stoic:        {label:'Stoic Protocol',  section:'IDENTITY',   prev:'rituals',        next:'mirror'},
    body:         {label:'Body Composition',section:'IDENTITY',   prev:'sleep',          next:'nutrition'},
    journal:      {label:'Sovereign Journal',section:'IDENTITY',  prev:'mirror',         next:'rituals'},
    vision:       {label:'Sovereign Vision', section:'STRATEGY',  prev:'command',        next:'targets'},
    gratitude:    {label:'Gratitude',        section:'IDENTITY',  prev:'rituals',        next:'mirror'},
    network:      {label:'Sovereign Network',section:'INTEL',     prev:'intelligence',   next:'analytics'},
    budget:       {label:'Sovereign Budget', section:'FINANCE',   prev:'wallet',         next:'vault'},
    flashcard:    {label:'Flashcards',       section:'MASTERY',   prev:'library',        next:'forge'},
    decisions:    {label:'Decision Journal', section:'STRATEGY',  prev:'vision',         next:'command'},
    skills:       {label:'Sovereign Skills', section:'MASTERY',   prev:'forge',          next:'flashcard'},
    mood:         {label:'Sovereign Mood',   section:'WELLNESS',  prev:'gratitude',      next:'meditate'},
    time:         {label:'Sovereign Time',   section:'MASTERY',   prev:'focus',          next:'library'},
    approvals:    {label:'Approvals',        section:'GOVERNANCE',prev:'compliance',     next:'governance'},
    awards:       {label:'Awards',           section:'PROGRESSION',prev:'achievements',  next:'trophies'},
    grid:         {label:'Grid View',        section:'INTEL',     prev:'matrix',         next:'graph'},
    knowledge:    {label:'Knowledge Base',   section:'INTEL',     prev:'atlas',          next:'mindmap'},
    mindmap:      {label:'Mind Map',         section:'INTEL',     prev:'knowledge',      next:'codex'},
    payments:     {label:'Payments',         section:'FINANCE',   prev:'wallet',         next:'expenses'},
    expenses:     {label:'Sovereign Expenses',section:'FINANCE',  prev:'payments',       next:'vault'},
    principles:   {label:'Sovereign Principles',section:'IDENTITY', prev:'affirmations',   next:'mentors'},
    mentors:      {label:'Sovereign Mentors',  section:'IDENTITY',  prev:'principles',     next:'contacts'},
    contacts:     {label:'Sovereign Contacts', section:'IDENTITY',  prev:'mentors',        next:'journal'},
    affirmations: {label:'Affirmations',     section:'IDENTITY',  prev:'journal',        next:'principles'},
    breath:       {label:'Breathwork',       section:'WELLNESS',  prev:'meditate',       next:'sleep'},
    water:        {label:'Hydration',        section:'WELLNESS',  prev:'nutrition',      next:'workout'},
    workout:      {label:'Sovereign Workout',section:'WELLNESS',  prev:'water',          next:'fasting'},
    fasting:      {label:'Sovereign Fasting',section:'WELLNESS',  prev:'workout',        next:'physiology'},
    physiology:   {label:'Physiology',       section:'WELLNESS',  prev:'fasting',        next:'clarity'},
    clarity:      {label:'Morning Clarity',  section:'WELLNESS',  prev:'physiology',     next:'health'},
    vocabulary:   {label:'Sovereign Vocabulary',section:'MASTERY', prev:'reading',        next:'notes'},
    notes:        {label:'Sovereign Notes',    section:'MASTERY',  prev:'vocabulary',     next:'codex'},
    reading:      {label:'Sovereign Reading',section:'MASTERY',   prev:'library',        next:'vocabulary'},
    quotes:       {label:'Sovereign Wisdom', section:'IDENTITY',  prev:'mirror',         next:'journal'},
    weekly:       {label:'Weekly Review',    section:'STRATEGY',  prev:'command',        next:'projects'},
    projects:     {label:'Sovereign Projects',section:'STRATEGY', prev:'weekly',         next:'roadmap'},
    ascension:    {label:'Ascension',        section:'PROGRESSION',prev:'phases',        next:'matrix'},
    houses:       {label:'Astral Houses',    section:'COSMOS',    prev:'elements',       next:'map'},
    treasury:     {label:'Sovereign Treasury',section:'FINANCE',  prev:'vault',          next:'investment'},
    pantheons:    {label:'Pantheons',        section:'COSMOS',    prev:'oracle',         next:'realm'},
    services:     {label:'Platform Services',section:'STRATEGY',  prev:'ecosystem',      next:'design-system'},
    contributions:{label:'Contributions',    section:'MASTERY',   prev:'missions',       next:'achievements'},
    publications: {label:'Publications',     section:'INTEL',     prev:'library',        next:'atlas'},
    kings:        {label:'Sovereign Kings',  section:'HERITAGE',  prev:'bloodline',      next:'character'},
    notifications:{label:'Notifications',    section:'PLATFORM',  prev:'dashboard',      next:'settings'},
    identity:     {label:'Sovereign Identity',section:'IDENTITY', prev:'profile',        next:'credentials'},
  };

  var _slug = (location.pathname.replace(/^\/|\.html$/g,'')||'dashboard');
  var _meta = PAGE_META[_slug]||{label:_slug,section:'PLATFORM',prev:null,next:null};

  /* ── INJECT UNIFIED FOOTER ─────────────────────────────────────── */
  function injectFooter(){
    var main = document.querySelector('.main,main,.page-shell');
    if(!main || document.getElementById('omega-unified-footer')) return;
    /* Only inject if page lacks .lf footer */
    if(main.querySelector('.lf')) return;
    var footer = document.createElement('div');
    footer.id = 'omega-unified-footer';
    footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px var(--pad,20px);border-top:1px solid rgba(201,168,76,.15);flex-wrap:wrap;margin-top:auto';
    footer.innerHTML = '<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:7.5px;letter-spacing:1.5px;color:rgba(138,134,118,.5)">'
      +'&#937; '+(_meta.label||_slug).toUpperCase()+' &middot; SYD OMEGA 91717'
      +'</span>'
      +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:7.5px;letter-spacing:1.5px;color:rgba(138,134,118,.5)">'
      +'AUTH=sqrt(A&#179;+B&#179;+C&#179;)&times;&phi;/e &middot; APEX=27.8367'
      +'</span>';
    main.appendChild(footer);
  }

  /* ── COPYRIGHT NOTICE ─────────────────────────────────────────────
     Appended into whichever footer the page ends up with (its own
     .lf, or the unified one injectFooter() just built) so every page
     carries a copyright line without editing ~250 files individually.
     Runs after injectFooter() so the unified footer exists if needed.
     A handful of pages (terms, privacy, reset, pending) use a bare
     .wrap layout with no .main/.lf at all -- those get a small fixed
     corner badge instead, since these are exactly the pages where the
     notice matters most (public, unauthenticated, legally load-bearing)
     and silently finding nowhere to attach would defeat the point.
     Year is computed at render time so it never goes stale. */
  function injectCopyright(){
    if(document.getElementById('omega-copyright')) return;
    var text = '© '+new Date().getFullYear()+' SYD OMEGA 91717. All rights reserved.';
    var footer = document.querySelector('.main .lf, main .lf, .page-shell .lf, #omega-unified-footer');
    if(footer){
      var c = document.createElement('span');
      c.id = 'omega-copyright';
      c.style.cssText = 'font-family:var(--M,\'Courier Prime\',monospace);font-size:7.5px;letter-spacing:1.5px;color:rgba(138,134,118,.5)';
      c.textContent = text;
      footer.appendChild(c);
      return;
    }
    var badge = document.createElement('div');
    badge.id = 'omega-copyright';
    badge.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:40;text-align:center;padding:6px 10px;font-family:var(--M,\'Courier Prime\',monospace);font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.45);background:rgba(2,2,6,.7);pointer-events:none';
    badge.textContent = text;
    document.body.appendChild(badge);
  }

  /* ── QUICK PREV/NEXT NAV ──────────────────────────────────────── */
  function injectPrevNext(){
    if(!_meta.prev&&!_meta.next) return;
    if(document.getElementById('omega-prev-next')) return;
    var topbar = document.querySelector('.topbar');
    if(!topbar) return;
    var nav = document.createElement('div');
    nav.id = 'omega-prev-next';
    nav.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0';
    nav.setAttribute('aria-label','Page navigation');
    if(_meta.prev){
      var prev = document.createElement('button');
      prev.style.cssText = 'font-family:var(--M,"Courier Prime",monospace);font-size:8px;letter-spacing:1px;padding:5px 10px;border:1px solid rgba(201,168,76,.15);color:rgba(138,134,118,.6);background:none;border-radius:2px;cursor:pointer;transition:.12s';
      prev.textContent = '\u2190';
      prev.title = 'Previous: '+(_meta.prev.charAt(0).toUpperCase()+_meta.prev.slice(1));
      prev.setAttribute('aria-label','Previous page');
      prev.addEventListener('click',function(){location.href='/'+_meta.prev+'.html';});
      prev.addEventListener('mouseenter',function(){prev.style.color='var(--gold,#C9A84C)';prev.style.borderColor='rgba(201,168,76,.3)';});
      prev.addEventListener('mouseleave',function(){prev.style.color='rgba(138,134,118,.6)';prev.style.borderColor='rgba(201,168,76,.15)';});
      nav.appendChild(prev);
    }
    if(_meta.next){
      var next = document.createElement('button');
      next.style.cssText = 'font-family:var(--M,"Courier Prime",monospace);font-size:8px;letter-spacing:1px;padding:5px 10px;border:1px solid rgba(201,168,76,.15);color:rgba(138,134,118,.6);background:none;border-radius:2px;cursor:pointer;transition:.12s';
      next.textContent = '\u2192';
      next.title = 'Next: '+(_meta.next.charAt(0).toUpperCase()+_meta.next.slice(1));
      next.setAttribute('aria-label','Next page');
      next.addEventListener('click',function(){location.href='/'+_meta.next+'.html';});
      next.addEventListener('mouseenter',function(){next.style.color='var(--gold,#C9A84C)';next.style.borderColor='rgba(201,168,76,.3)';});
      next.addEventListener('mouseleave',function(){next.style.color='rgba(138,134,118,.6)';next.style.borderColor='rgba(201,168,76,.15)';});
      nav.appendChild(next);
    }
    topbar.appendChild(nav);
  }

  /* ── BACK TO DASHBOARD SHORTCUT ───────────────────────────────── */
  function injectDashLink(){
    if(_slug==='dashboard'||document.getElementById('omega-dash-link')) return;
    var topbar=document.querySelector('.topbar');if(!topbar) return;
    var btn=document.createElement('a');
    btn.id='omega-dash-link';
    btn.href='/dashboard.html';
    btn.title='Back to Command Bridge';
    btn.setAttribute('aria-label','Command Bridge');
    btn.style.cssText='font-family:var(--M,"Courier Prime",monospace);font-size:8px;letter-spacing:1.5px;padding:5px 10px;border:1px solid rgba(201,168,76,.12);color:rgba(138,134,118,.5);border-radius:2px;text-decoration:none;transition:.12s;white-space:nowrap;flex-shrink:0';
    btn.textContent='\u03A9 CMD';
    btn.addEventListener('mouseenter',function(){btn.style.color='var(--gold,#C9A84C)';btn.style.borderColor='rgba(201,168,76,.3)';});
    btn.addEventListener('mouseleave',function(){btn.style.color='rgba(138,134,118,.5)';btn.style.borderColor='rgba(201,168,76,.12)';});
    topbar.appendChild(btn);
  }

  /* ── KEYBOARD SHORTCUTS ───────────────────────────────────────── */
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    if(e.altKey&&e.key==='ArrowLeft'&&_meta.prev) location.href='/'+_meta.prev+'.html';
    if(e.altKey&&e.key==='ArrowRight'&&_meta.next) location.href='/'+_meta.next+'.html';
    if(e.altKey&&e.key==='Home') location.href='/dashboard.html';
  });

  /* ── RESPONSIVE OVERFLOW FIX ──────────────────────────────────── */
  function fixOverflow(){
    /* Prevent horizontal scroll on tables and grids at mobile */
    var style=document.createElement('style');
    style.id='omega-ui-responsive';
    style.textContent=`
      @media(max-width:480px){
        .ev-head,.ev-row{grid-template-columns:1fr 60px!important}
        .inc-head,.inc-row{grid-template-columns:60px 1fr!important}
        .tbl-head,.tbl-row{grid-template-columns:1fr 80px!important}
        .two-col{grid-template-columns:1fr!important}
        .kpi-row{grid-template-columns:1fr 1fr!important}
        [style*="grid-template-columns"]{overflow-x:auto}
      }
      @media print{.side,.topbar,.layer-tabs,.lf,#omega-realtime-ticker,.omega-ticker-strip{display:none!important}.main{width:100%!important}}
      html{scroll-behavior:smooth}
      :focus-visible{outline:1px solid rgba(201,168,76,.5)!important;outline-offset:2px!important}
      /* Touch-size floor for the shared topbar controls this file injects.
         Measured at 375px they came out 21px tall -- under the 24px WCAG
         2.5.8 floor -- on every page that has a .topbar, since they are
         built with inline styles and no page can restyle them. min-height
         and min-width are not among the properties set inline, so a
         stylesheet rule still reaches them; nothing here overrides a
         declaration the element already carries. */
      @media(max-width:760px){
        #omega-prev-next button,#omega-prev-next a,#omega-dash-link{
          min-height:26px;min-width:26px;
          display:inline-flex;align-items:center;justify-content:center
        }
      }
    `;
    if(!document.getElementById('omega-ui-responsive')) document.head.appendChild(style);
  }

  /* ── SEARCH ENHANCER — add all page titles ─────────────────────── */
  function enhanceSearch(){
    if(!window.OmegaSearch||!window.OmegaSearch.addItems) return;
    var extraItems=Object.entries(PAGE_META).map(function(e){
      var slug=e[0],m=e[1];
      return {t:m.label.toUpperCase()+' '+m.section,d:'Navigate to '+m.label+' — '+m.section+' section',u:'/'+slug+'.html',c:'PAGE'};
    });
    window.OmegaSearch.addItems(extraItems);
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  fixOverflow();
  function run(){
    injectFooter();
    injectCopyright();
    injectPrevNext();
    injectDashLink();
    setTimeout(enhanceSearch,1000);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',run);
  } else { run(); }
  document.addEventListener('omega:populated',run);

  window.OmegaUI={meta:_meta,slug:_slug,PAGE_META:PAGE_META};
})();
