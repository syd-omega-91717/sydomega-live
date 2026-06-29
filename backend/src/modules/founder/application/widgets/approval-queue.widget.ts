// ============================================================================
// FILE: /backend/src/modules/founder/application/widgets/approval-queue.widget.ts
// NEW FILE
// ============================================================================

import type {

    FounderWidget

}

from "../../domain/widgets/widget.interface.js";

import type {

    ApprovalOverviewRepository

}

from "../../domain/repositories/approval-overview.repository.js";

import type {

    ApprovalOverviewReadModel

}

from "../../domain/read-models/approval-overview.read-model.js";

export class ApprovalQueueWidget

implements FounderWidget<ApprovalOverviewReadModel> {

    readonly id =

        "approval.queue";

    readonly title =

        "Approval Queue";

    readonly category =

        "operations";

    readonly version =

        "1.0.0";

    readonly refreshInterval =

        5000;

    readonly websocketChannel =

        "founder.approvals";

    constructor(

        private readonly repository:

        ApprovalOverviewRepository

    ) {}

    async load() {

        return this.repository.getOverview();

    }

}
