// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/vault-provider.ts
// NEW FILE
// ============================================================================

import { VaultProviderId }
from "../value-objects/vault-provider-id";

import { VaultProviderType }
from "../enums/vault-provider-type";

import { VaultProviderStatus }
from "../enums/vault-provider-status";

export class VaultProvider{

    constructor(

        readonly id:VaultProviderId,

        readonly name:string,

        readonly type:VaultProviderType,

        readonly endpoint:string,

        readonly status:VaultProviderStatus,

        readonly createdAt:Date

    ){}

}
