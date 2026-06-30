// ============================================================================
// FILE: /backend/src/modules/saml/domain/entities/service-provider.ts
// NEW FILE
// ============================================================================

import { EntityId } from "../value-objects/entity-id";

export class ServiceProvider {

    constructor(

        readonly entityId: EntityId,

        readonly acsUrl: string,

        readonly sloUrl?: string

    ) {}

}
