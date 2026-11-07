/* omega-origins-ui.js -- HUD, menus, dialogue and touch controls for MYTH OF THE STONES: ORIGINS, Vertical Slice 0.
 *
 * Builds plain DOM into the stage the page provides and reports what the player chose through callbacks.
 * No game rule lives here (omega-origins-logic.js) and no drawing (omega-origins-scene.js). Everything is a real
 * <button> or <input> with a text label so keyboard and screen-reader users can reach it; no inline handlers
 * (CSP ratchet), no innerHTML with data in it. Class names avoid "card" and "panel" on purpose: the platform's
 * omega-visual-evolution.css restyles any class containing them.
 * Browser global: window.OmegaOriginsUI.create(stage, handlers, L). */
(function (root) {
  'use strict';

  function el(tag, cls, text, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function btn(label, cls, onClick, attrs) {
    var b = el('button', 'og-btn ' + (cls || ''), label, Object.assign({ type: 'button' }, attrs || {}));
    b.addEventListener('click', function (e) { e.preventDefault(); onClick(e); });
    return b;
  }

  function create(stage, H, L) {
    var ui = {}, open = null;

    /* ---------- HUD ---------- */
    var hud = el('div', 'og-hud'); stage.appendChild(hud);
    var top = el('div', 'og-top'); hud.appendChild(top);
    function bar(label, cls) {
      var wrap = el('div', 'og-bar ' + cls), fill = el('div', 'og-fill'), txt = el('span', 'og-bartxt', label);
      wrap.appendChild(fill); wrap.appendChild(txt); top.appendChild(wrap); return { wrap: wrap, fill: fill, txt: txt, label: label };
    }
    var whoEl = el('div', 'og-who', 'AUREN VALE'); top.appendChild(whoEl);
    var hp = bar('HEALTH', 'og-hp'), st = bar('STAMINA', 'og-st'), wt = bar('WEIGHT', 'og-wt'), xp = bar('XP', 'og-xp');
    wt.wrap.setAttribute('title', 'Weight is the price of Memory. High Weight slows your dodge and your abilities.');

    var obj = el('div', 'og-objective', '', { role: 'status', 'aria-live': 'polite' }); hud.appendChild(obj);
    var objText = el('div', 'og-objtxt'), objSub = el('div', 'og-objsub'); obj.appendChild(objText); obj.appendChild(objSub);
    var arrow = el('div', 'og-arrow', '▲', { 'aria-hidden': 'true' }); obj.appendChild(arrow);

    var tools = el('div', 'og-tools'); hud.appendChild(tools);
    ui.buttons = {
      inv: btn('Bag', 'og-sm', function () { H.toggle('inventory'); }, { 'aria-label': 'Open inventory (I)' }),
      skills: btn('Skills', 'og-sm', function () { H.toggle('skills'); }, { 'aria-label': 'Open skills (K)' }),
      sound: btn('Sound', 'og-sm', function () { H.toggleSound(); }, { 'aria-label': 'Mute or unmute sound (M)' }),
      pause: btn('Menu', 'og-sm', function () { H.toggle('menu'); }, { 'aria-label': 'Open menu (Esc)' })
    };
    for (var b in ui.buttons) tools.appendChild(ui.buttons[b]);
    var pointsDot = el('span', 'og-dot', '', { 'aria-hidden': 'true' }); ui.buttons.skills.appendChild(pointsDot);

    var prompt = el('div', 'og-prompt', '', { role: 'status', 'aria-live': 'polite' }); hud.appendChild(prompt);
    var toastBox = el('div', 'og-toasts', '', { 'aria-live': 'polite' }); hud.appendChild(toastBox);
    var floats = el('div', 'og-floats', '', { 'aria-hidden': 'true' }); hud.appendChild(floats);
    var bossBar = el('div', 'og-bossbar og-hide'); var bossName = el('div', 'og-bossname', 'THE UNFINISHED GUARDIAN'), bossFill = el('div', 'og-bossfill');
    bossBar.appendChild(bossName); var bossTrack = el('div', 'og-bosstrack'); bossTrack.appendChild(bossFill); bossBar.appendChild(bossTrack); hud.appendChild(bossBar);

    /* ---------- touch controls: a floating stick on the left, actions on the right ---------- */
    var touch = el('div', 'og-touch'); hud.appendChild(touch);
    var stick = el('div', 'og-stick', '', { 'aria-hidden': 'true' }), knob = el('div', 'og-knob'); stick.appendChild(knob); touch.appendChild(stick);
    var acts = el('div', 'og-acts'); touch.appendChild(acts);
    function actBtn(label, name, aria) {
      var a = el('button', 'og-act og-act-' + name, label, { type: 'button', 'aria-label': aria });
      a.addEventListener('pointerdown', function (e) { e.preventDefault(); H.press(name); });
      acts.appendChild(a); return a;
    }
    actBtn('Strike', 'attack', 'Attack'); actBtn('Dodge', 'dodge', 'Dodge'); actBtn('Echo', 'echo', 'Echo ability'); actBtn('Use', 'interact', 'Interact'); actBtn('Salve', 'salve', 'Use a healing salve');
    var sid = null, sx = 0, sy = 0;
    function stickMove(e) {
      var dx = e.clientX - sx, dy = e.clientY - sy, m = Math.hypot(dx, dy), max = 46;
      if (m > max) { dx = dx / m * max; dy = dy / m * max; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      H.stick(dx / max, dy / max);
    }
    stick.addEventListener('pointerdown', function (e) { e.preventDefault(); sid = e.pointerId; var r = stick.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; stick.setPointerCapture(e.pointerId); stickMove(e); });
    stick.addEventListener('pointermove', function (e) { if (e.pointerId === sid) stickMove(e); });
    function stickEnd(e) { if (e.pointerId === sid) { sid = null; knob.style.transform = ''; H.stick(0, 0); } }
    stick.addEventListener('pointerup', stickEnd); stick.addEventListener('pointercancel', stickEnd);

    /* ---------- modal sheets (inventory, skills, menu, options, choice, dialogue, death, done) ---------- */
    var layer = el('div', 'og-layer og-hide'); stage.appendChild(layer);
    function sheet(title, id) {
      var s = el('section', 'og-sheet', '', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title, 'data-og-sheet': id });
      s.appendChild(el('h2', 'og-h', title)); return s;
    }
    function show(s, focusSel) {
      layer.textContent = ''; layer.appendChild(s); layer.classList.remove('og-hide'); open = s;
      var f = s.querySelector(focusSel || 'button'); if (f) setTimeout(function () { f.focus(); }, 0);
    }
    ui.hideSheet = function () { layer.classList.add('og-hide'); layer.textContent = ''; open = null; };
    ui.isOpen = function () { return !!open; };

    ui.inventory = function (p, items, cb) {
      var s = sheet('Bag', 'inventory'), grid = el('div', 'og-grid');
      for (var i = 0; i < L.INV_SLOTS; i++) {
        (function (idx) {
          var slot = p.inv[idx], def = slot && items[slot.id];
          var equipped = def && (p.equip.weapon === def.id || p.equip.charm === def.id);
          var b2 = el('button', 'og-slot' + (def ? '' : ' og-empty') + (equipped ? ' og-eq' : ''), def ? def.name + (slot.qty > 1 ? ' ×' + slot.qty : '') : 'empty', { type: 'button', 'aria-label': def ? def.name + (slot.qty > 1 ? ', quantity ' + slot.qty : '') + (equipped ? ', equipped' : '') : 'Empty slot ' + (idx + 1) });
          if (def) { b2.title = def.text; b2.addEventListener('click', function () { cb(idx); }); }
          grid.appendChild(b2);
        })(i);
      }
      s.appendChild(grid);
      s.appendChild(el('p', 'og-note', 'Select an item to use or equip it. Artifacts are kept for the codex.'));
      var row = el('div', 'og-row'); row.appendChild(btn('Close', '', H.close)); s.appendChild(row); show(s);
    };
    ui.skills = function (p, skills, cb) {
      var s = sheet('Skills — Recall', 'skills');
      s.appendChild(el('p', 'og-note', 'Free skill points: ' + L.skillPointsFree(p) + '. Each learns one node.'));
      var list = el('div', 'og-list');
      Object.keys(skills).forEach(function (id) {
        var k = skills[id], c = L.canLearn(p, id), has = L.hasSkill(p, id);
        var b3 = el('button', 'og-skill' + (has ? ' og-eq' : ''), '', { type: 'button' });
        b3.appendChild(el('b', '', k.name + (has ? ' — learned' : '')));
        b3.appendChild(el('span', '', k.text + (has || c.ok ? '' : '  (' + c.why + ')')));
        b3.disabled = !c.ok; b3.addEventListener('click', function () { cb(id); }); list.appendChild(b3);
      });
      s.appendChild(list);
      var row = el('div', 'og-row'); row.appendChild(btn('Close', '', H.close)); s.appendChild(row); show(s);
    };
    ui.menu = function (info) {
      var s = sheet('Menu', 'menu');
      s.appendChild(el('p', 'og-note', 'PROTOTYPE — Vertical Slice 0. Progress is saved in this browser only.'));
      var row = el('div', 'og-col');
      row.appendChild(btn('Resume', '', H.close));
      [1, 2, 3].forEach(function (n) {
        var line = el('div', 'og-row');
        line.appendChild(btn('Save slot ' + n, '', function () { H.save(n); }));
        line.appendChild(btn('Load slot ' + n + (info.slots[n] ? ' — ' + info.slots[n] : ' — empty'), '', function () { H.load(n); }, info.slots[n] ? {} : { disabled: 'disabled' }));
        row.appendChild(line);
      });
      row.appendChild(btn('Options', '', function () { H.toggle('options'); }));
      row.appendChild(btn('Controls', '', function () { H.toggle('controls'); }));
      row.appendChild(btn('New game', '', function () { H.newGame(); }));
      s.appendChild(row); show(s);
    };
    ui.options = function (o) {
      var s = sheet('Options', 'options'), col = el('div', 'og-col');
      function sel(label, key, opts) {
        var line = el('label', 'og-opt'); line.appendChild(el('span', '', label));
        var sl = el('select', 'og-select', '', { 'aria-label': label });
        opts.forEach(function (v) { var op = el('option', '', v); op.value = v; if (o[key] === v) op.selected = true; sl.appendChild(op); });
        sl.addEventListener('change', function () { H.option(key, sl.value); }); line.appendChild(sl); col.appendChild(line);
      }
      function chk(label, key) {
        var line = el('label', 'og-opt'); var c = el('input', '', '', { type: 'checkbox', 'aria-label': label }); c.checked = !!o[key];
        c.addEventListener('change', function () { H.option(key, c.checked); }); line.appendChild(c); line.appendChild(el('span', '', label)); col.appendChild(line);
      }
      sel('Difficulty', 'difficulty', ['story', 'normal', 'hard']);
      chk('Reduce motion (no camera shake, fewer particles)', 'reduced');
      chk('High-contrast enemy outlines and rings', 'contrast');
      chk('Large text', 'largeText');
      s.appendChild(col);
      var row = el('div', 'og-row'); row.appendChild(btn('Back', '', function () { H.toggle('menu'); })); s.appendChild(row); show(s, 'select');
    };
    ui.controls = function () {
      var s = sheet('Controls', 'controls');
      var rows = [['Move', 'W A S D or arrow keys / left stick'], ['Strike', 'J, left click or Strike'], ['Dodge', 'Shift or Space'], ['Echo', 'E (after you learn it)'],
        ['Use / read / open', 'F or Enter'], ['Healing salve', 'Q'], ['Bag, skills', 'I, K'], ['Turn the camera', 'Z and X'], ['Sound, menu', 'M, Esc']];
      var list = el('div', 'og-list'); rows.forEach(function (r) { var l = el('div', 'og-keyrow'); l.appendChild(el('b', '', r[0])); l.appendChild(el('span', '', r[1])); list.appendChild(l); });
      s.appendChild(list); var row = el('div', 'og-row'); row.appendChild(btn('Back', '', function () { H.toggle('menu'); })); s.appendChild(row); show(s);
    };
    ui.choice = function (cb) {
      var s = sheet('A memory, held in stone', 'choice');
      s.appendChild(el('p', 'og-lede', 'The stone has shown you a morning that ended four thousand years ago. You can keep the reading, or share it with the Valley Keeper who watched this shrine.'));
      var col = el('div', 'og-col');
      var k = btn('Keep the reading', 'og-big', function () { cb('keep'); });
      k.appendChild(el('span', '', 'Weight +25, one bonus skill point, Shard of Recall.'));
      var sh = btn('Share the reading', 'og-big', function () { cb('share'); });
      sh.appendChild(el('span', '', "Weight −20, Keeper's Lantern, and the Keeper walks with you."));
      col.appendChild(k); col.appendChild(sh); s.appendChild(col); show(s);
    };
    ui.dead = function (cb) {
      var s = sheet('You fall', 'dead');
      s.appendChild(el('p', 'og-lede', 'The hum goes quiet. You wake at the last checkpoint.'));
      var row = el('div', 'og-row'); row.appendChild(btn('Return to checkpoint', 'og-big', cb)); s.appendChild(row); show(s);
    };
    ui.done = function (notes, cb) {
      var s = sheet('Vertical Slice 0 — complete', 'done');
      s.appendChild(el('p', 'og-lede', 'You finished "The Hum in the Valley". This is a prototype of one valley, one quest and one boss. The rest of the world is not built.'));
      notes.forEach(function (n) { s.appendChild(el('p', 'og-note', n)); });
      var row = el('div', 'og-row'); row.appendChild(btn('Keep exploring', 'og-big', cb)); s.appendChild(row); show(s);
    };
    ui.nogl = function () {
      var s = sheet('This slice needs WebGL', 'nogl');
      s.appendChild(el('p', 'og-lede', 'Your browser or device could not start 3-D graphics, so the valley cannot be drawn. Try another browser, enable hardware acceleration, or open this page on another device. Nothing is broken on your account.'));
      stage.appendChild(layer); show(s);
    };
    var dlg = el('div', 'og-dialogue og-hide', '', { role: 'status', 'aria-live': 'polite' }), dlgWho = el('b'), dlgText = el('p'), dlgNext = btn('Continue', 'og-sm', function () { H.next(); });
    dlg.appendChild(dlgWho); dlg.appendChild(dlgText); dlg.appendChild(dlgNext); hud.appendChild(dlg);
    ui.dialogue = function (who, text) { dlg.classList.remove('og-hide'); dlgWho.textContent = who; dlgText.textContent = text; dlgNext.focus(); };
    ui.endDialogue = function () { dlg.classList.add('og-hide'); };

    /* ---------- per-frame HUD update ---------- */
    function setBar(b, v, max, text) { b.fill.style.transform = 'scaleX(' + Math.max(0, Math.min(1, v / max)) + ')'; b.txt.textContent = text || b.label; }
    ui.hud = function (p, quest, free) {
      setBar(hp, p.hp, p.hpMax, 'HEALTH ' + Math.ceil(p.hp) + '/' + p.hpMax);
      setBar(st, p.stamina, 100, 'STAMINA');
      setBar(wt, p.weight, 100, 'WEIGHT ' + Math.round(p.weight));
      var lvl = p.level, prev = L.XP_TABLE[lvl - 1], next = L.XP_TABLE[lvl] != null ? L.XP_TABLE[lvl] : prev + 1;
      setBar(xp, lvl >= L.MAX_LEVEL ? 1 : p.xp - prev, lvl >= L.MAX_LEVEL ? 1 : next - prev, 'LV ' + lvl + (lvl >= L.MAX_LEVEL ? ' MAX' : ''));
      pointsDot.style.display = free > 0 ? 'inline-block' : 'none';
    };
    ui.objective = function (text, sub, angle, show2) {
      objText.textContent = text; objSub.textContent = sub || '';
      arrow.style.display = show2 ? 'block' : 'none'; arrow.style.transform = 'rotate(' + angle + 'rad)';
    };
    ui.prompt = function (t) { prompt.textContent = t || ''; prompt.style.opacity = t ? 1 : 0; };
    ui.toast = function (t) {
      var n = el('div', 'og-toast', t); toastBox.appendChild(n);
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 3600);
      while (toastBox.children.length > 4) toastBox.removeChild(toastBox.firstChild);
    };
    ui.float = function (x, y, text, cls) {
      var n = el('div', 'og-float ' + (cls || ''), text); n.style.left = x + 'px'; n.style.top = y + 'px'; floats.appendChild(n);
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 900);
    };
    ui.boss = function (frac, visible) {
      bossBar.classList.toggle('og-hide', !visible); bossFill.style.transform = 'scaleX(' + Math.max(0, frac) + ')';
    };
    ui.flashDamage = function () { stage.classList.add('og-hurt'); setTimeout(function () { stage.classList.remove('og-hurt'); }, 160); };
    ui.setSoundLabel = function (muted) { ui.buttons.sound.textContent = muted ? 'Muted' : 'Sound'; };
    ui.setTouch = function (on) { touch.classList.toggle('og-hide', !on); };
    ui.applyOptions = function (o) {
      stage.classList.toggle('og-contrast', !!o.contrast); stage.classList.toggle('og-large', !!o.largeText);
    };
    return ui;
  }

  root.OmegaOriginsUI = { create: create };
})(typeof window !== 'undefined' ? window : globalThis);
