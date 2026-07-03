// ============================================================================
// FILE: /backend/src/modules/model-registry/domain/entities/model-deployment.ts
// NEW FILE
// ============================================================================

import { DeploymentStrategy }
from "../enums/deployment-strategy";

export class ModelDeployment{

    constructor(

        readonly deploymentId:string,

        readonly modelId:string,

        readonly environment:string,

        readonly strategy:DeploymentStrategy,

        readonly trafficPercentage:number,

        readonly deployedAt:Date

    ){}

}
