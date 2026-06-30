// ============================================================================
// FILE: /backend/src/modules/saml/domain/entities/identity-provider.ts
// NEW FILE
// ============================================================================

import { EntityId } from "../value-objects/entity-id";

export class IdentityProvider {

    constructor(

        readonly entityId: EntityId,

        readonly ssoUrl: string,

        readonly signingCertificate: string

    ) {}

}
