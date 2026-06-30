// ============================================================================
// FILE: /backend/src/modules/scim/domain/aggregates/provisioning.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";
import { ScimId } from "../value-objects/scim-id";

export class ProvisioningAggregate
extends AggregateRoot<ScimId>{

    createUser(){}

    updateUser(){}

    deactivateUser(){}

    createGroup(){}

    patch(){}

}
