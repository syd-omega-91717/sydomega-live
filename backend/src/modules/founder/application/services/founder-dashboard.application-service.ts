// ============================================================================
// FILE: /backend/src/modules/founder/application/services/founder-dashboard.application-service.ts
// NEW FILE
// ============================================================================

import type {

    FounderDashboardRepository

}

from "../../domain/repositories/founder-dashboard.repository.js";

export class FounderDashboardApplicationService {

    constructor(

        private readonly repository:

        FounderDashboardRepository

    ) {}

    public overview() {

        return this.repository.overview();

    }

}
