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
    { id: 'lion', num: 1, title: 'Nemean Lion', theme: 'courage', difficulty: 'legendary' },
    { id: 'hydra', num: 2, title: 'Lernaean Hydra', theme: 'persistence', difficulty: 'extreme' },
    { id: 'hind', num: 3, title: 'Golden Hind', theme: 'wisdom', difficulty: 'high' },
    { id: 'boar', num: 4, title: 'Erymanthian Boar', theme: 'mastery', difficulty: 'high' },
    { id: 'stables', num: 5, title: 'Augean Stables', theme: 'clarity', difficulty: 'medium' },
    { id: 'birds', num: 6, title: 'Stymphalian Birds', theme: 'discernment', difficulty: 'medium' },
    { id: 'bull', num: 7, title: 'Cretan Bull', theme: 'restraint', difficulty: 'high' },
    { id: 'mares', num: 8, title: 'Mares of Diomedes', theme: 'control', difficulty: 'extreme' },
    { id: 'girdle', num: 9, title: 'Girdle of Hippolyta', theme: 'strategy', difficulty: 'medium' },
    { id: 'cattle', num: 10, title: 'Cattle of Geryon', theme: 'vision', difficulty: 'high' },
    { id: 'apples', num: 11, title: 'Apples of Hesperides', theme: 'humility', difficulty: 'extreme' },
    { id: 'cerberus', num: 12, title: 'Cerberus', theme: 'transcendence', difficulty: 'legendary' }
  ];

  /**
   * @type {Object<string, {color: string, icon: string}>}
   * Theme mapping for each labor: color and icon representation
   */
  const THEMES = {
    courage: { color: '#EF4444', icon: '⚔' },
    persistence: { color: '#F59E0B', icon: '🔥' },
    wisdom: { color: '#3B82F6', icon: '🧠' },
    mastery: { color: '#8B5CF6', icon: '✦' },
    clarity: { color: '#06B6D4', icon: '💎' },
    discernment: { color: '#EC4899', icon: '👁' },
    restraint: { color: '#6B7280', icon: '⚖' },
    control: { color: '#10B981', icon: '🌪' },
    strategy: { color: '#D97706', icon: '♟' },
    vision: { color: '#F97316', icon: '🔭' },
    humility: { color: '#06B6D4', icon: '🙏' },
    transcendence: { color: '#A855F7', icon: '✨' }
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
      if (!window.sb) return 0;

      const userId = (await window.sb.auth.getUser()).data?.user?.id;
      if (!userId) return 0;

      const { data, error } = await window.sb
        .from('task_completions')
        .select('labor_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('labor_id', LABORS.map(l => l.id));

      if (error) {
        console.warn('OmegaHercules.getOverallProgress() query failed:', error);
        return 0;
      }

      const completedLabors = new Set(data?.map(row => row.labor_id) ?? []);
      return Math.round((completedLabors.size / LABORS.length) * 100);
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
      if (!window.sb) return false;

      const userId = (await window.sb.auth.getUser()).data?.user?.id;
      if (!userId) return false;

      const { data, error } = await window.sb
        .from('task_completions')
        .select('labor_id')
        .eq('user_id', userId)
        .in('labor_id', LABORS.map(l => l.id));

      if (error) {
        console.warn('OmegaHercules.allLaborsComplete() query failed:', error);
        return false;
      }

      const completedLabors = new Set(data?.map(row => row.labor_id) ?? []);
      return completedLabors.size === LABORS.length;
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
    ready: true
  };

  // Fire initialization event
  if (window.OmegaHercules.ready) {
    window.dispatchEvent(new CustomEvent('omega:hercules-loaded', {
      detail: { labors: LABORS.length }
    }));
  }
})();
