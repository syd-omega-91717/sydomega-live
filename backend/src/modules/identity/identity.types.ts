// ============================================================================
// FILE: /backend/src/modules/identity/identity.types.ts
// NEW FILE
// ============================================================================

export type AccountStatus =

    | "pending"

    | "approved"

    | "rejected"

    | "disabled"

    | "expired";

export interface Identity {

    id: string;

    email: string;

    username: string;

    password_hash: string;

    role: string;

    approval_status: AccountStatus;

    verification_status: string;

    account_enabled: boolean;

    access_state: string;

    last_login_at?: Date;

    failed_login_count: number;

    created_at: Date;

    updated_at: Date;

}

export interface LoginRequest {

    email: string;

    password: string;

}

export interface RegisterRequest {

    email: string;

    username: string;

    password: string;

}

export interface LoginResponse {

    accessToken: string;

    refreshToken: string;

    expiresIn: number;

}
