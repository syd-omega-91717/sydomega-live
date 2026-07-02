// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/refresh-token.repository.ts
// NEW FILE
// ============================================================================

import { RefreshTokenAggregate }
from "../../domain/aggregates/refresh-token.aggregate";

export interface RefreshTokenRepository{

    save(

        aggregate:RefreshTokenAggregate

    ):Promise<void>;

    findByToken(

        token:string

    ):Promise<RefreshTokenAggregate|null>;

}
