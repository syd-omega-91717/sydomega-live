// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/federation-provider.repository.ts
// NEW FILE
// ============================================================================

import { FederationProviderAggregate }
from "../../domain/aggregates/federation-provider.aggregate";

export interface FederationProviderRepository{

    save(

        aggregate:FederationProviderAggregate

    ):Promise<void>;

    find(

        providerId:string

    ):Promise<FederationProviderAggregate|null>;

    active(

    ):Promise<FederationProviderAggregate[]>;

}
