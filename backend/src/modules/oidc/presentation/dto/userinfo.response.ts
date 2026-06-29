// ============================================================================
// FILE: /backend/src/modules/oidc/presentation/dto/userinfo.response.ts
// NEW FILE
// ============================================================================

export interface UserInfoResponse {

    sub: string;

    name?: string;

    email?: string;

    email_verified?: boolean;

    picture?: string;

    locale?: string;

}
