// ============================================================================
// FILE: backend/config/AIConfiguration.js
// Ω SYD OMEGA 91717
// Enterprise AI Configuration
// ============================================================================

import env from "./env.js";

export default Object.freeze({

    defaultProvider: "claude",

    providers: {

        claude: {

            enabled: true,

            apiKey: env.CLAUDE_KEY,

            model: "claude-sonnet"

        },

        gemini: {

            enabled: true,

            apiKey: env.GEMINI_KEY,

            model: "gemini-2.5-pro"

        },

        perplexity: {

            enabled: true,

            apiKey: env.PERPLEXITY_KEY,

            model: "sonar-pro"

        }

    },

    timeout: 120000,

    retries: 3

});
