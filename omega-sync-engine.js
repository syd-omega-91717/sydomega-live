/* Ω Sync Engine - Offline-first sync, conflict resolution, data consistency
   Purpose: Keep data consistent across tabs, handle offline scenarios gracefully */

(function(){
  if(window.__omegaSyncEngine) return;
  window.__omegaSyncEngine = true;

  window.OmegaSyncEngine = {
    queue: [],
    syncInProgress: false,
    lastSync: 0,

    // Queue operations for later sync
    queueOperation: (type, table, data) => {
      this.queue.push({
        type,
        table,
        data,
        timestamp: Date.now(),
        id: Math.random().toString(36).substring(7)
      });
      
      // Auto-sync when online
      if(navigator.onLine) {
        this.sync();
      }
    },

    // Sync pending operations
    sync: async () => {
      if(this.syncInProgress || this.queue.length === 0) return;
      
      this.syncInProgress = true;
      const operations = [...this.queue];
      
      try {
        for(const op of operations) {
          await this.executeOperation(op);
          this.queue = this.queue.filter(o => o.id !== op.id);
        }
        this.lastSync = Date.now();
        this.broadcastSync();
      } catch(e) {
        console.error('Sync error:', e);
      } finally {
        this.syncInProgress = false;
      }
    },

    // Execute single operation
    executeOperation: async (op) => {
      // Implement actual sync logic here
      return new Promise(resolve => setTimeout(resolve, 100));
    },

    // Cross-tab communication
    broadcastSync: () => {
      try {
        const channel = new BroadcastChannel('omega_sync');
        channel.postMessage({
          type: 'sync_complete',
          timestamp: this.lastSync,
          queueLength: this.queue.length
        });
        channel.close();
      } catch(e) {}
    },

    // Listen for cross-tab messages
    listenForSync: () => {
      try {
        const channel = new BroadcastChannel('omega_sync');
        channel.onmessage = (e) => {
          if(e.data.type === 'sync_complete') {
            // Other tab synced, reload if needed
            if(e.data.queueLength === 0) {
              window.dispatchEvent(new CustomEvent('omega:sync-complete'));
            }
          }
        };
      } catch(e) {}
    },

    // Conflict resolution
    resolveConflict: (local, remote) => {
      // Last-write-wins strategy (can be customized)
      return remote.timestamp > local.timestamp ? remote : local;
    },

    // Handle online/offline transitions
    setupNetworkListener: () => {
      window.addEventListener('online', () => {
        console.log('Online - starting sync');
        this.sync();
      });

      window.addEventListener('offline', () => {
        console.log('Offline - queueing operations');
      });
    }
  };

  // Initialize
  OmegaSyncEngine.setupNetworkListener();
  OmegaSyncEngine.listenForSync();
})();
