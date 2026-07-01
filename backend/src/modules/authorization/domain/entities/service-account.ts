// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/service-account.ts
// NEW FILE
// ============================================================================

import { ServiceAccountId }
from "../value-objects/service-account-id";

import { ServiceAccountStatus }
from "../enums/service-account-status";

import { ServiceAccountType }
from "../enums/service-account-type";

export class ServiceAccount{

    constructor(

        readonly id:ServiceAccountId,

        readonly name:string,

        readonly type:ServiceAccountType,

        readonly status:ServiceAccountStatus,

        readonly ownerId:string,

        readonly createdAt:Date

    ){}

}
