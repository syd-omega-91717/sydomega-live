// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/entities/dead-letter-message.ts
// NEW FILE
// ============================================================================

export class DeadLetterMessage{

    constructor(

        readonly messageId:string,

        readonly topic:string,

        readonly reason:string,

        readonly retryCount:number

    ){}

}
