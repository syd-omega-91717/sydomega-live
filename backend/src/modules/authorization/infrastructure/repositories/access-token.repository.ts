// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/access-token.repository.ts
// NEW FILE
// ============================================================================

import { AccessTokenAggregate }
from "../../domain/aggregates/access-token.aggregate";

export interface AccessTokenRepository{

    save(

        aggregate:AccessTokenAggregate

    ):Promise<void>;

    find(

        tokenId:string

    ):Promise<AccessTokenAggregate|null>;

    active(

        principalId:string

    ):Promise<AccessTokenAggregate[]>;

}
