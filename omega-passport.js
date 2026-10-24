/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN PASSPORT GENERATOR (omega-passport.js)
   jsPDF (MIT), self-hosted at /vendor/jspdf.umd.min.js — generates a
   formatted sovereign passport PDF.
   Any element with [data-passport-download] triggers a download.
   Reads profile data from window.__omegaProfile.
   ========================================================================== */
(function(){
'use strict';

var GATE_NAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX SOVEREIGN'];
var GATE_THRESH=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.517,27.8367];
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

/* Load the vendored jsPDF and resolve its global.

   jsPDF's UMD wrapper is `(t=t||self).jspdf={}`, so the global is the
   NAMESPACE `jspdf` and the constructor is `window.jspdf.jsPDF`. */
function loadJsPDF(){
  return new Promise(function(resolve,reject){
    if(window.jspdf&&window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
    var s=document.createElement('script');
    s.src='/vendor/jspdf.umd.min.js';s.async=true;
    s.onload=function(){
      (window.jspdf&&window.jspdf.jsPDF)
        ? resolve(window.jspdf.jsPDF)
        : reject(new Error('jspdf.jsPDF undefined after load'));
    };
    s.onerror=function(){ reject(new Error('failed to load /vendor/jspdf.umd.min.js')); };
    document.head.appendChild(s);
  });
}

/* Tell the member when it did not work.

   This used to read `import('<cdn>/jspdf@2.5.2')` and swallow the rejection
   with a bare console.warn -- so a member on profile.html clicked DOWNLOAD
   PASSPORT and absolutely nothing happened: no file, no message, no way to
   tell a slow network from a broken build. That is CLAUDE.md 8.1 class 1
   wearing a different hat (the UI says nothing while the action does
   nothing), and the library was unreachable from the platform CSP anyway. */
function passportError(btn, msg){
  if(btn){
    var prev=btn.getAttribute('data-passport-label')||btn.textContent;
    btn.setAttribute('data-passport-label',prev);
    btn.textContent='PASSPORT UNAVAILABLE — '+msg;
    btn.disabled=false;
    setTimeout(function(){ btn.textContent=prev; },6000);
  }
  console.warn('[OmegaPassport] '+msg);
}

function generate(btn){
  var pr=window.__omegaProfile||{};
  var user=window.__omegaUser||{};
  loadJsPDF().then(function(jsPDF){
    var pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a6'});
    drawPassport(pdf,pr,user);
    pdf.save('sovereign-passport-'+Date.now()+'.pdf');
  })['catch'](function(e){
    passportError(btn, (e&&e.message)||'could not load the PDF engine');
  });
}

window.OmegaPassport={generate:generate};

/* ── Certificate PDF ─────────────────────────────────────────────────────────
   One A5 landscape page per certificate the member actually holds. The row
   comes from public.certificates (self-or-owner RLS), published by
   profile.html as window.__omegaCertificates; nothing here invents a
   certificate. The page says what it is: a SYD OMEGA membership record, not
   an accredited qualification. */
function certTitle(row){
  return String(row.cert_name||row.title||('Certificate '+(row.cert_num||''))).trim();
}
function drawCertificate(pdf, row, pr, user){
  var W=210,H=148;
  var name=(pr&&pr.display_name)||(user&&user.email?user.email.split('@')[0]:'Member');
  var title=certTitle(row);
  var issued=row.issued_at?String(row.issued_at).slice(0,10):'date not recorded';
  pdf.setFillColor(10,10,15);pdf.rect(0,0,W,H,'F');
  pdf.setDrawColor(201,168,76);pdf.setLineWidth(0.8);pdf.rect(8,8,W-16,H-16);
  pdf.setLineWidth(0.25);pdf.rect(11,11,W-22,H-22);
  pdf.setTextColor(201,168,76);pdf.setFont('helvetica','bold');pdf.setFontSize(9);
  pdf.text('SYD OMEGA 91717',W/2,24,{align:'center'});
  pdf.setFontSize(22);pdf.text('CERTIFICATE',W/2,40,{align:'center'});
  pdf.setTextColor(226,200,109);pdf.setFont('helvetica','normal');pdf.setFontSize(11);
  pdf.text('This records that',W/2,56,{align:'center'});
  pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(18);
  pdf.text(String(name).toUpperCase().slice(0,40),W/2,70,{align:'center'});
  pdf.setTextColor(226,200,109);pdf.setFont('helvetica','normal');pdf.setFontSize(11);
  pdf.text('holds the certificate',W/2,82,{align:'center'});
  pdf.setTextColor(201,168,76);pdf.setFont('helvetica','bold');pdf.setFontSize(16);
  pdf.text(title.toUpperCase().slice(0,48),W/2,95,{align:'center'});
  pdf.setTextColor(180,175,160);pdf.setFont('helvetica','normal');pdf.setFontSize(9);
  var meta='No. '+(row.cert_num!=null?row.cert_num:'-')+(row.grade?'   Grade '+row.grade:'')+'   Issued '+issued;
  pdf.text(meta,W/2,110,{align:'center'});
  pdf.setFontSize(7);pdf.setTextColor(138,134,118);
  pdf.text('A SYD OMEGA 91717 membership record. Not an accredited or third-party-verified qualification.',W/2,128,{align:'center'});
}
function generateCertificate(btn, row){
  var pr=window.__omegaProfile||{};
  var user=window.__omegaUser||{};
  loadJsPDF().then(function(jsPDF){
    var pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a5'});
    drawCertificate(pdf,row,pr,user);
    var slug=certTitle(row).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'certificate';
    pdf.save('omega-certificate-'+(row.cert_num!=null?row.cert_num+'-':'')+slug+'.pdf');
  })['catch'](function(e){
    passportError(btn, (e&&e.message)||'could not load the PDF engine');
  });
}
window.OmegaPassport.generateCertificate=generateCertificate;

document.addEventListener('click',function(e){
  var btn=e.target.closest('[data-certificate-download]');
  if(!btn) return;
  var i=parseInt(btn.getAttribute('data-certificate-download'),10);
  var rows=window.__omegaCertificates||[];
  if(!(i>=0&&i<rows.length)){ passportError(btn,'certificate not found'); return; }
  generateCertificate(btn, rows[i]);
});

document.addEventListener('click',function(e){
  var btn=e.target.closest('[data-passport-download]');
  if(btn) generate(btn);
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
