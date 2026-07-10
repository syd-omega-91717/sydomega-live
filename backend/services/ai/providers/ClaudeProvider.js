// ============================================================================
// FILE: backend/services/ai/providers/ClaudeProvider.js
// ============================================================================

import AIProvider from "../AIProvider.js";

export default class ClaudeProvider extends AIProvider {

    constructor() {

        super("Claude", "claude-sonnet");

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
