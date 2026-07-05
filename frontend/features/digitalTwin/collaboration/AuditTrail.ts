// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/AuditTrail.ts
// ============================================================================

export interface AuditRecord{

    id:string;

    userId:string;

    action:string;

    entity:string;

    timestamp:number;

}

export class AuditTrail{

    private records:AuditRecord[]=[];

    append(record:AuditRecord){

        this.records.push(record);

    }

    all(){

        return this.records;

    }

}
