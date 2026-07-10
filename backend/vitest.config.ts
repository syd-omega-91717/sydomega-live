// ============================================================================
// FILE: /backend/vitest.config.ts
// Ω SYD OMEGA 91717
// Vitest Configuration
// ============================================================================

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
