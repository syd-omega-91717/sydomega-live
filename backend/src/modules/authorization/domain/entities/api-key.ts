// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/api-key.ts
// NEW FILE
// ============================================================================

import { ApiKeyId }
from "../value-objects/api-key-id";

import { ApiKeyStatus }
from "../enums/api-key-status";

import { ApiKeyType }
from "../enums/api-key-type";

export class ApiKey{

    constructor(

        readonly id:ApiKeyId,

        readonly name:string,

        readonly ownerId:string,

        readonly type:ApiKeyType,

        readonly status:ApiKeyStatus,

        readonly scopes:string[],

        readonly createdAt:Date,

        readonly expiresAt:Date|null

    ){}

}
