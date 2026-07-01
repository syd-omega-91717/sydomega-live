// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/access-package.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AccessPackageId }
from "../value-objects/access-package-id";

export class AccessPackageAggregate
extends AggregateRoot<AccessPackageId>{

    create(){}

    publish(){}

    archive(){}

    addItem(){}

    removeItem(){}

}
