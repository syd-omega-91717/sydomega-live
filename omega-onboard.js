/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN ONBOARDING ENGINE
   Detects first-time members and presents the zodiac/element selection flow.
   Assigns: sign → element → Olympian → agent → token affinity.
   Inspired by TikTok cold-start (interest seeding) + game onboarding best practice.
   ========================================================================== */
(function(){
  if(window.__omegaOnboardActive) return;
  window.__omegaOnboardActive=true;

  var ZODIAC_MAP=[
    {sign:'Aries',el:'fire',god:'Ares',agent:'Sentinel',token:'ARENITE',dates:'Mar 21 – Apr 19',glyph:'\u2648'},
    {sign:'Taurus',el:'metal',god:'Aphrodite',agent:'Merchant',token:'TAURITE',dates:'Apr 20 – May 20',glyph:'\u2649'},
    {sign:'Gemini',el:'wind',god:'Apollo',agent:'Beacon',token:'GEMITE',dates:'May 21 – Jun 20',glyph:'\u264A'},
    {sign:'Cancer',el:'water',god:'Artemis',agent:'Warden',token:'CANITE',dates:'Jun 21 – Jul 22',glyph:'\u264B'},
    {sign:'Leo',el:'fire',god:'Zeus',agent:'Sovereign',token:'LEONITE',dates:'Jul 23 – Aug 22',glyph:'\u264C'},
    {sign:'Virgo',el:'metal',god:'Hermes',agent:'Analyst',token:'VIRGITE',dates:'Aug 23 – Sep 22',glyph:'\u264D'},
    {sign:'Libra',el:'wind',god:'Athena',agent:'Auditor',token:'LIBRITE',dates:'Sep 23 – Oct 22',glyph:'\u264E'},
    {sign:'Scorpio',el:'water',god:'Poseidon',agent:'Oracle',token:'SCORITE',dates:'Oct 23 – Nov 21',glyph:'\u264F'},
    {sign:'Sagittarius',el:'fire',god:'Ares',agent:'Scout',token:'SAGITE',dates:'Nov 22 – Dec 21',glyph:'\u2650'},
    {sign:'Capricorn',el:'metal',god:'Hephaestus',agent:'Proxy',token:'CAPRITE',dates:'Dec 22 – Jan 19',glyph:'\u2651'},
    {sign:'Aquarius',el:'wind',god:'Hera',agent:'Historian',token:'AQUITE',dates:'Jan 20 – Feb 18',glyph:'\u2652'},
    {sign:'Pisces',el:'water',god:'Dionysus',agent:'Tutor',token:'PISCITE',dates:'Feb 19 – Mar 20',glyph:'\u2653'},
  ];
  var EL_COLORS={fire:'#E25800',water:'#0088FF',wind:'#00E5FF',metal:'#8a8676',sand:'#E2C86D'};

  function needsOnboarding(pr){
    return pr&&!pr.sign&&!pr.element&&!pr.is_owner;
  }

  function buildOnboardingFlow(){
    var ov=document.createElement('div');
    ov.id='omega-onboard';
    ov.style.cssText='position:fixed;inset:0;z-index:9995;background:rgba(2,2,6,.97);display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';
    var selected=null;
    ov.innerHTML='<div style="max-width:680px;width:100%">'
      +'<div style="text-align:center;margin-bottom:24px">'
        +'<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(10px,2vw,13px);letter-spacing:4px;color:rgba(201,168,76,.5);margin-bottom:8px">SYD OMEGA 91717</div>'
        +'<div style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(20px,5vw,36px);color:#C9A84C;line-height:1;margin-bottom:8px">\u03A9 SOVEREIGN IDENTITY</div>'
        +'<div style="font-family:\'Courier Prime\',monospace;font-size:9px;letter-spacing:3px;color:rgba(138,134,118,.6)">SELECT YOUR ZODIAC SIGN TO BEGIN YOUR SOVEREIGN JOURNEY</div>'
      +'</div>'
      +'<div id="ob-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:20px">'
      +ZODIAC_MAP.map(function(z){
        var col=EL_COLORS[z.el]||'#C9A84C';
        return '<div class="ob-card" data-sign="'+z.sign+'" data-el="'+z.el+'" data-god="'+z.god+'" data-agent="'+z.agent+'" data-token="'+z.token+'"'
          +' onclick="window.__obSelect(this)"'
          +' style="border:1px solid rgba(201,168,76,.15);background:rgba(10,10,15,.55);padding:14px;border-radius:2px;cursor:pointer;text-align:center;transition:all .18s;position:relative"'
          +' onmouseenter="this.style.borderColor=\''+col+'\';this.style.background=\''+col+'11\'" onmouseleave="this.style.borderColor=this.dataset.selected?\''+col+'\':\'rgba(201,168,76,.15)\';this.style.background=this.dataset.selected?\''+col+'11\':\'rgba(10,10,15,.55)\'">'
          +'<div style="font-size:28px;margin-bottom:6px">'+z.glyph+'</div>'
          +'<div style="font-family:\'Cinzel Decorative\',serif;font-size:10px;color:#C9A84C;margin-bottom:4px">'+z.sign.toUpperCase()+'</div>'
          +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:1.5px;color:'+col+';margin-bottom:3px">'+z.el.toUpperCase()+'</div>'
          +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;color:rgba(138,134,118,.5)">'+z.dates+'</div>'
          +'</div>';
      }).join('')
      +'</div>'
      +'<div id="ob-detail" style="display:none;border:1px solid rgba(201,168,76,.25);padding:16px;border-radius:2px;background:rgba(201,168,76,.04);margin-bottom:16px;text-align:center"></div>'
      +'<div style="text-align:center">'
        +'<button id="ob-confirm" onclick="window.__obConfirm()" disabled style="font-family:\'Cinzel Decorative\',serif;font-size:11px;letter-spacing:3px;padding:14px 32px;border:1px solid rgba(201,168,76,.3);border-radius:2px;background:none;color:rgba(201,168,76,.4);cursor:not-allowed;transition:.25s">\u03A9 CONFIRM SOVEREIGN IDENTITY</button>'
      +'</div>'
    +'</div>';
    document.body.appendChild(ov);

    window.__obSelect=function(card){
      document.querySelectorAll('.ob-card').forEach(function(c){
        c.style.borderColor='rgba(201,168,76,.15)';c.style.background='rgba(10,10,15,.55)';c.dataset.selected='';
      });
      card.style.borderColor='#C9A84C';card.style.background='rgba(201,168,76,.08)';card.dataset.selected='1';
      selected=card.dataset;
      var z=ZODIAC_MAP.find(function(x){return x.sign===selected.sign;});
      var col=EL_COLORS[z.el]||'#C9A84C';
      var det=document.getElementById('ob-detail');
      if(det){
        det.style.display='block';
        det.innerHTML='<div style="font-family:\'Cinzel Decorative\',serif;font-size:13px;color:'+col+';margin-bottom:8px">'+z.glyph+' '+z.sign.toUpperCase()+'</div>'
          +'<div style="font-family:\'Courier Prime\',monospace;font-size:9px;letter-spacing:2px;color:rgba(138,134,118,.6);line-height:2">'
          +'ELEMENT: <span style="color:'+col+'">'+z.el.toUpperCase()+'</span> &nbsp;&bull;&nbsp; '
          +'OLYMPIAN: <span style="color:#C9A84C">'+z.god.toUpperCase()+'</span> &nbsp;&bull;&nbsp; '
          +'AGENT: <span style="color:#00E5FF">'+z.agent.toUpperCase()+'</span> &nbsp;&bull;&nbsp; '
          +'TOKEN: <span style="color:#9B6BF0">'+z.token+'</span>'
          +'</div>';
      }
      var btn=document.getElementById('ob-confirm');
      if(btn){btn.disabled=false;btn.style.color='#C9A84C';btn.style.borderColor='rgba(201,168,76,.6)';btn.style.cursor='pointer';}
    };

    window.__obConfirm=async function(){
      if(!selected||!window.__omegaSb) return;
      var btn=document.getElementById('ob-confirm');
      if(btn){btn.textContent='SEALING SOVEREIGN IDENTITY\u2026';btn.disabled=true;}
      try{
        var s=(await window.__omegaSb.auth.getSession()).data.session;
        if(!s)return;
        await window.__omegaSb.from('profiles').update({
          sign:selected.sign,
          element:selected.el,
          olympian:selected.god,
          agent_name:selected.agent,
          token_affinity:selected.token,
          onboarded_at:new Date().toISOString()
        }).eq('id',s.user.id);
        /* Record onboarding event */
        await window.__omegaSb.rpc('record_sovereign_event',{
          p_event_type:'member.onboarded',
          p_event_data:{sign:selected.sign,element:selected.el,token:selected.token},
          p_axis_delta:{a:0.009,b:0.009,c:0.009}
        }).catch(function(){});
        if(ov.parentNode)document.body.removeChild(ov);
        /* Show welcome */
        if(window.OmegaSDT&&window.OmegaSDT.pulse) window.OmegaSDT.pulse('a',0.009,0.001);
        if(window.OmegaNotify)window.OmegaNotify.showToast('Welcome, Sovereign '+selected.sign+'! Your path begins now.','success');
      }catch(e){if(btn){btn.textContent='\u03A9 CONFIRM SOVEREIGN IDENTITY';btn.disabled=false;}}
    };
  }

  /* Trigger when profile loads */
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(needsOnboarding(pr)){
      /* Skip onboarding pages */
      var path=location.pathname;
      if(path.includes('account')||path.includes('pending')||path.includes('reset')) return;
      buildOnboardingFlow();
    }
  });

  window.OmegaOnboard={ZODIAC_MAP:ZODIAC_MAP};
})();
