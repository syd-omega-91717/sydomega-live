// ============================================================================
// FILE: /backend/src/modules/founder/domain/repositories/founder-dashboard.repository.ts
// NEW FILE
// ============================================================================

import {

    FounderDashboard

}

from "../entities/founder-dashboard.entity.js";

export interface FounderDashboardRepository {

    overview():

        Promise<FounderDashboard>;

}
