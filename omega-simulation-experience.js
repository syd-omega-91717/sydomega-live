/* Ω SYD OMEGA 91717 — SIMULATION EXPERIENCE LAYER
 * One additive layer for simulation surfaces.
 * No fake backend state. Existing simulation logic remains authoritative.
 */
(function(){
  'use strict';
  if(window.__omegaSimulationExperience)return;
  window.__omegaSimulationExperience=true;

  function reduced(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
  function city(){
    var canvas=document.getElementById('city-canvas');
    if(!canvas)return;
    var wrap=canvas.closest('.city-canvas-wrap');
    var state=document.getElementById('city-state');
    var play=document.getElementById('city-play');
    var speed=document.getElementById('city-speed');
    var reset=document.getElementById('city-reset');

    if(play)play.title='Play or pause the city simulation';
    if(speed)speed.title='Adjust simulation speed';
    if(reset)reset.title='Reset the simulation';

    document.addEventListener('visibilitychange',function(){
      if(!document.hidden)return;
      if(play&&play.getAttribute('aria-pressed')==='true'){
        play.click();
        if(state)state.textContent='SIMULATION PAUSED — TAB HIDDEN';
      }
    },{passive:true});

    if(wrap&&window.ResizeObserver){
      var ro=new ResizeObserver(function(){
        canvas.setAttribute('aria-label','Live Ω City simulation — '+Math.round(wrap.clientWidth)+' pixels wide');
      });
      ro.observe(wrap);
    }

    if(reduced()&&play&&play.getAttribute('aria-pressed')==='true'){
      play.click();
      if(state)state.textContent='SIMULATION PAUSED — REDUCED MOTION';
    }

    var grid=document.getElementById('district-grid');
    if(!grid)return;
    var cards=grid.querySelectorAll('.district-card');
    Array.prototype.forEach.call(cards,function(card,index){
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label','Focus District '+(index+1));
      function focusDistrict(){
        Array.prototype.forEach.call(cards,function(x){x.removeAttribute('data-city-selected');});
        card.setAttribute('data-city-selected','true');
        if(state)state.textContent='DISTRICT '+(index+1)+' FOCUSED';
        var overlay=wrap&&wrap.querySelector('.city-overlay');
        if(overlay){
          var badge=overlay.querySelector('.city-focus');
          if(!badge){
            badge=document.createElement('div');
            badge.className='city-stat city-focus';
            overlay.appendChild(badge);
          }
          badge.innerHTML='FOCUS: <b>DISTRICT '+(index+1)+'</b>';
        }
      }
      card.addEventListener('click',focusDistrict);
      card.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();focusDistrict();}
      });
    });

    if(!document.getElementById('omega-simulation-experience-style')){
      var s=document.createElement('style');s.id='omega-simulation-experience-style';
      s.textContent='.district-card[data-city-selected="true"]{outline:1px solid var(--cyan,#00e5ff);box-shadow:0 0 18px rgba(0,229,255,.12);transform:translateY(-2px)}@media(prefers-reduced-motion:reduce){.district-card[data-city-selected="true"]{transform:none}}';
      document.head.appendChild(s);
    }
  }

  function boot(){city();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  setTimeout(boot,900);
  window.OmegaSimulationExperience={boot:boot,version:'1.0.0'};
})();