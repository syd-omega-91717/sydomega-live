// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/api-key.repository.ts
// NEW FILE
// ============================================================================

import { ApiKeyAggregate }
from "../../domain/aggregates/api-key.aggregate";

export interface ApiKeyRepository{

    save(

        aggregate:ApiKeyAggregate

    ):Promise<void>;

    find(

        apiKeyId:string

    ):Promise<ApiKeyAggregate|null>;

    ownerKeys(

        ownerId:string

    ):Promise<ApiKeyAggregate[]>;

}
