/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN NOTIFICATION ENGINE
   Polls for new notifications. Displays badge + toast + notification centre.
   Inspired by Discord notification batching + iOS notification grouping.
   ========================================================================== */
(function(){
  if(window.__omegaNotifyActive) return;
  window.__omegaNotifyActive=true;

  var _count=0;
  var _notifPanel=null;

  /* No direct INSERT grant exists on public.notifications today -- only the
     five owner-gated SECURITY DEFINER trigger functions in
     omega_notify_triggers.sql write rows, and every message they insert is a
     static literal. So message/content aren't attacker-controlled yet, same
     as omega-live.js's activity_feed ticker before it was fixed. Escaped
     defensively for the same reason: this widget is loaded by bg.js on
     every page, and a future write path (a member-triggered event, a richer
     notification body) would otherwise re-open the same stored-XSS shape
     already fixed elsewhere (approvals.html, sovereigns.html, graph.html). */
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ── BADGE (injected into side nav) ─────────────────────────── */
  function updateBadge(n){
    var badge=document.getElementById('omega-notif-badge');
    if(!badge){
      badge=document.createElement('div');
      badge.id='omega-notif-badge';
      badge.style.cssText='position:fixed;top:16px;right:16px;z-index:500;background:var(--crim,#C4453C);color:#fff;font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;font-weight:bold;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(139,0,0,.5)';
      badge.setAttribute('role','status');badge.setAttribute('aria-label','Notifications');
      badge.addEventListener('click',togglePanel);
      document.body.appendChild(badge);
    }
    badge.textContent=n>99?'99+':n;
    badge.style.display=n>0?'flex':'none';
  }

  /* ── TOAST ───────────────────────────────────────────────────── */
  function showToast(msg,type){
    var col={info:'var(--cyan,#00E5FF)',success:'var(--green,#3fb27f)',warning:'var(--solar,#E2C86D)',error:'var(--crim,#C4453C)'}[type||'info'];
    var t=document.createElement('div');
    t.setAttribute('role','alert');t.setAttribute('aria-live','polite');
    t.style.cssText='position:fixed;bottom:100px;right:16px;z-index:5000;min-width:240px;max-width:320px;background:#0A0A0F;border:1px solid '+col.replace('var','').replace(/[()]/g,'')+'33;border-left:3px solid '+col+';border-radius:2px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.5);animation:slideIn .25s ease';
    if(!document.getElementById('notif-kf')){var kf=document.createElement('style');kf.id='notif-kf';kf.textContent='@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}';document.head.appendChild(kf);}
    t.innerHTML='<div style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:2px;color:'+col+';margin-bottom:4px">\u03A9 NOTIFICATION</div>'
      +'<div style="font-size:12px;color:#e9e6dc;line-height:1.5">'+msg+'</div>';
    document.body.appendChild(t);
    setTimeout(function(){if(t.parentNode)document.body.removeChild(t);},4500);
  }

  /* ── NOTIFICATION PANEL ──────────────────────────────────────── */
  function buildPanel(notifs){
    var p=document.createElement('div');
    p.id='omega-notif-panel';
    p.setAttribute('role','dialog');p.setAttribute('aria-label','Notifications');
    p.style.cssText='position:fixed;top:50px;right:16px;z-index:4999;width:min(360px,90vw);background:#0A0A0F;border:1px solid rgba(201,168,76,.25);border-radius:4px;box-shadow:0 16px 48px rgba(0,0,0,.6);overflow:hidden';
    p.innerHTML='<div style="padding:12px 16px;border-bottom:1px solid rgba(201,168,76,.12);display:flex;align-items:center;justify-content:space-between">'
      +'<span style="font-family:var(--D,\'Cinzel Decorative\',serif);font-size:12px;color:var(--gold,#C9A84C)">\u03A9 NOTIFICATIONS</span>'
      +'<button onclick="document.getElementById(\'omega-notif-panel\').remove()" style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;color:rgba(138,134,118,.5);background:none;border:none;cursor:pointer" aria-label="Close notifications">\u00d7 CLOSE</button>'
    +'</div>'
    +'<div style="max-height:50vh;overflow-y:auto">'
    +(!notifs.length?'<div style="padding:20px;text-align:center;font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;color:rgba(138,134,118,.4)">NO NOTIFICATIONS</div>'
    :notifs.map(function(n){
      var col={gate_unlock:'var(--gold,#C9A84C)',access_granted:'var(--green,#3fb27f)',trial_start:'var(--cyan,#00E5FF)',task_complete:'var(--purple,#9B6BF0)',system:'var(--muted,#8a8676)'}[n.notification_type]||'var(--gold,#C9A84C)';
      var ts=new Date(n.created_at||Date.now()).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).toUpperCase();
      return '<div style="padding:12px 16px;border-bottom:1px solid rgba(201,168,76,.05);'+(n.read_at?'opacity:.55':'')+'transition:.12s" onmouseenter="this.style.background=\'rgba(201,168,76,.03)\'" onmouseleave="this.style.background=\'\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
          +(n.read_at?'':'<span style="width:6px;height:6px;border-radius:50%;background:'+col+';flex-shrink:0"></span>')
          +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:1.5px;color:'+col+'">'+esc(String(n.notification_type||'').toUpperCase().replace(/_/g,' '))+'</span>'
          +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;color:rgba(138,134,118,.5);margin-left:auto">'+esc(ts)+'</span>'
        +'</div>'
        +'<div style="font-size:12px;line-height:1.6;color:#e9e6dc">'+esc(String(n.message||n.content||'').slice(0,120))+'</div>'
        +'</div>';
    }).join(''))
    +'</div>'
    +'<div style="padding:10px 16px;border-top:1px solid rgba(201,168,76,.08);text-align:center">'
      +'<a href="/notifications.html" style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:2px;color:var(--cyan,#00E5FF);text-decoration:none">VIEW ALL NOTIFICATIONS \u2192</a>'
    +'</div>';
    return p;
  }

  function togglePanel(){
    var existing=document.getElementById('omega-notif-panel');
    if(existing){existing.remove();return;}
    if(!window.__omegaSb){return;}
    window.__omegaSb.auth.getSession().then(function(r){
      var s=r.data&&r.data.session;if(!s)return;
      return window.__omegaSb.from('notifications').select('*').eq('user_id',s.user.id).order('created_at',{ascending:false}).limit(20);
    }).then(function(r){
      if(!r)return;
      var notifs=r.data||[];
      var panel=buildPanel(notifs);
      document.body.appendChild(panel);
      /* Mark as read */
      if(notifs.some(function(n){return!n.read_at;})){
        window.__omegaSb.auth.getSession().then(function(r2){
          var s=r2.data&&r2.data.session;if(!s)return;
          window.__omegaSb.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',s.user.id).is('read_at',null).then(function(){updateBadge(0);_count=0;});
        });
      }
    }).catch(function(){});
    /* Close on outside click */
    setTimeout(function(){
      document.addEventListener('click',function handler(e){
        var panel=document.getElementById('omega-notif-panel');
        var badge=document.getElementById('omega-notif-badge');
        if(panel&&!panel.contains(e.target)&&e.target!==badge){panel.remove();document.removeEventListener('click',handler);}
      });
    },100);
  }

  /* ── POLL for unread count ──────────────────────────────────── */
  function poll(){
    if(!window.__omegaSb)return;
    window.__omegaSb.auth.getSession().then(function(r){
      var s=r.data&&r.data.session;if(!s)return;
      return window.__omegaSb.from('notifications').select('id',{count:'exact'}).eq('user_id',s.user.id).is('read_at',null);
    }).then(function(r){
      if(!r)return;
      var n=r.count||0;
      if(n!==_count){
        var prev=_count;
        _count=n;updateBadge(n);
        if(n>prev){showToast('You have '+n+' new notification'+(n>1?'s':''),'info');}
      }
    }).catch(function(){});
  }

  /* Start polling after user loads */
  document.addEventListener('omega:populated',function(){setTimeout(function(){poll();setInterval(poll,30000);},2000);});

  window.OmegaNotify={poll:poll,showToast:showToast,togglePanel:togglePanel};
})();
