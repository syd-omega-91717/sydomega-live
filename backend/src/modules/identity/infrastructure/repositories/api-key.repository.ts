// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/api-key.repository.ts
// NEW FILE
// ============================================================================

import { ApiKeyAggregate }
from "../../domain/aggregates/api-key.aggregate";

export interface ApiKeyRepository{

    create(

        apiKey:ApiKeyAggregate

    ):Promise<void>;

    update(

        apiKey:ApiKeyAggregate

    ):Promise<void>;

    findById(

        id:string

    ):Promise<ApiKeyAggregate|null>;

    delete(

        id:string

    ):Promise<void>;

}
