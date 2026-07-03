// ============================================================================
// FILE: /backend/src/modules/digital-twin/application/commands/create-twin.command.ts
// NEW FILE
// ============================================================================

export class CreateTwinCommand{

    constructor(

        readonly name:string,

        readonly type:string,

        readonly tenantId:string

    ){}

}
