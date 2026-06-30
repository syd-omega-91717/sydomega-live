// ============================================================================
// FILE: /backend/src/modules/identity/application/services/realtime-session.service.ts
// NEW FILE
// ============================================================================

export interface RealtimeSessionService{

    publish(

        sessionId:string,

        event:string,

        payload:unknown

    ):Promise<void>;

    disconnect(

        sessionId:string

    ):Promise<void>;

}
