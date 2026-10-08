/* Ω LIFE — native consolidation adapters.
   Reads existing member-owned browser stores without inventing state.
   Detailed editors remain available through their stable deep-link routes. */
(function(){
  'use strict';
  var cards=[
    {title:'HABITS',route:'/habits.html',store:'omega_habits_v2',kind:'habits'},
    {title:'GOALS & TARGETS',route:'/targets.html',store:'omega_okr_data',kind:'okr'},
    {title:'JOURNAL',route:'/journal.html',kind:'route'},
    {title:'MEDITATION',route:'/meditate.html',kind:'route'},
    {title:'WORKOUT',route:'/workout.html',kind:'route'},
    {title:'NUTRITION',route:'/nutrition.html',kind:'route'},
    {title:'SLEEP',route:'/sleep.html',kind:'route'},
    {title:'HYDRATION',route:'/water.html',kind:'route'}
  ];
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){return null;}}
  function summarize(card){
    if(card.kind==='habits'){
      var habits=read(card.store);
      if(!Array.isArray(habits)||!habits.length)return {state:'EMPTY',detail:'No browser-local habits are currently stored.'};
      return {state:'LOCAL',detail:String(habits.length)+' stored habit'+(habits.length===1?'':'s')};
    }
    if(card.kind==='okr'){
      var data=read(card.store),count=0;
      if(data&&typeof data==='object')Object.keys(data).forEach(function(q){if(Array.isArray(data[q]))count+=data[q].length;});
      return count?{state:'LOCAL',detail:String(count)+' stored objective'+(count===1?'':'s')}:{state:'EMPTY',detail:'No browser-local objectives are currently stored.'};
    }
    return {state:'ROUTE',detail:'Open the dedicated surface to view or manage this capability.'};
  }
  function mount(){
    var host=document.getElementById('omega-life-native-systems');if(!host)return;
    host.replaceChildren();
    cards.forEach(function(card){
      var s=summarize(card),article=document.createElement('article');article.className='life-system-card';
      var head=document.createElement('div');head.className='life-system-head';
      var title=document.createElement('h3');title.textContent=card.title;
      var state=document.createElement('span');state.className='life-system-state';state.textContent=s.state;
      head.append(title,state);
      var detail=document.createElement('p');detail.textContent=s.detail;
      var link=document.createElement('a');link.href=card.route;link.textContent=s.state==='ROUTE'?'OPEN SURFACE':'OPEN / EDIT';link.className='life-system-link';
      article.append(head,detail,link);host.appendChild(article);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  window.addEventListener('storage',mount);
})();