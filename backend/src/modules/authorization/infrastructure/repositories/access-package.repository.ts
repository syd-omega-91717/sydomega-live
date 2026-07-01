// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/access-package.repository.ts
// NEW FILE
// ============================================================================

import { AccessPackageAggregate }
from "../../domain/aggregates/access-package.aggregate";

export interface AccessPackageRepository{

    save(

        aggregate:AccessPackageAggregate

    ):Promise<void>;

    find(

        packageId:string

    ):Promise<AccessPackageAggregate|null>;

    published(

    ):Promise<AccessPackageAggregate[]>;

}
