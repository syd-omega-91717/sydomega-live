// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/entities/event-topic.ts
// NEW FILE
// ============================================================================

export class EventTopic{

    constructor(

        readonly topic:string,

        readonly partitions:number,

        readonly replicas:number,

        readonly retentionHours:number

    ){}

}
