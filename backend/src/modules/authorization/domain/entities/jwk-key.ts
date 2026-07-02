// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/jwk-key.ts
// NEW FILE
// ============================================================================

import { JwkKeyId }
from "../value-objects/jwk-key-id";

import { JwkAlgorithm }
from "../enums/jwk-algorithm";

import { JwkStatus }
from "../enums/jwk-status";

export class JwkKey{

    constructor(

        readonly id:JwkKeyId,

        readonly kid:string,

        readonly algorithm:JwkAlgorithm,

        readonly publicKey:string,

        readonly privateKeyReference:string,

        readonly status:JwkStatus,

        readonly createdAt:Date

    ){}

}
