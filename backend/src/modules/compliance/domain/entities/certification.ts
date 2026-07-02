// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/certification.ts
// NEW FILE
// ============================================================================

import { CertificationId }
from "../value-objects/certification-id";

import { CertificationStatus }
from "../enums/certification-status";

import { CertificationType }
from "../enums/certification-type";

export class Certification{

    constructor(

        readonly id:CertificationId,

        readonly organizationId:string,

        readonly type:CertificationType,

        readonly version:string,

        readonly status:CertificationStatus,

        readonly issuedAt:Date|null,

        readonly expiresAt:Date|null

    ){}

}
