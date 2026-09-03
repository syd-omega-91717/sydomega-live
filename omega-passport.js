/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN PASSPORT GENERATOR (omega-passport.js)
   jsPDF (MIT) via esm.sh — generates a formatted sovereign passport PDF.
   Any element with [data-passport-download] triggers a download.
   Reads profile data from window.__omegaProfile.
   ========================================================================== */
(function(){
'use strict';

var GATE_NAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX SOVEREIGN'];
var GATE_THRESH=[2.32,3.98,5.95,8.29,11,13.92,17.21,20.87,24.01,25.9,27.1,27.8367];
var SIGN_ELEM={Aries:'Fire ☲',Taurus:'Metal ☳',Gemini:'Wind ☱',Cancer:'Water ☰',Leo:'Fire ☲',Virgo:'Sand ★',Libra:'Wind ☱',Scorpio:'Water ☰',Sagittarius:'Fire ☲',Capricorn:'Metal ☳',Aquarius:'Wind ☱',Pisces:'Water ☰'};
var SIGN_GOD={Aries:'Ares',Taurus:'Aphrodite',Gemini:'Hermes',Cancer:'Artemis',Leo:'Apollo',Virgo:'Athena',Libra:'Hera',Scorpio:'Demeter',Sagittarius:'Zeus',Capricorn:'Hestia',Aquarius:'Hephaestus',Pisces:'Poseidon'};

function getGate(auth){
  var gate=0;
  GATE_THRESH.forEach(function(t,i){if(auth>=t) gate=i;});
  return {num:gate+1,name:GATE_NAMES[gate]};
}

function drawPassport(pdf, pr, user){
  var PHI=1.6180339887,EU=2.7182818285;
  var a=Number(pr.is_owner?9:pr.axis_a||0.001);
  var b=Number(pr.is_owner?9:pr.axis_b||0.001);
  var c=Number(pr.is_owner?9:pr.axis_c||0.001);
  var auth=pr.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
  var gate=getGate(auth);
  var sign=pr.sign||'—';
  var elem=SIGN_ELEM[sign]||'—';
  var god=SIGN_GOD[sign]||'—';
  var name=pr.display_name||(user&&user.email?user.email.split('@')[0]:'Sovereign');
  var issued=new Date().toISOString().split('T')[0];

  var W=105,H=148; /* A6 size in mm */
  pdf.internal.scaleFactor=pdf.internal.scaleFactor||3.7795275591;

  /* ── Background — near-black */
  pdf.setFillColor(10,10,15);
  pdf.rect(0,0,W,H,'F');

  /* ── Gold border frame */
  pdf.setDrawColor(201,168,76);
  pdf.setLineWidth(0.8);
  pdf.rect(4,4,W-8,H-8,'S');
  pdf.setLineWidth(0.3);
  pdf.rect(5.5,5.5,W-11,H-11,'S');

  /* ── Header band */
  pdf.setFillColor(25,20,5);
  pdf.rect(4,4,W-8,16,'F');

  /* ── Title */
  pdf.setTextColor(201,168,76);
  pdf.setFontSize(7);
  pdf.setFont('helvetica','bold');
  pdf.text('SYD OMEGA 91717',W/2,10.5,{align:'center'});
  pdf.setFontSize(5);
  pdf.setFont('helvetica','normal');
  pdf.setTextColor(138,134,118);
  pdf.text('SOVEREIGN PASSPORT · CERTIFIED AUTHORITY DOCUMENT',W/2,14,{align:'center'});

  /* ── Omega symbol */
  pdf.setFontSize(22);
  pdf.setTextColor(201,168,76);
  pdf.text('Ω',W/2,27,{align:'center'});

  /* ── Auth score ring placeholder — drawn as circle */
  pdf.setDrawColor(201,168,76);
  pdf.setLineWidth(1.2);
  pdf.circle(W/2,38,7,'S');
  pdf.setFontSize(8);
  pdf.setTextColor(226,200,109);
  pdf.setFont('helvetica','bold');
  pdf.text(auth.toFixed(2),W/2,40,{align:'center'});
  pdf.setFontSize(4.5);
  pdf.setTextColor(138,134,118);
  pdf.setFont('helvetica','normal');
  pdf.text('AUTH SCORE',W/2,43.5,{align:'center'});

  /* ── Gate badge */
  pdf.setFillColor(40,30,5);
  pdf.roundedRect(W/2-18,47,36,8,1,1,'F');
  pdf.setDrawColor(201,168,76);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(W/2-18,47,36,8,1,1,'S');
  pdf.setFontSize(5.5);
  pdf.setTextColor(226,200,109);
  pdf.setFont('helvetica','bold');
  pdf.text('GATE '+gate.num+' · '+gate.name,W/2,52,{align:'center'});

  /* ── Divider */
  pdf.setDrawColor(201,168,76);
  pdf.setLineWidth(0.2);
  pdf.line(12,58,W-12,58);

  /* ── Identity fields */
  var fields=[
    ['SOVEREIGN NAME',name],
    ['SIGN',sign],
    ['ELEMENT',elem],
    ['OLYMPIAN PATRON',god],
    ['AXIS A · KNOWLEDGE',a.toFixed(3)],
    ['AXIS B · MASTERY',b.toFixed(3)],
    ['AXIS C · CONTRIBUTION',c.toFixed(3)],
    ['FORMULA','AUTH = √(A³+B³+C³)×φ/e'],
    ['APEX AUTH','27.8367'],
    ['DATE ISSUED',issued],
    ['PASSPORT REF','OMG-'+Date.now().toString(36).toUpperCase()]
  ];

  var yPos=63;
  fields.forEach(function(f){
    pdf.setFontSize(4);
    pdf.setTextColor(138,134,118);
    pdf.setFont('helvetica','normal');
    pdf.text(f[0],12,yPos);
    pdf.setFontSize(5.5);
    pdf.setTextColor(233,230,220);
    pdf.setFont('helvetica','bold');
    pdf.text(String(f[1]),12,yPos+4);
    yPos+=9;
  });

  /* ── Machine-readable zone */
  pdf.setFillColor(18,14,3);
  pdf.rect(4,H-22,W-8,18,'F');
  pdf.setFontSize(4.2);
  pdf.setTextColor(138,134,118);
  pdf.setFont('courier','normal');
  var mrz1='P<OMG'+name.toUpperCase().replace(/[^A-Z]/g,'<').padEnd(24,'<');
  var mrz2=('OMG'+auth.toFixed(4).replace('.','')+'<<'+sign.toUpperCase().padEnd(12,'<')).substring(0,30);
  pdf.text(mrz1.substring(0,36),W/2,H-16,{align:'center'});
  pdf.text(mrz2.substring(0,36),W/2,H-11,{align:'center'});
  pdf.text('SOVEREIGN PASSPORT · SYD OMEGA 91717 · AUTH=√(A³+B³+C³)×φ/e',W/2,H-7,{align:'center'});
}

function generate(){
  var pr=window.__omegaProfile||{};
  var user=window.__omegaUser||{};
  import('https://esm.sh/jspdf@2.5.2').then(function(mod){
    var jsPDF=mod.jsPDF||mod.default;
    var pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a6'});
    drawPassport(pdf,pr,user);
    pdf.save('sovereign-passport-'+Date.now()+'.pdf');
  }).catch(function(e){console.warn('[OmegaPassport] jsPDF load failed',e);});
}

window.OmegaPassport={generate:generate};

document.addEventListener('click',function(e){
  if(e.target.closest('[data-passport-download]')) generate();
});

/* Inject download button into character.html automatically */
window.addEventListener('omega:user-loaded',function(){
  if(!document.getElementById('char-my-name')&&!document.querySelector('[data-identity-card]')) return;
  if(document.querySelector('[data-passport-download]')) return;
  var btn=document.createElement('button');
  btn.setAttribute('data-passport-download','1');
  btn.setAttribute('aria-label','Download Sovereign Passport PDF');
  btn.textContent='↓ DOWNLOAD SOVEREIGN PASSPORT';
  btn.style.cssText='font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:2px;padding:10px 18px;border:1px solid var(--solar,#E2C86D);color:var(--solar,#E2C86D);background:rgba(201,168,76,.05);cursor:pointer;border-radius:2px;display:block;margin:16px auto;transition:.18s;';
  btn.addEventListener('mouseenter',function(){this.style.background='rgba(201,168,76,.15)';});
  btn.addEventListener('mouseleave',function(){this.style.background='rgba(201,168,76,.05)';});
  var target=document.querySelector('.pad')||document.querySelector('main');
  if(target) target.appendChild(btn);
});

})();
