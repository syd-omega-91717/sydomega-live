/**
 * Hercules — Labors & Trials Tracking System
 * Tracks major challenges, their progress, and triumphs over obstacles.
 * Integrates with the overall platform's achievement and progress systems.
 */

window.OmegaHercules = window.OmegaHercules || {
  // Twelve labors of Hercules mapped to challenge archetypes
  LABORS: [
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
  ],

  THEMES: {
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
  },

  /**
   * Get labor by ID or number
   */
  getLabor: function(idOrNum) {
    return this.LABORS.find(l => l.id === idOrNum || l.num === idOrNum);
  },

  /**
   * Get theme styling for a labor
   */
  getTheme: function(laborId) {
    const labor = this.getLabor(laborId);
    return labor ? this.THEMES[labor.theme] : this.THEMES.courage;
  },

  /**
   * Calculate overall completion across all labors
   */
  getOverallProgress: function() {
    // Placeholder - would integrate with actual progress data
    return Math.floor(Math.random() * 100);
  },

  /**
   * Get all labors for a theme
   */
  getLaborsByTheme: function(theme) {
    return this.LABORS.filter(l => l.theme === theme);
  },

  /**
   * Get all labors by difficulty
   */
  getLaborsByDifficulty: function(difficulty) {
    return this.LABORS.filter(l => l.difficulty === difficulty);
  },

  /**
   * Check if all labors are complete
   */
  allLaborsComplete: function() {
    // Placeholder - would check against actual completion state
    return false;
  },

  /**
   * Register Hercules as ready
   */
  ready: true
};

// Fire event once loaded
if (window.OmegaHercules.ready) {
  window.dispatchEvent(new CustomEvent('omega:hercules-loaded', {
    detail: { labors: window.OmegaHercules.LABORS.length }
  }));
}
