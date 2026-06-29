// ============================================================================
// FILE: /backend/src/modules/oidc/infrastructure/repositories/consent.repository.ts
// NEW FILE
// ============================================================================

import { ClientConsent }
from "../../domain/entities/client-consent";

export interface ConsentRepository {

    save(

        consent: ClientConsent

    ): Promise<void>;

    find(

        userId: string,

        clientId: string

    ): Promise<ClientConsent | null>;

    revoke(

        userId: string,

        clientId: string

    ): Promise<void>;

}
