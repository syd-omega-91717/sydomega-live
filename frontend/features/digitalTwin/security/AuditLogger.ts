// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/AuditLogger.ts
// ============================================================================

export interface AuditEvent{

    id:string;

    actor:string;

    action:string;

    resource:string;

    timestamp:number;

}

export class AuditLogger{

    private events:AuditEvent[]=[];

    write(event:AuditEvent){

        this.events.push(event);

    }

    history(){

        return this.events;

    }

}
