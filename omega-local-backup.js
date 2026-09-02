/* ==========================================================================
   Ω SYD OMEGA 91717 — LOCAL BACKUP
   Export/import helper for the localStorage-only finance pages (wealth,
   wallet, treasury, revenue, investment, expenses, budget). Those pages
   persist entirely to localStorage by design (see CLAUDE.md §8, "Finance
   pages: inconsistent persistence") rather than to Supabase — financial
   data (net worth, income, holdings) is more sensitive than most of the
   platform's other data, and this repo already has a documented history
   of real RLS/security bugs found and fixed, so the safer default here is
   to not widen what's stored server-side without an explicit decision.
   That leaves one real downside worth mitigating: cleared browser storage
   or a new device means lost data with no recovery. This module exists to
   close that specific gap, without changing the underlying storage
   decision — export writes a JSON file the user saves themselves; import
   reads one back. Nothing in this file ever makes a network request.
   ========================================================================== */
(function(){
  window.OmegaLocalBackup = {
    exportKeys: function(keys, filename){
      var data = {};
      keys.forEach(function(k){
        var v = localStorage.getItem(k);
        if (v != null) data[k] = v;
      });
      var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || 'omega-backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    },
    /* ── EVERYTHING, not just the seven finance pages ──────────────────
       exportKeys/importKeys require the caller to enumerate its own keys,
       which is why this only ever reached the 7 pages that did. A repo scan
       found 48 pages persisting to localStorage and only 5 with any export
       path: 43 pages held member data with no server copy and no way to get
       it out, so a cleared browser lost it permanently.

       These two take no key list. They match whatever the member actually
       has, which also covers keys built at runtime (omega_wr_draft_<id>) that
       no static list could enumerate.

       WHAT COUNTS AS MEMBER DATA is not decided here -- OmegaMemberState owns
       that definition (its PREFIX plus a reasoned SKIP list of ephemeral and
       server-derived keys) and exports it. A second copy would drift. If that
       module has not loaded, the prefix alone is used and the skip list is
       empty: exporting a few preference keys is harmless, silently exporting
       nothing is not.

       No credential leaves the browser: Supabase keeps its session under
       `supabase.auth.token`, which does not carry this prefix and so is never
       matched. Still nothing here makes a network request. */
    memberKeys: function(){
      var ms = window.OmegaMemberState;
      var pre = (ms && ms.prefix) || 'omega';
      var skip = (ms && ms.skip) || {};
      var out = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(pre) !== 0 || skip[k]) continue;
        if (k.indexOf('omega:cache:') === 0) continue;   // cache, not data
        out.push(k);
      }
      return out.sort();
    },

    exportAll: function(filename){
      var keys = this.memberKeys();
      this.exportKeys(keys, filename ||
        'omega-data-' + new Date().toISOString().slice(0, 10) + '.json');
      return keys.length;
    },

    /* Restores every key present in the file, not a fixed list, so a backup
       taken on a page this browser has never opened still restores. */
    importAll: function(onDone){
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = function(){
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(){
          try {
            var data = JSON.parse(reader.result);
            var ms = window.OmegaMemberState;
            var pre = (ms && ms.prefix) || 'omega';
            var restored = 0, rejected = 0;
            for (var k in data) {
              if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
              /* Only restore keys in the platform's own namespace. A file the
                 member edited, or one from elsewhere, must not be able to
                 write arbitrary localStorage. */
              if (k.indexOf(pre) !== 0 || typeof data[k] !== 'string') { rejected++; continue; }
              try { localStorage.setItem(k, data[k]); restored++; } catch (e) { rejected++; }
            }
            if (onDone) onDone(true, restored, rejected);
          } catch (e) {
            if (onDone) onDone(false, 0, 0);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },

    importKeys: function(keys, onDone){
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = function(){
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(){
          try {
            var data = JSON.parse(reader.result);
            var restored = 0;
            keys.forEach(function(k){
              if (data[k] != null) { localStorage.setItem(k, data[k]); restored++; }
            });
            if (onDone) onDone(true, restored);
          } catch (e) {
            if (onDone) onDone(false, 0);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };
})();
