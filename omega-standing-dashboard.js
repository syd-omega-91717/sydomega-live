// Standing system tier gates
const TIERS = [
  {num:1,name:'INITIATE',gate:2.32,element:'Fire',color:'#F97316'},
  {num:2,name:'NOVICE',gate:3.85,element:'Water',color:'#06B6D4'},
  {num:3,name:'ADEPT',gate:5.92,element:'Sand',color:'#ECAA59'},
  {num:4,name:'INITIATE PROFICIENT',gate:8.11,element:'Wind',color:'#8B5CF6'},
  {num:5,name:'MASTER',gate:10.83,element:'Fire',color:'#F97316'},
  {num:6,name:'GRANDMASTER',gate:13.58,element:'Water',color:'#06B6D4'},
  {num:7,name:'SAGE',gate:15.98,element:'Sand',color:'#ECAA59'},
  {num:8,name:'ELDER',gate:18.76,element:'Wind',color:'#8B5CF6'},
  {num:9,name:'ORACLE',gate:21.28,element:'Fire',color:'#F97316'},
  {num:10,name:'SOVEREIGN',gate:24.31,element:'Water',color:'#06B6D4'},
  {num:11,name:'ASCENDANT',gate:26.42,element:'Sand',color:'#ECAA59'},
  {num:12,name:'APEX',gate:27.84,element:'Wind',color:'#8B5CF6'}
];

function computeAuthScore(a,b,c){
  const phi=1.618033988749895;
  const e=2.718281828459045;
  const asq=a*a*a,bsq=b*b*b,csq=c*c*c;
  return Math.sqrt(asq+bsq+csq)*(phi/e);
}

function getTierForScore(score){
  for(let i=TIERS.length-1;i>=0;i--){
    if(score>=TIERS[i].gate){
      return TIERS[i];
    }
  }
  return TIERS[0];
}

function getNextTier(currentTier){
  const idx=TIERS.findIndex(t=>t.num===currentTier.num);
  return idx<TIERS.length-1?TIERS[idx+1]:TIERS[TIERS.length-1];
}

function renderUI(){
  const profile=window.__omegaProfile||{};
  const a=parseFloat(profile.knowledge_axis||0);
  const b=parseFloat(profile.mastery_axis||0);
  const c=parseFloat(profile.contribution_axis||0);
  const score=computeAuthScore(a,b,c);
  const tier=getTierForScore(score);
  const nextTier=getNextTier(tier);
  const progressPct=tier.num===12?100:Math.min(100,((score-tier.gate)/(nextTier.gate-tier.gate))*100);

  document.getElementById('auth-score').textContent=score.toFixed(2);
  document.getElementById('tier-name').textContent=tier.name;
  document.getElementById('status-tier').textContent=`${tier.num} · ${tier.name}`;
  document.getElementById('status-element').textContent=tier.element;
  document.getElementById('status-sign').textContent=profile.sign||'—';
  document.getElementById('status-persona').textContent=profile.agent||'—';

  document.getElementById('kpi-knowledge').textContent=Math.round(a);
  document.getElementById('kpi-mastery').textContent=Math.round(b);
  document.getElementById('kpi-contribution').textContent=Math.round(c);

  document.getElementById('score-numeric').textContent=score.toFixed(2);
  document.getElementById('score-tier-num').textContent=tier.num;
  document.getElementById('score-tier-name').textContent=tier.name;
  document.getElementById('progress-to-next').style.width=progressPct+'%';
  document.getElementById('progress-to-next').style.backgroundColor=tier.color;

  let gatesHTML='';
  const nextThree=[tier,nextTier];
  if(nextTier.num<12){
    nextThree.push(TIERS[nextTier.num]);
  }
  nextThree.forEach(t=>{
    const isPast=score>=t.gate;
    gatesHTML+=`<div class="omega-depth-card" style="--tier-accent:${t.color}">
    <div class="tier-number">${t.num}</div>
    <div class="tier-info">
    <div class="tier-name">${t.name}</div>
    <div class="tier-progress">${isPast?'UNLOCKED':'Required: '+t.gate.toFixed(2)}</div>
    </div>
    <div style="font-family:var(--M);font-size:12px;color:rgba(138,134,118,.5);">${t.element}</div>
    </div>`;
  });
  document.getElementById('tier-gates').innerHTML=gatesHTML;
}

renderUI();
window.addEventListener('storage',renderUI);
