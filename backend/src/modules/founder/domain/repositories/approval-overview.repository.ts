// ============================================================================
// FILE: /backend/src/modules/founder/domain/repositories/approval-overview.repository.ts
// NEW FILE
// ============================================================================

import type {

    ApprovalOverviewReadModel

}

from "../read-models/approval-overview.read-model.js";

export interface ApprovalOverviewRepository {

    getOverview():

        Promise<ApprovalOverviewReadModel>;

}
