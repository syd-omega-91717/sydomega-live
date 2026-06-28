// ============================================================================
// FILE: /backend/src/types/Profile.ts
// NEW FILE
// ============================================================================

export interface Profile {

    id: string;

    email?: string;

    approval_status?: string;

    verification_status?: string;

    account_enabled?: boolean;

    access_state?: string;

    approved_by?: string;

    approved_at?: Date;

    approval_expires_at?: Date | null;

    last_login_at?: Date;

    failed_login_count?: number;

}
