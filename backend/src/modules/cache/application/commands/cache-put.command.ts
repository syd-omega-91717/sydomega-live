// ============================================================================
// FILE: /backend/src/modules/cache/application/commands/cache-put.command.ts
// NEW FILE
// ============================================================================

export class CachePutCommand{

    constructor(

        readonly key:string,

        readonly value:unknown,

        readonly ttl:number

    ){}

}
