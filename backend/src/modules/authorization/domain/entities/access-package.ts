// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-package.ts
// NEW FILE
// ============================================================================

import { AccessPackageId }
from "../value-objects/access-package-id";

import { AccessPackageStatus }
from "../enums/access-package-status";

import { AccessPackageItem }
from "./access-package-item";

export class AccessPackage{

    constructor(

        readonly id:AccessPackageId,

        readonly name:string,

        readonly description:string,

        readonly status:AccessPackageStatus,

        readonly items:AccessPackageItem[]

    ){}

}
