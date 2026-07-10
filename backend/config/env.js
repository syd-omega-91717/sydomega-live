// ============================================================================
// FILE: sydomega-live-main/backend/config/env.js
// Ω SYD OMEGA 91717
// Enterprise Environment Configuration
// ============================================================================

import dotenv from "dotenv";

dotenv.config();

const required = [
  "PORT",
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE"
];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[ENV] Missing required variable: ${key}`);
  }
}

const env = Object.freeze({

  NODE_ENV: process.env.NODE_ENV ?? "development",

  PORT: Number(process.env.PORT ?? 4000),

  APP_NAME: process.env.APP_NAME ?? "Ω SYD OMEGA 91717",

  APP_VERSION: process.env.APP_VERSION ?? "2.0.0",

  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",

  API_URL: process.env.API_URL ?? "http://localhost:4000",

  JWT_SECRET: process.env.JWT_SECRET ?? "",

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",

  SUPABASE_URL: process.env.SUPABASE_URL ?? "",

  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE ?? "",

  DATABASE_URL: process.env.DATABASE_URL ?? "",

  REDIS_URL: process.env.REDIS_URL ?? "",

  OPENAI_KEY: process.env.OPENAI_KEY ?? "",

  CLAUDE_KEY: process.env.CLAUDE_KEY ?? "",

  GEMINI_KEY: process.env.GEMINI_KEY ?? "",

  PERPLEXITY_KEY: process.env.PERPLEXITY_KEY ?? "",

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",

  ETH_RPC_URL: process.env.ETH_RPC_URL ?? "",

  BSC_RPC_URL: process.env.BSC_RPC_URL ?? "",

  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL ?? ""

});

export default env;
