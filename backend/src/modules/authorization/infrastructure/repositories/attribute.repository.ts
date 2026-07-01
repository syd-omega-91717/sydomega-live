// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/attribute.repository.ts
// NEW FILE
// ============================================================================

import { AbacAggregate }
from "../../domain/aggregates/abac.aggregate";

export interface AttributeRepository{

    save(

        aggregate:AbacAggregate

    ):Promise<void>;

    all(

    ):Promise<AbacAggregate[]>;

}
