// ============================================================================
// FILE: sydomega-live-main/backend/backend.ts
// Ω SYD OMEGA 91717
// Enterprise Backend Architecture Definition
// ============================================================================

export const BackendArchitecture = {
  name: "SYD OMEGA Backend",
  version: "2.0.0",
  runtime: "Node.js",
  framework: "Express",
  language: "TypeScript",

  structure: {
    entry: "server.ts",

    configuration: [
      "config/env.ts",
      "config/database.ts",
      "config/supabase.ts"
    ],

    middleware: [
      "middleware/auth.ts",
      "middleware/logger.ts",
      "middleware/rateLimiter.ts",
      "middleware/errorHandler.ts",
      "middleware/roles.ts"
    ],

    routes: [
      "routes/auth.ts",
      "routes/profile.ts",
      "routes/search.ts",
      "routes/chatbot.ts",
      "routes/academy.ts"
    ],

    controllers: "controllers/",

    services: "services/",

    repositories: "repositories/",

    database: "database/",

    models: "models/",

    utils: "utils/"
  }
} as const;

export default BackendArchitecture;
