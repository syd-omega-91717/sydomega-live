/* Ω SYD OMEGA 91717 — World Realtime Presence
   Ephemeral Supabase Realtime Presence channel. It does not broaden the
   member_presence table's self-only RLS policy and never treats presence as
   identity, authorization, achievement or business state. */
import { createClient } from '/vendor/supabase-js.js';

const URL='https://ydqhzvvoyufiiqvzcjns.supabase.co';
const KEY='sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';
const sb=window.__omegaSb || (window.__omegaSb=createClient(URL,KEY));
const countEl=document.getElementById('ow-presence-count');
const statusEl=document.getElementById('ow-presence-status');
const setStatus=(state,note)=>{if(statusEl){statusEl.textContent=state;statusEl.dataset.state=state;statusEl.title=note||state;}};

function render(channel){
  const presence=channel.presenceState();
  const count=Object.keys(presence||{}).length;
  if(countEl) countEl.textContent=String(count);
  setStatus('LIVE','Ephemeral Realtime Presence channel; '+count+' connected World session'+(count===1?'':'s'));
}
async function boot(){
  const session=(await sb.auth.getSession()).data.session;
  if(!session){setStatus('UNAVAILABLE','Sign in for live World presence.');return;}
  const channel=sb.channel('omega-world-presence',{
    config:{presence:{key:session.user.id}}
  });
  channel.on('presence',{event:'sync'},()=>render(channel));
  channel.on('presence',{event:'join'},()=>render(channel));
  channel.on('presence',{event:'leave'},()=>render(channel));
  channel.subscribe(async status=>{
    if(status==='SUBSCRIBED'){
      await channel.track({
        page:location.pathname,
        seen_at:new Date().toISOString(),
        mode:'world'
      });
      render(channel);
      return;
    }
    if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
      setStatus('UNAVAILABLE','Realtime Presence channel is unavailable.');
    }
  });
  document.addEventListener('visibilitychange',async()=>{
    if(document.hidden){
      try{await channel.untrack();}catch(e){}
      return;
    }
    try{
      await channel.track({page:location.pathname,seen_at:new Date().toISOString(),mode:'world'});
      render(channel);
    }catch(e){setStatus('UNAVAILABLE','Presence reactivation failed.');}
  });
  window.OmegaWorldRealtime={channel,refresh:()=>render(channel)};
}
boot().catch(()=>setStatus('UNAVAILABLE','Realtime Presence initialization failed.'));
