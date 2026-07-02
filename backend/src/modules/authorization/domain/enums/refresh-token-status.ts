// ============================================================================
// FILE: /backend/src/modules/authorization/domain/enums/refresh-token-status.ts
// NEW FILE
// ============================================================================

export enum RefreshTokenStatus{

    Active="ACTIVE",

    Rotated="ROTATED",

    Revoked="REVOKED",

    Expired="EXPIRED",

    Compromised="COMPROMISED"

}
