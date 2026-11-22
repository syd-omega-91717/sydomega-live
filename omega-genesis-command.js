/* ==========================================================================
   Ω SYD OMEGA 91717 — GENESIS / COMMAND HUB
   Canonical route register is config/omega-sovereign-hubs.json.
   This page-side manifest is mirrored by a blocking contract test so that
   the static deployment remains portable without runtime config-file access.

   Read-only navigation surface:
   - no database writes
   - no permission changes
   - no synthetic metrics or agent activity
   - release identity is read from the same-origin release manifest
   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaGenesisCommand) return;
  window.__omegaGenesisCommand = true;

  var root = document.querySelector('[data-omega-genesis-command]');
  if (!root) return;

  var ROUTES = Object.freeze([
    { path: '/dashboard.html', title: 'Genesis / Command', group: 'Overview', role: 'CANONICAL', kicker: 'CURRENT HUB', description: 'The primary command bridge and governed entry point.' },
    { path: '/command.html', title: 'Daily Command Brief', group: 'Overview', role: 'LEGACY', kicker: 'LEGACY ENTRY', description: 'Compatibility route retained for existing links; forwards to Today.' },
    { path: '/command-center.html', title: 'Command Center', group: 'Overview', role: 'LEGACY', kicker: 'LEGACY ENTRY', description: 'Compatibility route retained for existing links; forwards to Platform.' },
    { path: '/world.html', title: 'Omega World', group: 'World', role: 'SPECIALIST', kicker: 'WORLD MAP', description: 'Explore the 18-module world and its route-reachability evidence.' },
    { path: '/world-atlas.html', title: 'Civilization Atlas', group: 'World', role: 'SPECIALIST', kicker: 'ATLAS', description: 'Open the civilization and spatial-navigation surface.' },
    { path: '/data-observatory.html', title: 'Data Observatory', group: 'Global State', role: 'SPECIALIST', kicker: 'OBSERVED STATE', description: 'Inspect source-backed platform read models and coverage gaps.' },
    { path: '/evidence.html', title: 'Evidence Graph', group: 'Evidence', role: 'SPECIALIST', kicker: 'MEMBER EVIDENCE', description: 'Trace persisted events, tasks, and evidence within the member boundary.' },
    { path: '/replay.html', title: 'Temporal Replay', group: 'Replay & Recovery', role: 'SPECIALIST', kicker: 'READ-ONLY REPLAY', description: 'Review persisted member event history without changing historical state.' },
    { path: '/recovery.html', title: 'Continuity & Recovery', group: 'Replay & Recovery', role: 'SPECIALIST', kicker: 'CONTINUITY', description: 'Review checkpoints and recovery readiness; not a substitute for provider backups.' },
    { path: '/gateway.html', title: 'Capability Gateway', group: 'Module Access', role: 'SPECIALIST', kicker: 'CAPABILITY DIRECTORY', description: 'Browse the platform capability and route-access surfaces.' },
    { path: '/guide.html', title: 'Platform Guide', group: 'Module Access', role: 'SPECIALIST', kicker: 'HOW IT WORKS', description: 'Understand membership, progression, and the platform structure.' },
    { path: '/notifications.html', title: 'Notifications', group: 'Module Access', role: 'SPECIALIST', kicker: 'INBOX & REMINDERS', description: 'Open member notifications, reminders, and system messages.' }
  ]);

  var GROUPS = Object.freeze([
    { title: 'Overview', description: 'The canonical Genesis entry point.', paths: ['/dashboard.html'] },
    { title: 'World', description: 'Spatial context and module navigation.', paths: ['/world.html', '/world-atlas.html'] },
    { title: 'Global State', description: 'Observed state, source coverage, and known gaps.', paths: ['/data-observatory.html'] },
    { title: 'Evidence', description: 'Persisted evidence and provenance, not invented activity.', paths: ['/evidence.html'] },
    { title: 'Replay & Recovery', description: 'Read-only history and continuity controls.', paths: ['/replay.html', '/recovery.html'] },
    { title: 'Module Access', description: 'Capability discovery, guidance, and member communications.', paths: ['/gateway.html', '/guide.html', '/notifications.html'] }
  ]);

  function element(tag, className, text, parent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function localPath(path) {
    if (typeof path !== 'string' || path.charAt(0) !== '/' || path.slice(0, 2) === '//' || path.indexOf('..') !== -1) return null;
    try {
      var url = new URL(path, window.location.origin);
      return url.origin === window.location.origin ? url.pathname : null;
    } catch (error) {
      return null;
    }
  }

  function routeMap() {
    var map = Object.create(null);
    ROUTES.forEach(function (route) { map[route.path] = route; });
    return map;
  }

  function renderCard(route, parent) {
    var href = localPath(route.path);
    if (!href) return;
    if (route.role === 'CANONICAL') href += '#genesis';

    var card = element('a', 'ogc-card', null, parent);
    card.href = href;
    card.setAttribute('aria-label', route.title + ': ' + route.description);
    card.setAttribute('data-genesis-route', route.path);
    element('span', 'ogc-card-kicker', route.kicker, card);
    element('span', 'ogc-card-title', route.title, card);
    element('span', 'ogc-card-description', route.description, card);
    element('span', 'ogc-card-open', 'OPEN SURFACE', card);
  }

  function render() {
    var grid = root.querySelector('[data-genesis-route-grid]');
    var legacy = root.querySelector('[data-genesis-legacy]');
    if (!grid || !legacy) return;

    var routes = routeMap();
    clear(grid);
    clear(legacy);

    GROUPS.forEach(function (group) {
      var section = element('section', 'ogc-group');
      section.setAttribute('aria-label', group.title);
      var heading = element('div', 'ogc-group-heading', null, section);
      element('h3', 'ogc-group-title', group.title, heading);
      element('p', 'ogc-group-description', group.description, heading);
      var cards = element('div', 'ogc-cards', null, section);
      group.paths.forEach(function (path) {
        if (routes[path]) renderCard(routes[path], cards);
      });
      grid.appendChild(section);
    });

    ROUTES.filter(function (route) { return route.role === 'LEGACY'; }).forEach(function (route) {
      var href = localPath(route.path);
      if (!href) return;
      var link = element('a', 'ogc-legacy-link', null, legacy);
      link.href = href;
      link.setAttribute('data-genesis-route', route.path);
      element('span', 'ogc-legacy-name', route.title, link);
      element('span', 'ogc-legacy-note', route.description, link);
    });

    var routeStatus = root.querySelector('[data-genesis-route-status]');
    if (routeStatus) {
      routeStatus.dataset.state = 'REGISTERED';
      routeStatus.textContent = 'ROUTE REGISTER · ' + ROUTES.length + ' DESTINATIONS';
    }
  }

  function readReleaseIdentity() {
    var target = root.querySelector('[data-genesis-release]');
    if (!target) return;
    fetch('/.well-known/omega-release.json', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('Release manifest unavailable');
      return response.json();
    }).then(function (manifest) {
      var sha = manifest && manifest.commit_sha;
      if (typeof sha !== 'string' || !/^[a-f0-9]{40}$/i.test(sha)) throw new Error('Release identity invalid');
      target.dataset.state = 'AVAILABLE';
      target.textContent = 'DEPLOYED BUILD · ' + sha.slice(0, 12);
      target.setAttribute('aria-label', 'Deployed build ' + sha);
    }).catch(function () {
      target.dataset.state = 'UNAVAILABLE';
      target.textContent = 'DEPLOYED BUILD · UNAVAILABLE';
    });
  }

  render();
  readReleaseIdentity();
})();
