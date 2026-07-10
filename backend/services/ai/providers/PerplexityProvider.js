// ============================================================================
// FILE: backend/services/ai/providers/PerplexityProvider.js
// ============================================================================

import AIProvider from "../AIProvider.js";

export default class PerplexityProvider extends AIProvider {

    constructor() {

        super("Perplexity", "sonar-pro");

    }

    async generate(payload) {

        return {

            provider: this.name,

            model: this.model,

            success: true,

            output: payload

        };

    }

}
