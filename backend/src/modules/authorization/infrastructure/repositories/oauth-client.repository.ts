// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/oauth-client.repository.ts
// NEW FILE
// ============================================================================

import { OAuthClientAggregate }
from "../../domain/aggregates/oauth-client.aggregate";

export interface OAuthClientRepository{

    save(

        aggregate:OAuthClientAggregate

    ):Promise<void>;

    find(

        clientId:string

    ):Promise<OAuthClientAggregate|null>;

    enabled(

    ):Promise<OAuthClientAggregate[]>;

}
