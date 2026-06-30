// ============================================================================
// FILE: /backend/src/modules/identity/domain/enums/session-event-type.ts
// NEW FILE
// ============================================================================

export enum SessionEventType{

    Created="CREATED",

    Refreshed="REFRESHED",

    Extended="EXTENDED",

    Suspended="SUSPENDED",

    Revoked="REVOKED",

    Expired="EXPIRED",

    Logout="LOGOUT"

}
