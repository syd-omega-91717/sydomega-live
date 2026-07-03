// ============================================================================
// FILE: /backend/src/modules/model-registry/application/commands/deploy-model.command.ts
// NEW FILE
// ============================================================================

export class DeployModelCommand{

    constructor(

        readonly modelId:string,

        readonly environment:string

    ){}

}
