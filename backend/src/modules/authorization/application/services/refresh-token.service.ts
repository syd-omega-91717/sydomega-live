// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/refresh-token.service.ts
// NEW FILE
// ============================================================================

import { RefreshToken }
from "../../domain/entities/refresh-token";

export interface RefreshTokenService{

    issue(

        sessionId:string,

        principalId:string

    ):Promise<RefreshToken>;

    rotate(

        token:string

    ):Promise<RefreshToken>;

}
