// ============================================================================
// FILE: /backend/src/modules/knowledge/application/commands/create-entity.command.ts
// NEW FILE
// ============================================================================

export class CreateEntityCommand{

    constructor(

        readonly type:string,

        readonly label:string

    ){}

}
