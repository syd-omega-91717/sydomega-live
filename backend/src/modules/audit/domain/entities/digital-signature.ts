// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/digital-signature.ts
// NEW FILE
// ============================================================================

import { DigitalSignatureId }
from "../value-objects/digital-signature-id";

import { SignatureAlgorithm }
from "../enums/signature-algorithm";

import { SignatureStatus }
from "../enums/signature-status";

export class DigitalSignature{

    constructor(

        readonly id:DigitalSignatureId,

        readonly documentHash:string,

        readonly signature:string,

        readonly certificateId:string,

        readonly algorithm:SignatureAlgorithm,

        readonly status:SignatureStatus,

        readonly signedAt:Date

    ){}

}
