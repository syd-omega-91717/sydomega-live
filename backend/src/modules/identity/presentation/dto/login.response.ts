// ============================================================================
// FILE: /backend/src/modules/identity/presentation/dto/login.response.ts
// NEW FILE
// ============================================================================

export interface LoginResponse {

    accessToken: string;

    refreshToken: string;

    refreshExpiresAt: Date;

}
