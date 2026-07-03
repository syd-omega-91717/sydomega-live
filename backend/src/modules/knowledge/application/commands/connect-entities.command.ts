// ============================================================================
// FILE: /backend/src/modules/knowledge/application/commands/connect-entities.command.ts
// NEW FILE
// ============================================================================

export class ConnectEntitiesCommand{

    constructor(

        readonly source:string,

        readonly target:string,

        readonly relation:string

    ){}

}
