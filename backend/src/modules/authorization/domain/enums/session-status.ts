// ============================================================================
// FILE: /backend/src/modules/authorization/domain/enums/session-status.ts
// NEW FILE
// ============================================================================

export enum SessionStatus{

    Pending="PENDING",

    Active="ACTIVE",

    Idle="IDLE",

    Expired="EXPIRED",

    Revoked="REVOKED",

    LoggedOut="LOGGED_OUT"

}
