// ============================================================================
// FILE: /backend/src/modules/approval/approval.types.ts
// NEW FILE
// ============================================================================

export type ApprovalStatus =

    | "pending"

    | "approved"

    | "rejected"

    | "expired";

export interface ApprovalRequest {

    id: string;

    profile_id: string;

    request_type: string;

    requested_role: string;

    requested_plan: string;

    notes: string;

    current_status: ApprovalStatus;

    reviewed_by?: string;

    reviewed_at?: Date;

    rejection_reason?: string;

    created_at: Date;

    updated_at: Date;

}

export interface ApprovalDecision {

    founderId: string;

    requestId: string;

    reason?: string;

}

export interface ApprovalResult {

    success: boolean;

    expires_at?: Date;

    duration_seconds?: number;

}
