// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/federation-provider.ts
// NEW FILE
// ============================================================================

import { FederationProviderId }
from "../value-objects/federation-provider-id";

import { FederationProtocol }
from "../enums/federation-protocol";

import { FederationProviderStatus }
from "../enums/federation-provider-status";

export class FederationProvider{

    constructor(

        readonly id:FederationProviderId,

        readonly name:string,

        readonly protocol:FederationProtocol,

        readonly issuer:string,

        readonly metadataUrl:string,

        readonly status:FederationProviderStatus

    ){}

}
