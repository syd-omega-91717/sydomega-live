// ============================================================================
// FILE: /backend/src/modules/compliance/infrastructure/repositories/framework-mapping.repository.ts
// NEW FILE
// ============================================================================

import { FrameworkMappingAggregate }
from "../../domain/aggregates/framework-mapping.aggregate";

export interface FrameworkMappingRepository{

    save(

        aggregate:FrameworkMappingAggregate

    ):Promise<void>;

    mappings(

        framework:string

    ):Promise<FrameworkMappingAggregate[]>;

}
