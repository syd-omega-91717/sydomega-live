// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/secret.ts
// NEW FILE
// ============================================================================

import { SecretId }
from "../value-objects/secret-id";

import { SecretType }
from "../enums/secret-type";

import { SecretStatus }
from "../enums/secret-status";

export class Secret{

    constructor(

        readonly id:SecretId,

        readonly name:string,

        readonly type:SecretType,

        readonly status:SecretStatus,

        readonly ownerId:string,

        readonly expiresAt:Date|null

    ){}

}
