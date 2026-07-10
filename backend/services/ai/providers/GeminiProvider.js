// ============================================================================
// FILE: backend/services/ai/providers/GeminiProvider.js
// ============================================================================

import AIProvider from "../AIProvider.js";

export default class GeminiProvider extends AIProvider {

    constructor() {

        super("Gemini", "gemini-2.5-pro");

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
