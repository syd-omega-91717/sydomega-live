// ============================================================================
// FILE: /backend/src/modules/cost/application/commands/select-model.command.ts
// NEW FILE
// ============================================================================

export class SelectModelCommand{

    constructor(

        readonly objective:string,

        readonly budget:number

    ){}

}
