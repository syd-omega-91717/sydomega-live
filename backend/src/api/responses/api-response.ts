// ============================================================================
// FILE: /backend/src/api/responses/api-response.ts
// NEW FILE
// ============================================================================

export interface ApiResponse<T> {

    success: boolean;

    data: T;

    timestamp: string;

}
