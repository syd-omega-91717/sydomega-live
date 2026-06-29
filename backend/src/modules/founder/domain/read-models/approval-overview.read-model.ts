// ============================================================================
// FILE: /backend/src/modules/founder/domain/read-models/approval-overview.read-model.ts
// NEW FILE
// ============================================================================

export interface ApprovalOverviewReadModel {

    pending: number;

    approvedToday: number;

    rejectedToday: number;

    averageReviewSeconds: number;

    oldestPendingMinutes: number;

}
