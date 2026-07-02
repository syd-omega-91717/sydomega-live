// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/jwk.repository.ts
// NEW FILE
// ============================================================================

import { JwkAggregate }
from "../../domain/aggregates/jwk.aggregate";

export interface JwkRepository{

    save(

        aggregate:JwkAggregate

    ):Promise<void>;

    primary(

    ):Promise<JwkAggregate>;

    active(

    ):Promise<JwkAggregate[]>;

}
