// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/secret-vault.service.ts
// NEW FILE
// ============================================================================

import { Secret }
from "../../domain/entities/secret";

export interface SecretVaultService{

    checkout(

        secretId:string,

        principalId:string

    ):Promise<Secret>;

    rotate(

        secretId:string

    ):Promise<void>;

}
