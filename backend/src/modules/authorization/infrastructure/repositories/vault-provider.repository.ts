// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/vault-provider.repository.ts
// NEW FILE
// ============================================================================

import { VaultProviderAggregate }
from "../../domain/aggregates/vault-provider.aggregate";

export interface VaultProviderRepository{

    save(

        aggregate:VaultProviderAggregate

    ):Promise<void>;

    find(

        providerId:string

    ):Promise<VaultProviderAggregate|null>;

    connected(

    ):Promise<VaultProviderAggregate[]>;

}
