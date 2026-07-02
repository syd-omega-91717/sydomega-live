// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/jwks.service.ts
// NEW FILE
// ============================================================================

import { JwkKey }
from "../../domain/entities/jwk-key";

export interface JwksService{

    current():Promise<JwkKey>;

    publicKeys():Promise<JwkKey[]>;

}
