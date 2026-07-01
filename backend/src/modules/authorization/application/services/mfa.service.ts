// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/mfa.service.ts
// NEW FILE
// ============================================================================

import { MfaChallenge }
from "../../domain/entities/mfa-challenge";

export interface MfaService{

    challenge(

        principalId:string

    ):Promise<MfaChallenge>;

    verify(

        challengeId:string,

        response:string

    ):Promise<boolean>;

}
