// ============================================================================
// FILE: /backend/src/modules/model-registry/domain/events/model-deployed.event.ts
// NEW FILE
// ============================================================================

export class ModelDeployedEvent{

    constructor(

        readonly deploymentId:string,

        readonly modelId:string,

        readonly environment:string

    ){}

}
