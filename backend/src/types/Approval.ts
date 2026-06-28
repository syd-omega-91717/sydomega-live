// ============================================================================
// FILE: /backend/src/types/Approval.ts
// NEW FILE
// ============================================================================

export interface ApprovalRequest {

    id: string;

    profile_id: string;

    current_status: string;

    request_type?: string;

    requested_role?: string;

    requested_plan?: string;

    reviewed_by?: string;

    reviewed_at?: Date;

    rejection_reason?: string;

}
