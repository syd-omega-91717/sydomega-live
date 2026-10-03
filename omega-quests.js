// ============================================================================
// SYD OMEGA 91717 -- QUEST SYSTEM MODULE
// Real-time quest progression, badge unlocks, engagement loop
// ============================================================================

const OmegaQuests = (() => {
  const state = {
    quests: [],
    userProgress: {},
    listeners: [],
    available: false
  };

  /* The shared client. window.OmegaSupabase is an accessor slot ({sb}) that
     bg.js fills -- calling .from() on it threw "OmegaSupabase.from is not a
     function" on every page. window.OmegaSB.get() is the publisher
     (CLAUDE.md section 8.1 class 4). */
  const client = async () => {
    try {
      if (window.OmegaSB && typeof window.OmegaSB.get === 'function') return await window.OmegaSB.get();
    } catch (e) { return null; }
    return (window.OmegaSupabase && window.OmegaSupabase.sb) || null;
  };

  // Initialize quest system
  const init = async () => {
    try {
      const quests = await fetchQuests();
      /* The quests backend (supabase/omega_quests_system.sql) is not deployed;
         without it there is no progress to read either, so stop here. */
      const progress = state.available ? await fetchUserProgress() : {};

      state.quests = quests || [];
      state.userProgress = progress || {};

      notifyListeners('init', { quests: state.quests, progress: state.userProgress });
    } catch (err) {
      console.warn('[quests] init failed:', err && err.message ? err.message : err);
    }
  };

  // Fetch all available quests
  const fetchQuests = async () => {
    const sb = await client();
    if (!sb) return [];

    const { data, error } = await sb.from('quests')
      .select('*')
      .order('domain')
      .order('title');

    if (error) {
      /* Expected while the quests table is undeployed: degrade, do not error. */
      console.warn('[quests] unavailable:', error.message);
      return [];
    }
    state.available = true;
    return data || [];
  };

  // Fetch user's quest progress
  const fetchUserProgress = async () => {
    const sb = await client();
    if (!sb) return {};

    const { data, error } = await sb.rpc('get_active_quests');

    if (error) {
      console.warn('[quests] progress unavailable:', error.message);
      return {};
    }

    const progress = {};
    (data || []).forEach(q => {
      progress[q.quest_id] = q;
    });
    return progress;
  };

  // Start a quest
  const startQuest = async (domain, questKey) => {
    const sb = await client();
    if (!sb) {
      notifyListeners('error', { msg: 'Supabase not available' });
      return false;
    }

    const { data, error } = await sb.rpc('start_quest', {
      p_quest_key: questKey,
      p_domain: domain
    });

    if (error) {
      notifyListeners('error', { msg: `Failed to start quest: ${error.message}` });
      return false;
    }

    // Refresh progress
    const updated = await fetchUserProgress();
    state.userProgress = updated;
    notifyListeners('questStarted', { domain, questKey, data });

    return data?.success === true;
  };

  // Update quest progress
  const updateProgress = async (questId, progress) => {
    const sb = await client();
    if (!sb) {
      notifyListeners('error', { msg: 'Supabase not available' });
      return false;
    }

    const { data, error } = await sb.rpc('update_quest_progress', {
      p_quest_id: questId,
      p_progress: progress
    });

    if (error) {
      notifyListeners('error', { msg: `Failed to update progress: ${error.message}` });
      return false;
    }

    if (!data?.success) {
      notifyListeners('error', { msg: 'Progress update returned false' });
      return false;
    }

    // Refresh progress
    const updated = await fetchUserProgress();
    state.userProgress = updated;

    if (data.status === 'completed') {
      notifyListeners('questCompleted', { questId, points: 100 });
    } else {
      notifyListeners('progressUpdated', { questId, progress });
    }

    return true;
  };

  // Get quest by key
  const getQuest = (domain, questKey) => {
    return state.quests.find(q => q.domain === domain && q.quest_key === questKey);
  };

  // Get user's progress on a quest
  const getProgress = (questId) => {
    return state.userProgress[questId] || null;
  };

  // Get all quests for a domain
  const getQuestsByDomain = (domain) => {
    return state.quests.filter(q => q.domain === domain);
  };

  // Get user's completed quests
  const getCompletedQuests = () => {
    return Object.values(state.userProgress)
      .filter(p => p.status === 'completed')
      .map(p => p.quest_id);
  };

  // Subscribe to changes
  const subscribe = (listener) => {
    state.listeners.push(listener);
    return () => {
      state.listeners = state.listeners.filter(l => l !== listener);
    };
  };

  // Notify all listeners
  const notifyListeners = (event, data) => {
    state.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (err) {
        console.error('Listener error:', err);
      }
    });
  };

  // Public API
  return {
    init,
    startQuest,
    updateProgress,
    getQuest,
    getProgress,
    getQuestsByDomain,
    getCompletedQuests,
    subscribe,
    getState: () => ({ ...state })
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => OmegaQuests.init());
} else {
  OmegaQuests.init();
}
