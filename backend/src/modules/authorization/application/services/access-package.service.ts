// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/access-package.service.ts
// NEW FILE
// ============================================================================

import { AccessPackage }
from "../../domain/entities/access-package";

export interface AccessPackageService{

    catalog():Promise<AccessPackage[]>;

    assign(

        packageId:string,

        principalId:string

    ):Promise<void>;

}
