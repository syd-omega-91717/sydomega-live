// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/vault-provider.service.ts
// NEW FILE
// ============================================================================

import { VaultProvider }
from "../../domain/entities/vault-provider";

export interface VaultProviderService{

    synchronize(

        providerId:string

    ):Promise<void>;

    providers():Promise<VaultProvider[]>;

}
