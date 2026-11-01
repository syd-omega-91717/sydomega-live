// ESLint flat config for scripts/check-dupe-keys.py. ONLY the "duplicate" rules, nothing stylistic.
// A duplicate object key, case label, function parameter or class member is a silent override: the
// later one wins at runtime and the earlier one is dead code that still reads as live in a diff.
// (FIXES_LOG 2026-11-01: a second `pages:` member in nav.js's OmegaAxis shipped dead and broke the
// launcher's group headings for a day.) Module mode: every root *.js parses as a module; script mode
// rejects the 20 root files that use import/export.
export default [{
  files: ['**/*.js'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
  rules: {
    'no-dupe-keys': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-else-if': 'error',
    'no-duplicate-case': 'error',
  },
}];
