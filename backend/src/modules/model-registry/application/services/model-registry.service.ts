// ============================================================================
// FILE: /backend/src/modules/model-registry/application/services/model-registry.service.ts
// NEW FILE
// ============================================================================

import { Model }
from "../../domain/entities/model";

export interface ModelRegistryService{

    register(

        model:Model

    ):Promise<void>;

    deploy(

        modelId:string

    ):Promise<void>;

    rollback(

        deploymentId:string

    ):Promise<void>;

}
