/**
 * Hercules — Labors & Trials Tracking System
 * Tracks major challenges, their progress, and triumphs over obstacles.
 * Integrates with the overall platform's achievement and progress systems.
 * @module OmegaHercules
 * @exports {Object} OmegaHercules Public API
 */

(function() {
  'use strict';

  /**
   * @type {Array<{id: string, num: number, title: string, theme: string, difficulty: string}>}
   * Twelve labors of Hercules mapped to challenge archetypes
   */
  const LABORS = [
    { id: 'lion', num: 1, title: 'Nemean Lion', theme: 'courage', difficulty: 'legendary', desc: 'Conquer the invulnerable beast — face what cannot be harmed by ordinary means' },
    { id: 'hydra', num: 2, title: 'Lernaean Hydra', theme: 'persistence', difficulty: 'extreme', desc: 'Defeat the ever-regenerating challenge — each obstacle solved creates new ones' },
    { id: 'hind', num: 3, title: 'Golden Hind', theme: 'wisdom', difficulty: 'high', desc: 'Capture the swift and elusive goal — patience yields what force cannot' },
    { id: 'boar', num: 4, title: 'Erymanthian Boar', theme: 'mastery', difficulty: 'high', desc: 'Master the wild and untamed — transform chaos through discipline' },
    { id: 'stables', num: 5, title: 'Augean Stables', theme: 'clarity', difficulty: 'medium', desc: 'Clean the accumulated filth of neglect — massive scale, simple solution' },
    { id: 'birds', num: 6, title: 'Stymphalian Birds', theme: 'discernment', difficulty: 'medium', desc: 'Scatter the parasites — act with precision and timing' },
    { id: 'bull', num: 7, title: 'Cretan Bull', theme: 'restraint', difficulty: 'high', desc: 'Tame the raging force — submission requires understanding' },
    { id: 'mares', num: 8, title: 'Mares of Diomedes', theme: 'control', difficulty: 'extreme', desc: 'Feed the devouring hunger — confront what consumes without satisfaction' },
    { id: 'girdle', num: 9, title: 'Girdle of Hippolyta', theme: 'strategy', difficulty: 'medium', desc: 'Navigate the political labyrinth — diplomacy where force fails' },
    { id: 'cattle', num: 10, title: 'Cattle of Geryon', theme: 'vision', difficulty: 'high', desc: 'Journey to the ends of the known world — expand your boundaries' },
    { id: 'apples', num: 11, title: 'Apples of Hesperides', theme: 'humility', difficulty: 'extreme', desc: 'Find the golden treasure in impossible places — seek aid from unexpected allies' },
    { id: 'cerberus', num: 12, title: 'Cerberus', theme: 'transcendence', difficulty: 'legendary', desc: 'Return from the underworld itself — the final trial tests everything learned' }
  ];

  /**
   * Task-completion identity for a labor.
   *
   * There is no `labor_id` column on public.task_completions and never was --
   * this module used to query one, which PostgREST rejects outright (it
   * refuses the whole select when any column is unknown). Labors are recorded
   * the way every other completable action on this platform is: through
   * public.complete_task(), which writes task_name/task_type and dedups on
   * (user_id, task_name). The slug form matches the convention already live
   * in publishing.html ('first-publication').
   */
  const TASK_TYPE = 'labor';
  function taskNameFor(id) { return 'labor-' + id; }

  /**
   * Resolve the platform's Supabase client.
   *
   * bg.js exposes it as window.OmegaSB.get() (a promise), not as window.sb --
   * this module used to guard on `window.sb`, which nothing in this codebase
   * ever assigns, so every database call below returned its zero-value
   * fallback before reaching the network. window.sb is still honoured first in
   * case a page sets it.
   * @returns {Promise<Object|null>} Supabase client, or null if unavailable.
   */
  async function getSB() {
    if (window.sb) return window.sb;
    if (window.OmegaSB && typeof window.OmegaSB.get === 'function') {
      try { return await window.OmegaSB.get(); } catch (e) { return null; }
    }
    return null;
  }

  /**
   * Fetch the set of labor ids this member has recorded as complete.
   * @returns {Promise<{ids: Set<string>, error: Object|null}>} Completed ids,
   *   and the query error if one occurred (callers must not present an empty
   *   set as "nothing completed" when error is non-null).
   */
  async function completedLaborIds() {
    const sb = await getSB();
    if (!sb) return { ids: new Set(), error: { message: 'Supabase client unavailable' } };

    const userId = (await sb.auth.getUser()).data?.user?.id;
    if (!userId) return { ids: new Set(), error: { message: 'Not signed in' } };

    // No head:true here. It returns data:null by design, so the previous
    // implementation mapped over an empty array and reported 0% even on a
    // fully successful query.
    const { data, error } = await sb
      .from('task_completions')
      .select('task_name')
      .eq('user_id', userId)
      .eq('task_type', TASK_TYPE);

    if (error) {
      console.warn('OmegaHercules.completedLaborIds() query failed:', error);
      return { ids: new Set(), error: error };
    }

    const valid = new Set(LABORS.map(l => taskNameFor(l.id)));
    const ids = new Set(
      (data || [])
        .map(row => row.task_name)
        .filter(name => valid.has(name))
        .map(name => name.slice('labor-'.length))
    );
    return { ids: ids, error: null };
  }

  /**
   * Record a labor as complete for the current member.
   *
   * Deliberately passes p_points: 0. complete_task() advances an axis by
   * p_points, and deciding what a Hercules labor is worth against the
   * knowledge/self/contribution axes is a progression-balance decision for the
   * owner, not one to guess at here -- so this records the completion without
   * moving the authority score. Changing the award later is a one-number edit.
   * @param {string|number} idOrNum - Labor id ('lion') or number (1-12).
   * @returns {Promise<{ok: boolean, applied: boolean, error: string|null}>}
   *   applied is false when the labor was already recorded (RPC dedup).
   */
  async function completeLabor(idOrNum) {
    const labor = getLabor(idOrNum);
    if (!labor) return { ok: false, applied: false, error: 'Unknown labor: ' + idOrNum };

    const sb = await getSB();
    if (!sb) return { ok: false, applied: false, error: 'Supabase client unavailable' };

    // Supabase resolves to {data, error} rather than throwing -- checking
    // .error before reporting success is the rule this repo keeps relearning.
    const { data, error } = await sb.rpc('complete_task', {
      p_task_name: taskNameFor(labor.id),
      p_task_type: TASK_TYPE,
      p_axis_type: 'b',
      p_description: 'Labor ' + labor.num + ': ' + labor.title,
      p_points: 0
    });

    if (error) return { ok: false, applied: false, error: error.message || 'Write failed' };
    if (data && data.ok === false) {
      return { ok: false, applied: false, error: data.error || 'Rejected' };
    }
    return { ok: true, applied: !!(data && data.applied), error: null };
  }

  /**
   * @type {Object<string, {color: string, icon: string}>}
   * Theme mapping for each labor: color and icon representation
   */
  const THEMES = {
    courage: { color: '#EF4444', icon: '⚔' },
    persistence: { color: '#F59E0B', icon: '△' },
    wisdom: { color: '#3B82F6', icon: '⌬' },
    mastery: { color: '#8B5CF6', icon: '✦' },
    clarity: { color: '#06B6D4', icon: '◇' },
    discernment: { color: '#EC4899', icon: '◉' },
    restraint: { color: '#6B7280', icon: '⚖' },
    control: { color: '#10B981', icon: '⌇' },
    strategy: { color: '#D97706', icon: '♟' },
    vision: { color: '#F97316', icon: '⍟' },
    humility: { color: '#06B6D4', icon: '❖' },
    transcendence: { color: '#A855F7', icon: '✨︎' }
  };

  /**
   * Get labor by ID or number. Searches the LABORS array for a matching id or num.
   * @param {string|number} idOrNum - Labor ID (string) or number (1-12)
   * @returns {Object|undefined} Labor object or undefined if not found
   */
  function getLabor(idOrNum) {
    if (!LABORS || LABORS.length === 0) return undefined;
    return LABORS.find(l => l?.id === idOrNum || l?.num === idOrNum);
  }

  /**
   * Get theme styling for a labor. Returns theme colors and icons.
   * @param {string} laborId - Labor ID to look up
   * @returns {Object} Theme object with color and icon properties; defaults to courage theme
   */
  function getTheme(laborId) {
    const labor = getLabor(laborId);
    return labor && THEMES[labor.theme] ? THEMES[labor.theme] : THEMES.courage;
  }

  /**
   * Calculate overall completion percentage across all labors.
   * Queries task_completions to determine what percentage of the 12 labors have been started or completed.
   * @returns {Promise<number>} Completion percentage (0-100); returns 0 on error
   */
  async function getOverallProgress() {
    try {
      const { ids, error } = await completedLaborIds();
      if (error) return 0;
      return Math.round((ids.size / LABORS.length) * 100);
    } catch (err) {
      console.warn('OmegaHercules.getOverallProgress() exception:', err);
      return 0;
    }
  }

  /**
   * Get all labors for a given theme. Filters LABORS by theme name.
   * @param {string} theme - Theme name to filter by (e.g., 'courage', 'wisdom')
   * @returns {Array<Object>} Array of labor objects matching the theme; empty array if none found
   */
  function getLaborsByTheme(theme) {
    if (!LABORS || LABORS.length === 0) return [];
    return LABORS.filter(l => l?.theme === theme) ?? [];
  }

  /**
   * Get all labors by difficulty level. Filters LABORS by difficulty name.
   * @param {string} difficulty - Difficulty level to filter by (e.g., 'legendary', 'extreme', 'high', 'medium')
   * @returns {Array<Object>} Array of labor objects matching the difficulty; empty array if none found
   */
  function getLaborsByDifficulty(difficulty) {
    if (!LABORS || LABORS.length === 0) return [];
    return LABORS.filter(l => l?.difficulty === difficulty) ?? [];
  }

  /**
   * Check if all 12 labors have been completed by the current user.
   * Queries task_completions to verify every labor_id has at least one entry.
   * @returns {Promise<boolean>} True if all 12 labors completed, false otherwise; returns false on error
   */
  async function allLaborsComplete() {
    try {
      const { ids, error } = await completedLaborIds();
      if (error) return false;
      return ids.size === LABORS.length;
    } catch (err) {
      console.warn('OmegaHercules.allLaborsComplete() exception:', err);
      return false;
    }
  }

  // Public API
  window.OmegaHercules = {
    LABORS: LABORS,
    THEMES: THEMES,
    getLabor: getLabor,
    getTheme: getTheme,
    getOverallProgress: getOverallProgress,
    getLaborsByTheme: getLaborsByTheme,
    getLaborsByDifficulty: getLaborsByDifficulty,
    allLaborsComplete: allLaborsComplete,
    completedLaborIds: completedLaborIds,
    completeLabor: completeLabor,
    ready: true
  };

  // Fire initialization event
  if (window.OmegaHercules.ready) {
    window.dispatchEvent(new CustomEvent('omega:hercules-loaded', {
      detail: { labors: LABORS.length }
    }));
  }
})();
