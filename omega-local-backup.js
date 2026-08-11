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
