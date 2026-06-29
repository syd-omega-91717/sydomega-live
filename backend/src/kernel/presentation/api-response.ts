// ============================================================================
// FILE: /backend/src/kernel/presentation/api-response.ts
// NEW FILE
// ============================================================================

export interface ApiResponse<T> {

    success: boolean;

    data?: T;

    error?: {

        code: string;

        message: string;

    };

    correlationId: string;

    timestamp: string;

}
