// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/event-stream.ts
// NEW FILE
// ============================================================================

export class EventStream{

    constructor(

        readonly aggregateId:string,

        readonly streamName:string,

        readonly version:number,

        readonly lastEventNumber:number

    ){}

}
