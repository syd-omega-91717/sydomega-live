// ============================================================================
// FILE: backend/services/ai/AIOrchestrator.js
// Ω SYD OMEGA 91717
// Enterprise Multi-AI Orchestrator
// ============================================================================

import ClaudeProvider from "./providers/ClaudeProvider.js";
import GeminiProvider from "./providers/GeminiProvider.js";
import PerplexityProvider from "./providers/PerplexityProvider.js";

class AIOrchestrator {

    constructor() {

        this.providers = {

            claude: new ClaudeProvider(),

            gemini: new GeminiProvider(),

            perplexity: new PerplexityProvider()

        };

    }

    async execute(provider, payload) {

        if (!this.providers[provider]) {

            throw new Error(`Provider '${provider}' not found.`);

        }

        return this.providers[provider].generate(payload);

    }

    availableProviders() {

        return Object.keys(this.providers);

    }

}

export default new AIOrchestrator();
