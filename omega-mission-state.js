/* OMEGA MISSION STATE BRIDGE
 * Read-only bridge from persisted task/evolution records into the mission UI.
 * It never marks a mission complete, awards XP, changes progression, or writes
 * browser/database state. Missing mission definitions remain UNAVAILABLE rather
 * than being invented.
 */
(function () {
  'use strict';
  if (window.OmegaMissionState) return;

  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function mount(state) {
    var host = document.querySelector('[data-omega-mission-state]');
    if (!host) return;
    host.textContent = '';
    host.appendChild(el('div', 'PERSISTED MISSION STATE', 'oms-title'));
    var status = el('span', state.status, 'oms-status');
    status.setAttribute('data-state', state.status);
    host.appendChild(status);

    var grid = el('div', null, 'oms-grid');
    [['ASSIGNED TASKS', state.tasks], ['COMPLETIONS', state.completions],
     ['EVOLUTION EVENTS', state.events]].forEach(function (item) {
      var card = el('div', null, 'oms-card');
      card.appendChild(el('b', String(item[1])));
      card.appendChild(el('span', item[0]));
      grid.appendChild(card);
    });
    host.appendChild(grid);
    host.appendChild(el('p', state.note, 'oms-note'));
  }

  async function load() {
    var sb = window.__omegaSb;
    if (!sb || !sb.auth || typeof sb.auth.getUser !== 'function') {
      mount({status:'UNAVAILABLE',tasks:0,completions:0,events:0,
        note:'Shared authenticated Supabase client unavailable. No mission state is inferred.'});
      return;
    }

    var auth = await sb.auth.getUser();
    if (auth.error || !auth.data || !auth.data.user) {
      mount({status:'UNAVAILABLE',tasks:0,completions:0,events:0,
        note:'Sign in to view member-scoped persisted mission evidence.'});
      return;
    }

    var uid = auth.data.user.id;
    var taskA = await sb.from('tasks').select('id').eq('assignee_id', uid);
    var taskB = await sb.from('tasks').select('id').eq('creator_id', uid);
    var done = await sb.from('task_completions').select('id,completed_at').eq('user_id', uid);
    var events = await sb.from('evolution_events').select('id,created_at').eq('user_id', uid);

    var errors = [taskA.error, taskB.error, done.error, events.error].filter(Boolean);
    var ids = {};
    (taskA.data || []).forEach(function (r) { ids[r.id] = true; });
    (taskB.data || []).forEach(function (r) { ids[r.id] = true; });

    mount({
      status: errors.length ? 'PARTIAL' : 'LIVE',
      tasks: Object.keys(ids).length,
      completions: (done.data || []).length,
      events: (events.data || []).length,
      note: errors.length
        ? 'Some persisted mission sources could not be read. No completion or progression is inferred from missing data.'
        : 'Read-only persisted state. Task and completion rows prove persistence, not that an award, progression, payment, ownership, or authorization rule was valid.'
    });
  }

  window.OmegaMissionState = { load: load };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
}());
