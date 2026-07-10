// ============================================================================
// FILE: backend/services/ai/AIProvider.js
// Ω SYD OMEGA 91717
// Enterprise AI Provider Registry
// ============================================================================

export default class AIProvider {

    constructor(name, model, enabled = true) {

        this.name = name;
        this.model = model;
        this.enabled = enabled;

    }

    async generate(request) {

        throw new Error(`${this.name} provider not implemented.`);

    }

}
