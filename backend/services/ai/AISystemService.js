// ============================================================================
// FILE: backend/services/ai/AISystemService.js
// Ω SYD OMEGA 91717
// Enterprise AI Service Layer
// ============================================================================

import AIOrchestrator from "./AIOrchestrator.js";

class AISystemService {

    async chat(provider, request) {

        return AIOrchestrator.execute(provider, request);

    }

    providers() {

        return AIOrchestrator.availableProviders();

    }

}

export default new AISystemService();
