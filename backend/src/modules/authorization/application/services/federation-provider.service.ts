// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/federation-provider.service.ts
// NEW FILE
// ============================================================================

import { FederationProvider }
from "../../domain/entities/federation-provider";

export interface FederationProviderService{

    providers():Promise<FederationProvider[]>;

    synchronize(

        providerId:string

    ):Promise<void>;

}
