// ============================================================================
// FILE: /backend/src/types/ApiResponse.ts
// NEW FILE
// ============================================================================

export interface ApiResponse<T = unknown> {

    success: boolean;

    message?: string;

    data?: T;

    errors?: unknown;

}
