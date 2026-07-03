// ============================================================================
// FILE: /backend/src/modules/model-registry/infrastructure/repositories/model.repository.ts
// NEW FILE
// ============================================================================

import { ModelAggregate }
from "../../domain/aggregates/model.aggregate";

export interface ModelRepository{

    save(

        aggregate:ModelAggregate

    ):Promise<void>;

    find(

        modelId:string

    ):Promise<ModelAggregate|null>;

}
